from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from asyncmy import Connection

from app.config import settings
from app.db import get_db
from app.schemas.history import (
    PredictionData,
    HistoryListResponse,
    HistoryDetailResponse,
    HistoryDeleteResponse,
)

router = APIRouter(prefix="/api", tags=["history"])


# --- Async helper functions (used by upload.py too) ---


async def save_prediction_to_db(
    db: Connection,
    patient_data: dict,
    prediction_result: dict,
    image_paths: dict,
    doctor_id: int | None = None,
) -> int | bool:
    insert_query = """
        INSERT INTO predict
        (patient_name, age, gender, eyes_position, raw_img_path, mask_img_path,
         annot_img_path, h_cdr, v_cdr, area_cdr, diagnose, doctor_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    record = (
        patient_data["name"],
        int(patient_data["age"]),
        patient_data["gender"],
        patient_data["eyes"],
        image_paths["raw_img_path"],
        image_paths["mask_img_path"],
        image_paths["annot_img_path"],
        prediction_result["h_cdr"],
        prediction_result["v_cdr"],
        prediction_result["area_cdr"],
        prediction_result["diagnose"],
        doctor_id,
    )
    async with db.cursor() as cursor:
        await cursor.execute(insert_query, record)
        return cursor.lastrowid


async def update_image_paths(db: Connection, patient_id: int, image_paths: dict) -> bool:
    update_query = """
        UPDATE predict
        SET raw_img_path = %s, mask_img_path = %s, annot_img_path = %s
        WHERE id = %s
    """
    record = (
        image_paths["raw_img_path"],
        image_paths["mask_img_path"],
        image_paths["annot_img_path"],
        patient_id,
    )
    async with db.cursor() as cursor:
        await cursor.execute(update_query, record)
        return cursor.rowcount > 0


async def get_all_predictions(db: Connection) -> list[dict] | None:
    select_query = """
        SELECT id, patient_name, age, gender, eyes_position,
               raw_img_path, mask_img_path, annot_img_path,
               h_cdr, v_cdr, area_cdr, diagnose, created_time
        FROM predict
        ORDER BY created_time DESC
    """
    async with db.cursor() as cursor:
        await cursor.execute(select_query)
        rows = await cursor.fetchall()

    formatted = []
    for row in rows:
        formatted.append({
            "id": row[0],
            "patient_name": row[1],
            "age": row[2],
            "gender": row[3],
            "eyes_position": row[4],
            "raw_img_path": row[5],
            "mask_img_path": row[6],
            "annot_img_path": row[7],
            "h_cdr": float(row[8]) if row[8] is not None else None,
            "v_cdr": float(row[9]) if row[9] is not None else None,
            "area_cdr": float(row[10]) if row[10] is not None else None,
            "diagnose": row[11],
            "created_time": row[12].strftime("%Y-%m-%d %H:%M:%S") if row[12] else None,
        })
    return formatted


async def get_prediction_by_id(db: Connection, prediction_id: int) -> dict | None:
    select_query = """
        SELECT id, patient_name, age, gender, eyes_position,
               raw_img_path, mask_img_path, annot_img_path,
               h_cdr, v_cdr, area_cdr, diagnose, created_time
        FROM predict WHERE id = %s
    """
    async with db.cursor() as cursor:
        await cursor.execute(select_query, (prediction_id,))
        row = await cursor.fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "patient_name": row[1],
        "age": row[2],
        "gender": row[3],
        "eyes_position": row[4],
        "raw_img_path": row[5],
        "mask_img_path": row[6],
        "annot_img_path": row[7],
        "h_cdr": float(row[8]) if row[8] is not None else None,
        "v_cdr": float(row[9]) if row[9] is not None else None,
        "area_cdr": float(row[10]) if row[10] is not None else None,
        "diagnose": row[11],
        "created_time": row[12].strftime("%Y-%m-%d %H:%M:%S") if row[12] else None,
    }


async def delete_prediction(db: Connection, prediction_id: int) -> bool:
    async with db.cursor() as cursor:
        await cursor.execute("SELECT id FROM predict WHERE id = %s", (prediction_id,))
        if not await cursor.fetchone():
            return False
        await cursor.execute("DELETE FROM predict WHERE id = %s", (prediction_id,))
        return cursor.rowcount > 0


# --- Route handlers ---


@router.get("/history", response_model=HistoryListResponse)
async def get_prediction_history(
    page: int = 1,
    per_page: int = 20,
    db: Connection = Depends(get_db),
):
    per_page = min(per_page, 100)
    predictions = await get_all_predictions(db)

    total = len(predictions)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = predictions[start:end]

    return HistoryListResponse(
        success=True,
        message="Data history berhasil diambil",
        data=[PredictionData(**p) for p in paginated],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/history/{prediction_id}", response_model=HistoryDetailResponse)
async def get_prediction_detail(
    prediction_id: int,
    db: Connection = Depends(get_db),
):
    prediction = await get_prediction_by_id(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Data prediksi tidak ditemukan")

    return HistoryDetailResponse(
        success=True,
        message="Data prediksi berhasil diambil",
        data=PredictionData(**prediction),
    )


@router.delete("/history/{prediction_id}", response_model=HistoryDeleteResponse)
async def delete_prediction_data(
    prediction_id: int,
    db: Connection = Depends(get_db),
):
    prediction = await get_prediction_by_id(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")

    success = await delete_prediction(db, prediction_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Gagal menghapus data prediksi dengan ID {prediction_id}")

    for path_key in ["raw_img_path", "mask_img_path", "annot_img_path"]:
        file_path = prediction.get(path_key)
        if file_path:
            clean_path = file_path.replace("\\", "/")
            full_path = settings.upload_folder / clean_path
            if full_path.exists() and full_path.is_file():
                full_path.unlink()

    return HistoryDeleteResponse(
        success=True,
        message=f"Data prediksi dengan ID {prediction_id} berhasil dihapus",
    )
