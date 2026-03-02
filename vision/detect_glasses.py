import sys

import cv2


def detect_glasses(image_path: str) -> bool:
    image = cv2.imread(image_path)
    if image is None:
        return True

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    glasses_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml")

    if face_cascade.empty() or glasses_cascade.empty():
        return True

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    for x, y, w, h in faces:
        roi_gray = gray[y : y + h, x : x + w]
        glasses = glasses_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
        if len(glasses) > 0:
            return True

    return False


def main() -> None:
    if len(sys.argv) < 2:
        print("1")
        sys.exit(1)

    image_path = sys.argv[1]
    try:
        has_glasses = detect_glasses(image_path)
    except Exception:
        print("1")
        sys.exit(1)

    if has_glasses:
        print("1")
    else:
        print("0")


if __name__ == "__main__":
    main()

