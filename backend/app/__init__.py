import os
from flask import Flask
from app.config import DevConfig, ProdConfig
from app.extensions import init_cors
from app.routes.auth import auth_bp
from app.routes.upload import upload_bp
from app.routes.history import history_bp
from app.routes.polygon import polygon_bp
from app.routes.static import static_bp


def create_app(config_class=None):
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")

    app = Flask(__name__, static_folder=frontend_dist, static_url_path="/")

    if config_class is None:
        config_class = ProdConfig if os.getenv("FLASK_ENV") == "production" else DevConfig

    app.config.from_object(config_class)

    upload_dir = app.config["UPLOAD_FOLDER"]
    for folder in [upload_dir, app.config["RAW_FOLDER"], app.config["MASK_FOLDER"], app.config["ANNOT_FOLDER"]]:
        os.makedirs(folder, exist_ok=True)

    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    init_cors(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(polygon_bp)
    app.register_blueprint(static_bp)

    return app
