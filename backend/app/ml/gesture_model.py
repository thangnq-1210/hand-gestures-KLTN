# app/ml/gesture_model.py

import os
from pathlib import Path

import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import resnet18
from PIL import Image
import numpy as np
import mediapipe as mp

# 1. Cấu hình chung

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
NUM_CLASSES = 6
IMAGE_SIZE = 224

CLASS_NAMES = ["0", "1", "2", "3", "4", "5"]

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# Tìm đường dẫn tới file .pth trong thư mục backend/models/
ROOT_DIR = Path(__file__).resolve().parents[2]   # .../backend
MODEL_PATH = ROOT_DIR / "models" / "ResNet18_merged_phase2_epoch14_loss3_17_11_2025_09_27_35.pth"

# Mediapipe
mp_hands = mp.solutions.hands

# detector dùng chung (realtime/webcam / frame)
hands_detector = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# detector riêng cho ảnh tĩnh
hands_static = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# 2. Build & load model
def build_model(num_classes: int):
    model = resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

def load_trained_model(model_path=MODEL_PATH, device=DEVICE):
    model = build_model(NUM_CLASSES)
    state = torch.load(model_path, map_location=device)
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    print(f"✅ Loaded model from {model_path}")
    return model

# Model global, load 1 lần
model = load_trained_model()

# 3. Transform cho ảnh đầu vào
transform_infer = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

def preprocess_from_cv2(frame_bgr: np.ndarray) -> torch.Tensor:
    """Chuyển frame BGR (OpenCV) thành tensor cho model."""
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(frame_rgb)
    tensor = transform_infer(pil_img).unsqueeze(0)
    return tensor

def get_hand_bbox_from_mediapipe(frame_bgr, hands):
    h, w = frame_bgr.shape[:2]

    # Mediapipe dùng RGB
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    if not results.multi_hand_landmarks:
        return None

    # Lấy bàn tay đầu tiên
    hand_landmarks = results.multi_hand_landmarks[0]

    xs = [lm.x for lm in hand_landmarks.landmark]
    ys = [lm.y for lm in hand_landmarks.landmark]

    x_min = min(xs) * w
    x_max = max(xs) * w
    y_min = min(ys) * h
    y_max = max(ys) * h

    # mở rộng box
    margin = 0.2
    box_w = x_max - x_min
    box_h = y_max - y_min

    x_min = int(max(0, x_min - margin * box_w))
    y_min = int(max(0, y_min - margin * box_h))
    x_max = int(min(w, x_max + margin * box_w))
    y_max = int(min(h, y_max + margin * box_h))

    if x_max <= x_min or y_max <= y_min:
        return None

    return x_min, y_min, x_max, y_max

# # 4. Hàm core: dự đoán từ 1 frame BGR (OpenCV)
# def predict_from_bgr(frame_bgr: np.ndarray, use_static_detector: bool = True):
#     """
#     Nhận frame BGR (ảnh đã đọc bằng cv2), trả về (label, prob).
#     Dùng Mediapipe để crop tay nếu phát hiện được.
#     """
#     hands = hands_static if use_static_detector else hands_detector
#
#     bbox = get_hand_bbox_from_mediapipe(frame_bgr, hands)
#
#     if bbox is not None:
#         x1, y1, x2, y2 = bbox
#         hand_bgr = frame_bgr[y1:y2, x1:x2]
#     else:
#         hand_bgr = frame_bgr
#
#     input_tensor = preprocess_from_cv2(hand_bgr).to(DEVICE)
#
#     with torch.no_grad():
#         logits = model(input_tensor)
#         probs = F.softmax(logits, dim=1)[0]
#         pred_idx = int(torch.argmax(probs).item())
#         pred_prob = float(probs[pred_idx].item())
#
#     label = CLASS_NAMES[pred_idx]
#     return label, pred_prob
#
# # 5. Hàm dùng cho FastAPI: từ bytes ảnh (upload hoặc base64 decode)
# def predict_image_bytes(image_bytes: bytes):
#     """
#     Nhận image_bytes (từ UploadFile hoặc base64 decode) → trả (label, prob).
#     """
#
#     # đọc bytes thành mảng np.uint8
#     nparr = np.frombuffer(image_bytes, np.uint8)
#     frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#
#     if frame_bgr is None:
#         raise ValueError("Không decode được ảnh từ bytes")
#
#     label, prob = predict_from_bgr(frame_bgr, use_static_detector=True)
#     return label,

# 4. Hàm core: dự đoán từ 1 frame BGR (OpenCV)
def predict_from_bgr(frame_bgr: np.ndarray, use_static_detector: bool = True):
    """
    Nhận frame BGR (ảnh đã đọc bằng cv2), trả về (label, prob, has_hand).
    Dùng Mediapipe để crop tay nếu phát hiện được.
    """
    hands = hands_static if use_static_detector else hands_detector

    bbox = get_hand_bbox_from_mediapipe(frame_bgr, hands)

    # ❗ Không thấy tay: không chạy model, trả luôn no_hand
    if bbox is None:
        return "no_hand", 0.0, False

    # Có tay -> crop vùng tay
    x1, y1, x2, y2 = bbox
    hand_bgr = frame_bgr[y1:y2, x1:x2]

    input_tensor = preprocess_from_cv2(hand_bgr).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        probs = F.softmax(logits, dim=1)[0]
        pred_idx = int(torch.argmax(probs).item())
        pred_prob = float(probs[pred_idx].item())

    label = CLASS_NAMES[pred_idx]
    return label, pred_prob, True


# 5. Hàm dùng cho FastAPI: từ bytes ảnh (upload hoặc base64 decode)
def predict_image_bytes(image_bytes: bytes):
    """
    Nhận image_bytes (từ UploadFile hoặc base64 decode) → trả (label, prob, has_hand).
    """

    # đọc bytes thành mảng np.uint8
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame_bgr is None:
        raise ValueError("Không decode được ảnh từ bytes")

    label, prob, has_hand = predict_from_bgr(frame_bgr, use_static_detector=True)
    return label, prob, has_hand

