from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_secret_key: str = "dev-secret-key-change-me"
    app_env: str = "development"

    db_host: str = "localhost"
    db_name: str = "cad_glaucoma_app"
    db_user: str = "root"
    db_password: str = ""

    cdr_threshold: float = 0.5
    allowed_image_extensions: set[str] = {".jpg", ".jpeg", ".png"}

    @property
    def upload_folder(self) -> Path:
        return Path(__file__).parent.parent.parent / "uploads"

    @property
    def raw_folder(self) -> Path:
        return self.upload_folder / "raw"

    @property
    def mask_folder(self) -> Path:
        return self.upload_folder / "mask"

    @property
    def annot_folder(self) -> Path:
        return self.upload_folder / "annot"

    @property
    def model_path(self) -> Path:
        return Path(__file__).parent.parent.parent / "model" / "unet_model_aug.h5"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
