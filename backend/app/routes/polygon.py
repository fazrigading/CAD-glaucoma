import json
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db_connection

polygon_bp = Blueprint("polygon", __name__)


def update_polygon_data(patient_id, polygon_data, doctor_id=None):
    connection = None
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return False

        cursor = connection.cursor()
        disc_class_json = json.dumps(polygon_data.get("disc_polygons", []))
        cup_class_json = json.dumps(polygon_data.get("cup_polygons", []))
        calculated_cdr = polygon_data.get("calculated_cdr", {})

        if calculated_cdr:
            v_cdr_value = calculated_cdr.get("v_cdr")
            diagnose = "Glaucoma" if v_cdr_value and v_cdr_value > 0.5 else "Non Glaucoma"
            update_query = """
                UPDATE predict
                SET disc_class = %s, cup_class = %s, v_cdr = %s, h_cdr = %s, area_cdr = %s, diagnose = %s, doctor_id = %s
                WHERE id = %s
            """
            record = (
                disc_class_json,
                cup_class_json,
                calculated_cdr.get("v_cdr"),
                calculated_cdr.get("h_cdr"),
                calculated_cdr.get("area_cdr"),
                diagnose,
                doctor_id,
                patient_id,
            )
        else:
            update_query = """
                UPDATE predict
                SET disc_class = %s, cup_class = %s, doctor_id = %s
                WHERE id = %s
            """
            record = (disc_class_json, cup_class_json, doctor_id, patient_id)

        cursor.execute(update_query, record)
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        current_app.logger.error(f"Error saving polygon data: {e}")
        if connection and connection.is_connected():
            connection.close()
        return False


def get_polygon_data(patient_id):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        if not connection or not connection.is_connected():
            return None

        cursor = connection.cursor()
        select_query = "SELECT disc_class, cup_class FROM predict WHERE id = %s"
        cursor.execute(select_query, (patient_id,))
        result = cursor.fetchone()

        if result:
            disc_class, cup_class = result
            try:
                disc_polygons = json.loads(disc_class) if disc_class else []
            except (json.JSONDecodeError, TypeError):
                disc_polygons = []
            try:
                cup_polygons = json.loads(cup_class) if cup_class else []
            except (json.JSONDecodeError, TypeError):
                cup_polygons = []

            cursor.close()
            connection.close()
            return {"disc_polygons": disc_polygons, "cup_polygons": cup_polygons}

        cursor.close()
        connection.close()
        return None
    except Exception as e:
        current_app.logger.error(f"Error fetching polygon data: {e}")
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
        return None


@polygon_bp.route("/api/save-polygon/<int:patient_id>", methods=["POST"])
def save_polygon(patient_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Data polygon tidak ditemukan",
            }), 400

        required_fields = ["disc_polygons", "cup_polygons"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Field {field} diperlukan",
                }), 400

        doctor_info = data.get("doctor_info") or {}
        doctor_id = doctor_info.get("id")
        doctor_name = doctor_info.get("name") or doctor_info.get("username") or "Dummy User"

        success = update_polygon_data(patient_id, data, doctor_id)

        if success:
            if "calculated_cdr" in data:
                v_cdr_value = data["calculated_cdr"].get("v_cdr")
                diagnose = "Glaucoma" if v_cdr_value and v_cdr_value > 0.5 else "Non Glaucoma"
                message = f"Polygon data, CDR, dan diagnosa ({diagnose}) berhasil disimpan oleh {doctor_name}"
            else:
                message = f"Polygon data berhasil disimpan oleh {doctor_name}"

            return jsonify({
                "success": True,
                "message": message,
                "patient_id": patient_id,
                "doctor_name": doctor_name,
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Gagal menyimpan polygon data",
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
        }), 500


@polygon_bp.route("/api/get-polygon/<int:patient_id>", methods=["GET"])
def get_polygon(patient_id):
    try:
        polygon_data = get_polygon_data(patient_id)
        if polygon_data is not None:
            return jsonify({
                "success": True,
                "message": "Polygon data berhasil diambil",
                "data": polygon_data,
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Polygon data tidak ditemukan",
                "data": None,
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
            "data": None,
        }), 500
