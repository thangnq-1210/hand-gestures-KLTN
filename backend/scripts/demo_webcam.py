import cv2
from app.ml.gesture_model import model, predict_from_bgr

def run_webcam(camera_id=0):
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

        label, prob = predict_from_bgr(frame_bgr, use_static_detector=False)
        text = f"{label} ({prob:.2f})"

        cv2.putText(frame_bgr, text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Webcam", frame_bgr)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_webcam()
