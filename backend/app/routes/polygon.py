import json
from fastapi import APIRouter, Depends, HTTPException, status
from asyncmy import Connection

from app.config import settings
from app.db import get_db
from app.schemas.polygon import (
    PolygonSaveRequest,
    PolygonSaveResponse,
    PolygonGetResponse,
    PolygonData,
)

router = APIRouter(prefix="/api", tags=["polygon"])


async def update_polygon_data(
    db: Connection, patient_id: int, polygon_data: dict, doctor_id: int | None = None
) -> bool:
    disc_class_json = json.dumps(polygon_data.get("disc_polygons", []))
    cup_class_json = json.dumps(polygon_data.get("cup_polygons", []))
    calculated_cdr = polygon_data.get("calculated_cdr", {})

    if calculated_cdr:
        v_cdr_value = calculated_cdr.get("v_cdr")
        threshold = settings.cdr_threshold
        diagnose = "Glaucoma" if v_cdr_value and v_cdr_value > threshold else "Non Glaucoma"

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

    async with db.cursor() as cursor:
        await cursor.execute(update_query, record)
        return cursor.rowcount > 0


async def get_polygon_data(db: Connection, patient_id: int) -> dict | None:
    select_query = "SELECT disc_class, cup_class FROM predict WHERE id = %s"
    async with db.cursor() as cursor:
        await cursor.execute(select_query, (patient_id,))
        row = await cursor.fetchone()

    if not row:
        return None

    disc_class, cup_class = row
    try:
        disc_polygons = json.loads(disc_class) if disc_class else []
    except (json.JSONDecodeError, TypeError):
        disc_polygons = []
    try:
        cup_polygons = json.loads(cup_class) if cup_class else []
    except (json.JSONDecodeError, TypeError):
        cup_polygons = []

    return {"disc_polygons": disc_polygons, "cup_polygons": cup_polygons}


@router.post("/save-polygon/{patient_id}", response_model=PolygonSaveResponse)
async def save_polygon(
    patient_id: int,
    body: PolygonSaveRequest,
    db: Connection = Depends(get_db),
):
    doctor_info = body.doctor_info or DoctorInfo()
    doctor_id = doctor_info.id
    doctor_name = doctor_info.name or doctor_info.username or "Dummy User"

    data = body.model_dump()
    success = await update_polygon_data(db, patient_id, data, doctor_id)

    if not success:
        raise HTTPException(status_code=500, detail="Gagal menyimpan polygon data")

    if body.calculated_cdr and body.calculated_cdr.v_cdr is not None:
        threshold = settings.cdr_threshold
        diagnose = "Glaucoma" if body.calculated_cdr.v_cdr > threshold else "Non Glaucoma"
        message = f"Polygon data, CDR, dan diagnosa ({diagnose}) berhasil disimpan oleh {doctor_name}"
    else:
        message = f"Polygon data berhasil disimpan oleh {doctor_name}"

    return PolygonSaveResponse(
        success=True,
        message=message,
        patient_id=patient_id,
        doctor_name=doctor_name,
    )


@router.get("/get-polygon/{patient_id}", response_model=PolygonGetResponse)
async def get_polygon(
    patient_id: int,
    db: Connection = Depends(get_db),
):
    polygon_data = await get_polygon_data(db, patient_id)
    if polygon_data is None:
        raise HTTPException(status_code=404, detail="Polygon data tidak ditemukan")

    return PolygonGetResponse(
        success=True,
        message="Polygon data berhasil diambil",
        data=PolygonData(**polygon_data),
    )
