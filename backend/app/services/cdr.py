import numpy as np


def get_bounding_box(mask: np.array):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)

    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]

    height = ymax - ymin + 1
    width = xmax - xmin + 1

    return ymin, ymax, xmin, xmax, height, width


def calculate_area_CDR(bcup_mask: np.array, bdisc_mask: np.array):
    cup_area = np.sum(bcup_mask)
    disc_area = np.sum(bdisc_mask)
    acdr = cup_area / disc_area if disc_area > 0 else 0.0

    d_ymin, d_ymax, d_xmin, d_xmax, d_height, d_width = get_bounding_box(bdisc_mask)
    c_ymin, c_ymax, c_xmin, c_xmax, c_height, c_width = get_bounding_box(bcup_mask)

    h_cdr = c_width / d_width if d_width > 0 else 0.0
    v_cdr = c_height / d_height if d_height > 0 else 0.0

    return [
        {
            "cup_area": cup_area,
            "disc_area": disc_area,
            "acdr": acdr,
            "h_cdr": h_cdr,
            "v_cdr": v_cdr,
        },
        {
            "d_ymin": d_ymin,
            "d_ymax": d_ymax,
            "d_xmin": d_xmin,
            "d_xmax": d_xmax,
            "d_height": d_height,
            "d_width": d_width,
            "c_ymin": c_ymin,
            "c_ymax": c_ymax,
            "c_xmin": c_xmin,
            "c_xmax": c_xmax,
            "c_height": c_height,
            "c_width": c_width,
        },
    ]
