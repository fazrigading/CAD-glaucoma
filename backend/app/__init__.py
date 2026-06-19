# Re-export the FastAPI app for backward compatibility
from app.main import app

__all__ = ["app"]
