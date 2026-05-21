from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from skimage.measure import label, regionprops
import tensorflow as tf
import numpy as np
import os

_model = None


def mean_px_acc(y_true, y_pred):
    y_pred = tf.argmax(y_pred, axis=-1)
    y_true = tf.argmax(y_true, axis=-1)
    correct_pixels = tf.reduce_sum(tf.cast(tf.equal(y_true, y_pred), tf.float32), axis=[1, 2])
    total_pixels = tf.reduce_sum(tf.ones_like(y_true, dtype=tf.float32), axis=[1, 2])
    return tf.reduce_mean(correct_pixels / total_pixels)


def get_model(model_path: str):
    global _model
    if _model is None:
        _model = load_model(
            model_path,
            custom_objects={"mean_px_acc": mean_px_acc},
            compile=False,
        )
    return _model


def ev_cdr(img_path: str, model_path: str, threshold: float = 0.5, img_size: int = 128):
    img = tf.io.read_file(img_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, (img_size, img_size), method="nearest")
    img = tf.cast(img, tf.float32) / 255.0
    img = tf.expand_dims(img, axis=0)

    model = get_model(model_path)
    pred_mask = model.predict(img, verbose=0)
    v_mask = np.squeeze(pred_mask)

    cup_mask = tf.where(pred_mask[..., 1] > threshold, 1, 0)
    disc_mask = tf.where(pred_mask[..., 2] > threshold, 1, 0)

    cup_props = regionprops(label(cup_mask.numpy()))
    disc_props = regionprops(label(disc_mask.numpy()))

    if not cup_props or not disc_props:
        raise ValueError("No connected components found in mask")

    cup_bbox = cup_props[0].bbox
    disc_bbox = disc_props[0].bbox

    cup_width = cup_bbox[3] - cup_bbox[1]
    cup_height = cup_bbox[2] - cup_bbox[0]
    disc_width = disc_bbox[3] - disc_bbox[1]
    disc_height = disc_bbox[2] - disc_bbox[0]

    disc_crop = img[0, disc_bbox[0] : disc_bbox[2], disc_bbox[1] : disc_bbox[3], :]

    h, w, c = disc_crop.shape
    mid = w // 2
    left = disc_crop[:, :mid, :]
    right = disc_crop[:, mid:, :]

    left_green = left[..., 1]
    right_green = right[..., 1]

    left_intensity = tf.reduce_sum(left_green).numpy()
    right_intensity = tf.reduce_sum(right_green).numpy()

    if left_intensity > right_intensity:
        eye_side = "Kanan"
    elif left_intensity < right_intensity:
        eye_side = "Kiri"
    else:
        eye_side = "Tidak diketahui"

    h_cdr = cup_width / disc_width if disc_width > 0 else 0.0
    v_cdr = cup_height / disc_height if disc_height > 0 else 0.0
    area_cdr = np.sum(cup_mask) / np.sum(np.logical_or(disc_mask, cup_mask))

    return {
        "area_cdr": area_cdr,
        "horizontal_cdr": h_cdr,
        "vertical_cdr": v_cdr,
        "predict": v_mask,
        "eye_side": eye_side,
    }
