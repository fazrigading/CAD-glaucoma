import matplotlib

matplotlib.use("Agg")
from matplotlib import pyplot as plt
import numpy as np
import cv2
import os


def visualize_predict(result, output_dir: str) -> str:
    file_saved = "masking.png"
    output_path = os.path.join(output_dir, file_saved)

    plt.figure(figsize=(15, 15))
    plt.imshow(result, cmap="jet")
    plt.axis("off")
    plt.savefig(output_path, bbox_inches="tight", pad_inches=0)
    plt.close()

    return file_saved


def draw_masking(ori_path: str, mask_path: str, output_dir: str):
    new_mask = "new_mask.png"
    draw_mask = "draw_mask.png"

    ori_img = cv2.imread(ori_path)
    mask_img = cv2.imread(mask_path)

    if ori_img is None or mask_img is None:
        raise ValueError(f"Failed to load image: ori={ori_img is None}, mask={mask_img is None}")

    mask_img = cv2.resize(mask_img, (ori_img.shape[1], ori_img.shape[0]))

    hsv = cv2.cvtColor(mask_img, cv2.COLOR_BGR2HSV)

    lower_green = np.array([40, 40, 40])
    upper_green = np.array([80, 255, 255])

    lower_blue = np.array([100, 40, 40])
    upper_blue = np.array([140, 255, 255])

    maskgreen = cv2.inRange(hsv, lower_green, upper_green)
    maskblue = cv2.inRange(hsv, lower_blue, upper_blue)

    mask = cv2.bitwise_or(maskgreen, maskblue)

    overlay = cv2.bitwise_and(mask_img, mask_img, mask=mask)
    alpha = 0.5
    result = cv2.addWeighted(overlay, alpha, ori_img, 1 - alpha, 0)

    output = np.zeros_like(mask_img)
    output[mask > 0] = mask_img[mask > 0]

    cv2.imwrite(os.path.join(output_dir, draw_mask), result)
    cv2.imwrite(os.path.join(output_dir, new_mask), output)

    return draw_mask, new_mask
