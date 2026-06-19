from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    message: str
    patient_id: Optional[int] = None
    nama: Optional[str] = None
    umur: Optional[str] = None
    gender: Optional[str] = None
    posisi: Optional[str] = None
    gambar_url: Optional[str] = None
    mask_url: Optional[str] = None
    draw_url: Optional[str] = None
    v_cdr: Optional[float] = None
    h_cdr: Optional[float] = None
    area_cdr: Optional[float] = None
    diagnose: Optional[str] = None
    db_saved: bool = False
