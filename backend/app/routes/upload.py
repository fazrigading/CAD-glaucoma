import os
from flask import Blueprint, request, jsonify, send_from_directory, url_for, session, current_app
from werkzeug.utils import secure_filename
from app.services.ml import ev_cdr
from app.services.visualization import visualize_predict, draw_masking
from app.services.storage import clean_temp_files
from app.routes.history import save_prediction_to_db, update_image_paths

upload_bp = Blueprint("upload", __name__)


def _allowed_file(filename: str) -> bool:
    allowed = current_app.config["ALLOWED_IMAGE_EXTENSIONS"]
    return os.path.splitext(filename)[1].lower() in allowed


@upload_bp.route("/api/upload", methods=["POST"])
def predict_image():
    nama = request.form.get("nama")
    umur = request.form.get("umur")
    gender = request.form.get("gender")
    posisi = request.form.get("posisi")
    gambar = request.files.get("gambar")

    if not gambar:
        return jsonify({"error": "Tidak ada gambar yang diunggah"}), 400

    if not _allowed_file(gambar.filename or ""):
        return jsonify({"error": "Format file tidak didukung. Gunakan JPG atau PNG."}), 400

    clean_temp_files(current_app.config["RAW_FOLDER"])

    original_filename = secure_filename(gambar.filename)
    file_extension = os.path.splitext(original_filename)[1].lower()

    temp_filename = f"temp_raw{file_extension}"
    temp_gambar_path = os.path.join(current_app.config["RAW_FOLDER"], temp_filename)
    gambar.save(temp_gambar_path)

    result = ev_cdr(temp_gambar_path, current_app.config["MODEL_PATH"])
    diagnose = "Glaucoma" if result["vertical_cdr"] > current_app.config["CDR_THRESHOLD"] else "Non Glaucoma"

    patient_data = {
        "name": nama,
        "age": umur,
        "gender": gender,
        "eyes": result["eye_side"],
    }

    masking = visualize_predict(result["predict"], current_app.config["UPLOAD_FOLDER"])
    temp_mask_path = os.path.join(current_app.config["UPLOAD_FOLDER"], masking)
    draw_mask, new_mask = draw_masking(temp_gambar_path, temp_mask_path, current_app.config["UPLOAD_FOLDER"])

    prediction_result = {
        "h_cdr": round(result["horizontal_cdr"], 2),
        "v_cdr": round(result["vertical_cdr"], 2),
        "area_cdr": round(result["area_cdr"], 2),
        "diagnose": diagnose,
    }

    temp_image_paths = {
        "raw_img_path": temp_gambar_path,
        "mask_img_path": temp_mask_path,
        "annot_img_path": os.path.join(current_app.config["UPLOAD_FOLDER"], draw_mask),
    }

    doctor_id = session.get("user_id")
    patient_id = save_prediction_to_db(patient_data, prediction_result, temp_image_paths, doctor_id)

    if patient_id:
        final_raw_filename = f"{patient_id}_raw{file_extension}"
        final_mask_filename = f"{patient_id}_masking.jpg"
        final_new_mask_filename = f"{patient_id}_new_mask.jpg"
        final_draw_mask_filename = f"{patient_id}_draw_mask.jpg"

        final_raw_path = os.path.join(current_app.config["RAW_FOLDER"], final_raw_filename)
        final_mask_path = os.path.join(current_app.config["MASK_FOLDER"], final_mask_filename)
        final_new_mask_path = os.path.join(current_app.config["MASK_FOLDER"], final_new_mask_filename)
        final_draw_mask_path = os.path.join(current_app.config["ANNOT_FOLDER"], final_draw_mask_filename)

        for src, dst in [
            (temp_gambar_path, final_raw_path),
            (temp_mask_path, final_mask_path),
            (os.path.join(current_app.config["UPLOAD_FOLDER"], new_mask), final_new_mask_path),
            (os.path.join(current_app.config["UPLOAD_FOLDER"], draw_mask), final_draw_mask_path),
        ]:
            if os.path.exists(dst):
                os.remove(dst)
            os.rename(src, dst)

        updated_image_paths = {
            "raw_img_path": final_raw_path,
            "mask_img_path": final_mask_path,
            "annot_img_path": final_draw_mask_path,
        }
        update_image_paths(patient_id, updated_image_paths)
        db_save_success = True
    else:
        db_save_success = False
        final_raw_filename = temp_filename
        final_mask_filename = masking
        final_draw_mask_filename = draw_mask

    if patient_id:
        gambar_url = url_for("upload.uploaded_image", filename=f"raw/{final_raw_filename}", _external=True)
        mask_url = url_for("upload.uploaded_image", filename=f"mask/{final_new_mask_filename}", _external=True)
        draw_mask_url = url_for("upload.uploaded_image", filename=f"annot/{final_draw_mask_filename}", _external=True)
    else:
        gambar_url = url_for("upload.uploaded_image", filename=f"raw/{final_raw_filename}", _external=True)
        mask_url = url_for("upload.uploaded_image", filename=final_mask_filename, _external=True)
        draw_mask_url = url_for("upload.uploaded_image", filename=final_draw_mask_filename, _external=True)

    message = (
        f"Prediksi berhasil dan data tersimpan ke database dengan ID: {patient_id}"
        if db_save_success
        else "Prediksi berhasil tetapi gagal menyimpan ke database"
    )

    return jsonify({
        "message": message,
        "patient_id": patient_id if patient_id else None,
        "nama": nama,
        "umur": umur,
        "gender": gender,
        "posisi": result["eye_side"],
        "gambar_url": gambar_url,
        "mask_url": mask_url,
        "draw_url": draw_mask_url,
        "v_cdr": round(result["vertical_cdr"], 2),
        "h_cdr": round(result["horizontal_cdr"], 2),
        "area_cdr": round(result["area_cdr"], 2),
        "diagnose": diagnose,
        "db_saved": db_save_success,
    }), 200


@upload_bp.route("/uploads/<path:filename>")
def uploaded_image(filename):
    safe_path = os.path.normpath(filename)
    if safe_path.startswith("..") or safe_path.startswith("/"):
        return jsonify({"error": "Invalid path"}), 400
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)


@upload_bp.route("/api/uploads/<path:filename>", methods=["GET"])
def uploaded_image_api(filename):
    safe_path = os.path.normpath(filename)
    if safe_path.startswith("..") or safe_path.startswith("/"):
        return jsonify({"error": "Invalid path"}), 400
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
