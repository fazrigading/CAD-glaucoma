import os


def clean_temp_files(folder: str):
    for item in os.listdir(folder):
        if item.startswith("temp_"):
            item_path = os.path.join(folder, item)
            if os.path.isfile(item_path):
                os.remove(item_path)
