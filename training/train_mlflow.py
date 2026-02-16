import os
import pandas as pd
from pathlib import Path
from collections import Counter

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import resnet18
from PIL import Image

import mlflow
import mlflow.pytorch
from mlflow.tracking import MlflowClient

from sklearn.model_selection import GroupShuffleSplit, train_test_split

from datetime import datetime
from app.db import SessionLocal
from app import models

# ====== CONFIG ======
NUM_CLASSES = 6
IMAGE_SIZE = 224

MODEL_NAME = os.getenv("MLFLOW_MODEL_NAME", "gesture_resnet18")
EXPERIMENT = os.getenv("MLFLOW_EXPERIMENT", "gesture-training")
TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:5000")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Training hyperparams
EPOCHS = int(os.getenv("EPOCHS", "10"))
BATCH = int(os.getenv("BATCH", "32"))
LR = float(os.getenv("LR", "1e-4"))
WEIGHT_DECAY = float(os.getenv("WEIGHT_DECAY", "0.0"))
TEST_SIZE = float(os.getenv("TEST_SIZE", "0.2"))
SEED = int(os.getenv("SEED", "42"))


class GestureDataset(Dataset):
    def __init__(self, df: pd.DataFrame, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]
        img = Image.open(row["path"]).convert("RGB")
        x = self.transform(img) if self.transform else img
        y = int(row["label"])
        return x, y


def build_model():
    m = resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, NUM_CLASSES)
    return m


def evaluate(model, loader, loss_fn):
    """Return (avg_loss, acc)."""
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            logits = model(x)
            loss = loss_fn(logits, y)

            bs = y.size(0)
            total_loss += loss.item() * bs

            pred = logits.argmax(dim=1)
            correct += (pred == y).sum().item()
            total += y.numel()

    avg_loss = total_loss / max(1, total)
    acc = correct / max(1, total)
    return avg_loss, acc

def mark_samples_trained(ids_path: str):
    ids = []
    with open(ids_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                ids.append(int(line))

    if not ids:
        print("No ids to mark trained.")
        return

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        (
            db.query(models.GestureSample)
            .filter(models.GestureSample.id.in_(ids))
            .update({models.GestureSample.trained_at: now}, synchronize_session=False)
        )
        db.commit()
        print(f"Marked {len(ids)} samples as trained_at={now.isoformat()} (UTC)")
    finally:
        db.close()

def main(manifest_csv: str, ids_path: str, out_metadata: str | None = None):
    torch.manual_seed(SEED)

    df = pd.read_csv(manifest_csv)
    df = df.dropna(subset=["path", "label", "user_id"])
    df["label"] = df["label"].astype(int)
    df["user_id"] = df["user_id"].astype(int)

    # ===== split safe =====
    n_users = df["user_id"].nunique()

    split_mode = "group_user"
    if n_users >= 2 and len(df) >= 10:
        gss = GroupShuffleSplit(n_splits=1, test_size=TEST_SIZE, random_state=SEED)
        train_idx, val_idx = next(gss.split(df, groups=df["user_id"]))
        train_df = df.iloc[train_idx]
        val_df = df.iloc[val_idx]
    else:
        split_mode = "random_fallback"
        stratify = None
        if df["label"].nunique() > 1 and df["label"].value_counts().min() >= 2:
            stratify = df["label"]

        train_df, val_df = train_test_split(
            df,
            test_size=TEST_SIZE,
            random_state=SEED,
            stratify=stratify,
        )

    if len(val_df) == 0:
        split_mode = split_mode + "+val_is_train"
        val_df = train_df.copy()

    # ===== transforms =====
    tf_train = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.3),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])
    tf_val = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    train_ds = GestureDataset(train_df, tf_train)
    val_ds = GestureDataset(val_df, tf_val)

    # num_workers=0 cho Windows cho đỡ lỗi / dễ debug
    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH, shuffle=False, num_workers=0)

    model = build_model().to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    loss_fn = nn.CrossEntropyLoss()

    # ===== MLflow =====
    mlflow.set_tracking_uri(TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT)

    # artifact: label counts
    counts = pd.DataFrame({
        "train": train_df["label"].value_counts().sort_index(),
        "val": val_df["label"].value_counts().sort_index(),
    }).fillna(0).astype(int)
    artifact_dir = Path.cwd() / "mlflow_artifacts_tmp"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    counts_path = artifact_dir / "label_counts.csv"
    counts.to_csv(counts_path, index=True)

    with mlflow.start_run() as run:
        # ---- params (rộng hơn) ----
        mlflow.log_params({
            "arch": "resnet18",
            "img_size": IMAGE_SIZE,
            "num_classes": NUM_CLASSES,
            "epochs": EPOCHS,
            "optimizer": "Adam",
            "lr": LR,
            "batch": BATCH,
            "weight_decay": WEIGHT_DECAY,
            "test_size": TEST_SIZE,
            "seed": SEED,
            "device": DEVICE,
            "split_mode": split_mode,
            "n_rows": int(len(df)),
            "n_users": int(n_users),
            "train_rows": int(len(train_df)),
            "val_rows": int(len(val_df)),
        })

        mlflow.log_artifact(str(counts_path))

        best_val_acc = -1.0
        best_epoch = 0
        best_state = None

        # ---- train loop ----
        for epoch in range(1, EPOCHS + 1):
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0

            for x, y in train_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                opt.zero_grad()
                logits = model(x)
                loss = loss_fn(logits, y)
                loss.backward()
                opt.step()

                bs = y.size(0)
                running_loss += loss.item() * bs

                pred = logits.argmax(dim=1)
                correct += (pred == y).sum().item()
                total += y.numel()

            train_loss = running_loss / max(1, total)
            train_acc = correct / max(1, total)

            val_loss, val_acc = evaluate(model, val_loader, loss_fn)

            # ---- log metrics per epoch ----
            mlflow.log_metric("train_loss", float(train_loss), step=epoch)
            mlflow.log_metric("train_acc", float(train_acc), step=epoch)
            mlflow.log_metric("val_loss", float(val_loss), step=epoch)
            mlflow.log_metric("val_acc", float(val_acc), step=epoch)

            # best
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_epoch = epoch
                best_state = {k: v.detach().cpu() for k, v in model.state_dict().items()}

        if best_state:
            model.load_state_dict(best_state)

        # ---- log final metrics ----
        mlflow.log_metric("best_val_acc", float(best_val_acc))
        mlflow.log_metric("best_epoch", int(best_epoch))

        # ---- log model ----
        mlflow.pytorch.log_model(model, artifact_path="model")
        model_uri = f"runs:/{run.info.run_id}/model"
        mv = mlflow.register_model(model_uri, MODEL_NAME)

        # ---- promote to Production ----
        client = MlflowClient()
        client.transition_model_version_stage(
            name=MODEL_NAME,
            version=mv.version,
            stage="Production",
            archive_existing_versions=True,
        )

        # ---- add registry description + tags (để hiện ở "Registered Models") ----
        desc = (
            f"arch=resnet18 | best_val_acc={best_val_acc:.4f} | best_epoch={best_epoch} | "
            f"train={len(train_df)} val={len(val_df)} | users={n_users} | "
            f"img={IMAGE_SIZE} | lr={LR} | batch={BATCH} | split={split_mode}"
        )
        client.update_model_version(name=MODEL_NAME, version=mv.version, description=desc)

        client.set_model_version_tag(MODEL_NAME, mv.version, "best_val_acc", f"{best_val_acc:.4f}")
        client.set_model_version_tag(MODEL_NAME, mv.version, "best_epoch", str(best_epoch))
        client.set_model_version_tag(MODEL_NAME, mv.version, "train_rows", str(len(train_df)))
        client.set_model_version_tag(MODEL_NAME, mv.version, "val_rows", str(len(val_df)))
        client.set_model_version_tag(MODEL_NAME, mv.version, "num_users", str(n_users))
        client.set_model_version_tag(MODEL_NAME, mv.version, "lr", str(LR))
        client.set_model_version_tag(MODEL_NAME, mv.version, "batch", str(BATCH))
        client.set_model_version_tag(MODEL_NAME, mv.version, "split_mode", split_mode)

        print(
            f"Registered: {MODEL_NAME} v{mv.version} -> Production | "
            f"best_val_acc={best_val_acc:.4f} best_epoch={best_epoch} "
            f"train={len(train_df)} val={len(val_df)} users={n_users}"
        )
        mark_samples_trained(ids_path)
        # ghi metadata cho job
        if out_metadata:
            import json
            meta = {
                "run_id": run.info.run_id,
                "model_name": MODEL_NAME,
                "model_version": int(mv.version),
                "best_val_acc": float(best_val_acc),
                "best_epoch": int(best_epoch),
                "train_rows": int(len(train_df)),
                "val_rows": int(len(val_df)),
                "n_users": int(n_users),
                "split_mode": split_mode,
            }
            with open(out_metadata, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)




if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, default=str(Path(__file__).resolve().parent / "manifest.csv"))
    parser.add_argument("--ids", type=str, default=str(Path(__file__).resolve().parent / "manifest_ids.txt"))
    parser.add_argument("--out-metadata", type=str, default=None)
    args = parser.parse_args()

    main(args.manifest, args.ids, args.out_metadata)
