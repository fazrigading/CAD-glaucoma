import json
import os
from flask import Blueprint, current_app, jsonify, request
from app.db import get_db_connection

history_bp = Blueprint("history", __name__)


def save_prediction_to_db(patient_data, prediction_result, image_paths, doctor_id=None):
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return False

        cursor = connection.cursor()
        insert_query = """
            INSERT INTO predict
            (patient_name, age, gender, eyes_position, raw_img_path, mask_img_path,
             annot_img_path, h_cdr, v_cdr, area_cdr, diagnose, doctor_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        record = (
            patient_data["name"],
            int(patient_data["age"]),
            patient_data["gender"],
            patient_data["eyes"],
            image_paths["raw_img_path"],
            image_paths["mask_img_path"],
            image_paths["annot_img_path"],
            prediction_result["h_cdr"],
            prediction_result["v_cdr"],
            prediction_result["area_cdr"],
            prediction_result["diagnose"],
            doctor_id,
        )
        cursor.execute(insert_query, record)
        connection.commit()
        patient_id = cursor.lastrowid
        cursor.close()
        connection.close()
        return patient_id
    except Exception as e:
        current_app.logger.error(f"Error saving to database: {e}")
        return False


def update_image_paths(patient_id, image_paths):
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return False

        cursor = connection.cursor()
        update_query = """
            UPDATE predict
            SET raw_img_path = %s, mask_img_path = %s, annot_img_path = %s
            WHERE id = %s
        """
        record = (
            image_paths["raw_img_path"],
            image_paths["mask_img_path"],
            image_paths["annot_img_path"],
            patient_id,
        )
        cursor.execute(update_query, record)
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        current_app.logger.error(f"Error updating image paths: {e}")
        return False


def get_all_predictions():
    connection = None
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return None

        cursor = connection.cursor(dictionary=True)
        select_query = """
            SELECT
                id, patient_name, age, gender, eyes_position,
                raw_img_path, mask_img_path, annot_img_path,
                h_cdr, v_cdr, area_cdr, diagnose, created_time
            FROM predict
            ORDER BY created_time DESC
        """
        cursor.execute(select_query)
        results = cursor.fetchall()

        formatted = []
        for row in results:
            formatted.append({
                "id": row["id"],
                "patient_name": row["patient_name"],
                "age": row["age"],
                "gender": row["gender"],
                "eyes_position": row["eyes_position"],
                "raw_img_path": row["raw_img_path"],
                "mask_img_path": row["mask_img_path"],
                "annot_img_path": row["annot_img_path"],
                "h_cdr": float(row["h_cdr"]),
                "v_cdr": float(row["v_cdr"]),
                "area_cdr": float(row["area_cdr"]),
                "diagnose": row["diagnose"],
                "created_time": row["created_time"].strftime("%Y-%m-%d %H:%M:%S") if row["created_time"] else None,
            })
        cursor.close()
        connection.close()
        return formatted
    except Exception as e:
        current_app.logger.error(f"Error fetching predictions: {e}")
        if connection and connection.is_connected():
            connection.close()
        return None


def get_prediction_by_id(prediction_id):
    connection = None
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return None

        cursor = connection.cursor(dictionary=True)
        select_query = """
            SELECT
                id, patient_name, age, gender, eyes_position,
                raw_img_path, mask_img_path, annot_img_path,
                h_cdr, v_cdr, area_cdr, diagnose, created_time
            FROM predict
            WHERE id = %s
        """
        cursor.execute(select_query, (prediction_id,))
        result = cursor.fetchone()

        if result:
            formatted = {
                "id": result["id"],
                "patient_name": result["patient_name"],
                "age": result["age"],
                "gender": result["gender"],
                "eyes_position": result["eyes_position"],
                "raw_img_path": result["raw_img_path"],
                "mask_img_path": result["mask_img_path"],
                "annot_img_path": result["annot_img_path"],
                "h_cdr": float(result["h_cdr"]),
                "v_cdr": float(result["v_cdr"]),
                "area_cdr": float(result["area_cdr"]),
                "diagnose": result["diagnose"],
                "created_time": result["created_time"].strftime("%Y-%m-%d %H:%M:%S") if result["created_time"] else None,
            }
            cursor.close()
            connection.close()
            return formatted

        cursor.close()
        connection.close()
        return None
    except Exception as e:
        current_app.logger.error(f"Error fetching prediction: {e}")
        if connection and connection.is_connected():
            connection.close()
        return None


def delete_prediction(prediction_id):
    connection = None
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return False

        cursor = connection.cursor()
        check_query = "SELECT id FROM predict WHERE id = %s"
        cursor.execute(check_query, (prediction_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return False

        delete_query = "DELETE FROM predict WHERE id = %s"
        cursor.execute(delete_query, (prediction_id,))
        connection.commit()
        success = cursor.rowcount > 0
        cursor.close()
        connection.close()
        return success
    except Exception as e:
        current_app.logger.error(f"Error deleting prediction: {e}")
        if connection and connection.is_connected():
            connection.close()
        return False


@history_bp.route("/api/history", methods=["GET"])
def get_prediction_history():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)

    try:
        predictions = get_all_predictions()
        if predictions is None:
            return jsonify({
                "success": False,
                "message": "Gagal mengambil data history",
                "data": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }), 500

        total = len(predictions)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = predictions[start:end]

        return jsonify({
            "success": True,
            "message": "Data history berhasil diambil",
            "data": paginated,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
            "data": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
        }), 500


@history_bp.route("/api/history/<int:prediction_id>", methods=["GET"])
def get_prediction_detail(prediction_id):
    try:
        prediction = get_prediction_by_id(prediction_id)
        if prediction:
            return jsonify({
                "success": True,
                "message": "Data prediksi berhasil diambil",
                "data": prediction,
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Data prediksi tidak ditemukan",
                "data": None,
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
            "data": None,
        }), 500


@history_bp.route("/api/history/<int:prediction_id>", methods=["DELETE"])
def delete_prediction_data(prediction_id):
    try:
        prediction = get_prediction_by_id(prediction_id)
        if not prediction:
            return jsonify({
                "success": False,
                "message": "Data tidak ditemukan",
            }), 404

        success = delete_prediction(prediction_id)
        if success:
            for path_key in ["raw_img_path", "mask_img_path", "annot_img_path"]:
                file_path = prediction.get(path_key)
                if file_path:
                    clean_path = file_path.replace("\\", "/")
                    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], clean_path)
                    real_path = os.path.realpath(full_path)
                    real_upload = os.path.realpath(current_app.config["UPLOAD_FOLDER"])
                    if real_path.startswith(real_upload) and os.path.exists(real_path):
                        os.remove(real_path)

            return jsonify({
                "success": True,
                "message": f"Data prediksi dengan ID {prediction_id} berhasil dihapus",
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": f"Gagal menghapus data prediksi dengan ID {prediction_id}",
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
        }), 500
