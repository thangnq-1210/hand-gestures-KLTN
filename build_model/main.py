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

MODEL_PATH = "ResNet18_merged_phase2_epoch14_loss3_17_11_2025_09_27_35.pth"

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# detector dùng chung cho webcam
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
def build_model(num_classes):
    model = resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

def load_trained_model(model_path, device=DEVICE):
    model = build_model(NUM_CLASSES)
    state = torch.load(model_path, map_location=device)
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    print(f"✅ Loaded model from {model_path}")
    return model

# 3. Transform cho ảnh đầu vào
transform_infer = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

def preprocess_from_cv2(frame_bgr):
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

# 4. Hàm dự đoán 1 ảnh tĩnh
def predict_image(model, image_path):
    frame_bgr = cv2.imread(image_path)
    if frame_bgr is None:
        print(f"Không đọc được ảnh: {image_path}")
        return

    h, w = frame_bgr.shape[:2]

    # tìm tay với mediapipe (static mode)
    bbox = get_hand_bbox_from_mediapipe(frame_bgr, hands_static)

    if bbox is not None:
        x1, y1, x2, y2 = bbox
        hand_bgr = frame_bgr[y1:y2, x1:x2]
        cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), (0, 255, 0), 10)
        print(f"Phát hiện tay: bbox = {bbox}")
    else:
        hand_bgr = frame_bgr
        print("Không phát hiện được tay")

    # chuẩn hóa cho model
    input_tensor = preprocess_from_cv2(hand_bgr).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        probs = F.softmax(logits, dim=1)[0]
        pred_idx = int(torch.argmax(probs).item())
        pred_prob = float(probs[pred_idx].item())

    print(f"Ảnh: {image_path}")
    print(f" ==> Dự đoán: lớp {CLASS_NAMES[pred_idx]} (prob = {pred_prob:.4f})")

    label_text = CLASS_NAMES[pred_idx]

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 15
    thickness = 5

    (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)

    x, y = 30, 320

    pad = 20
    x1 = x - pad
    y1 = y - text_h - pad
    x2 = x + text_w + pad
    y2 = y + baseline + pad

    cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), (0, 255, 0), -1)

    cv2.putText(frame_bgr,
                label_text,
                (x, y),
                font,
                font_scale,
                (255, 0, 0),
                thickness,
                cv2.LINE_AA)

    prob_text = f"{pred_prob:.2f}"
    cv2.putText(frame_bgr,
                prob_text,
                (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 255),
                2,
                cv2.LINE_AA)

    max_width = 400
    if w > max_width:
        scale = max_width / w
        new_size = (int(w * scale), int(h * scale))
        frame_show = cv2.resize(frame_bgr, new_size, interpolation=cv2.INTER_AREA)
    else:
        frame_show = frame_bgr

    cv2.imshow("Predict Image", frame_show)
    print("Nhấn phím bất kỳ để đóng cửa sổ ảnh...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# 5. Hàm demo webcam
def run_webcam(model, camera_id=0):
    cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        print("Không mở được webcam")
        return

    print("Webcam đang chạy. Nhấn 'q' để thoát.")

    while True:
        ret, frame_bgr = cap.read()
        if not ret:
            print("Không đọc được frame từ webcam")
            break
        frame_bgr = cv2.resize(frame_bgr, (960, 540))

        # tìm bàn tay
        bbox = get_hand_bbox_from_mediapipe(frame_bgr, hands_detector)

        if bbox is not None:
            x1, y1, x2, y2 = bbox
            hand_bgr = frame_bgr[y1:y2, x1:x2]
            cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)
        else:
            hand_bgr = frame_bgr
        input_tensor = preprocess_from_cv2(hand_bgr).to(DEVICE)

        with torch.no_grad():
            logits = model(input_tensor)
            probs = F.softmax(logits, dim=1)[0]
            pred_idx = int(torch.argmax(probs).item())
            pred_prob = float(probs[pred_idx].item())

        label_text = f"{CLASS_NAMES[pred_idx]} ({pred_prob:.2f})"
        cv2.putText(frame_bgr, label_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Webcam", frame_bgr)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# 6. Main
if __name__ == "__main__":
    print("Device:", DEVICE)
    model = load_trained_model(MODEL_PATH, device=DEVICE)
    MODE = "webcam"
    if MODE == "image":
        test_image_path = "test/test5.JPG"
        predict_image(model, test_image_path)

    elif MODE == "webcam":
        run_webcam(model, camera_id=0)
