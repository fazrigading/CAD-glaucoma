from flask import Blueprint, request, send_from_directory, current_app

static_bp = Blueprint("static", __name__)


def _serve_spa():
    return send_from_directory(current_app.static_folder, "index.html")


@static_bp.route("/", methods=["GET"])
def serve_index():
    return _serve_spa()


@static_bp.route("/correction", methods=["GET"])
def serve_correction():
    pid = request.args.get("patient_id")
    if pid:
        current_app.logger.info(f"Correction route accessed with patient_id={pid}")
    return _serve_spa()


@static_bp.route("/history", methods=["GET"])
def serve_history():
    return _serve_spa()


@static_bp.route("/model", methods=["GET"])
def serve_model():
    return _serve_spa()


@static_bp.route("/login", methods=["GET"])
def serve_login():
    return _serve_spa()
