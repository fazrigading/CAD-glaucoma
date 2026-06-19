from pydantic import BaseModel
from typing import Optional


class CalculatedCDR(BaseModel):
    v_cdr: Optional[float] = None
    h_cdr: Optional[float] = None
    area_cdr: Optional[float] = None


class DoctorInfo(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    username: Optional[str] = None


class PolygonSaveRequest(BaseModel):
    disc_polygons: list = []
    cup_polygons: list = []
    calculated_cdr: Optional[CalculatedCDR] = None
    doctor_info: Optional[DoctorInfo] = None


class PolygonData(BaseModel):
    disc_polygons: list
    cup_polygons: list


class PolygonSaveResponse(BaseModel):
    success: bool
    message: str
    patient_id: int
    doctor_name: Optional[str] = None


class PolygonGetResponse(BaseModel):
    success: bool
    message: str
    data: Optional[PolygonData] = None
