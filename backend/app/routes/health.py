from flask import Blueprint, jsonify
from app.db import get_db_connection

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    status = {"status": "ok", "database": "unknown"}

    connection = get_db_connection()
    if connection and connection.is_connected():
        status["database"] = "connected"
        connection.close()
    else:
        status["database"] = "disconnected"
        status["status"] = "degraded"

    return jsonify(status), 200 if status["status"] == "ok" else 503
