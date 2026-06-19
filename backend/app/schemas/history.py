from pydantic import BaseModel
from typing import Optional


class PredictionData(BaseModel):
    id: int
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    eyes_position: Optional[str] = None
    raw_img_path: Optional[str] = None
    mask_img_path: Optional[str] = None
    annot_img_path: Optional[str] = None
    h_cdr: Optional[float] = None
    v_cdr: Optional[float] = None
    area_cdr: Optional[float] = None
    diagnose: Optional[str] = None
    created_time: Optional[str] = None


class HistoryListResponse(BaseModel):
    success: bool
    message: str
    data: list[PredictionData]
    total: int
    page: int
    per_page: int
    total_pages: int


class HistoryDetailResponse(BaseModel):
    success: bool
    message: str
    data: Optional[PredictionData] = None


class HistoryDeleteResponse(BaseModel):
    success: bool
    message: str
