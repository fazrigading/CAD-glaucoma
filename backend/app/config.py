import os


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-me")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "cad_glaucoma_app")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    RAW_FOLDER = os.path.join(UPLOAD_FOLDER, "raw")
    MASK_FOLDER = os.path.join(UPLOAD_FOLDER, "mask")
    ANNOT_FOLDER = os.path.join(UPLOAD_FOLDER, "annot")

    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "unet_model_aug.h5")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_PATH = "/"
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_COOKIE_DOMAIN = None

    CDR_THRESHOLD = 0.5

    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


class DevConfig(Config):
    FLASK_ENV = "development"
    DEBUG = True


class ProdConfig(Config):
    FLASK_ENV = "production"
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"
