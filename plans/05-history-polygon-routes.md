# Phase 5 — History & Polygon Route Migration

**Goal:** Rewrite the history CRUD endpoints and polygon annotation endpoints from Flask Blueprints to FastAPI `APIRouter` with async DB operations.

**Effort:** Medium (~2 hours)

---

## 5.1 Files to Create/Modify

| File | Action |
|---|---|
| `backend/app/routes/history.py` | Full rewrite |
| `backend/app/routes/polygon.py` | Full rewrite |
| `backend/app/schemas/history.py` | New |
| `backend/app/schemas/polygon.py` | New |

---

## 5.2 Database Helper Functions — Refactoring Approach

Currently, `history.py` mixes helper functions (`save_prediction_to_db`, `get_all_predictions`, etc.) with route handlers. In the async version:

1. Helpers become **async functions** that accept a `db: Connection` parameter instead of calling `get_db_connection()` internally
2. Route handlers use `async with get_db() as db:` and pass the connection
3. Exception handling is delegated to FastAPI's exception handlers (no need for try/except in every route)

---

## 5.3 Pydantic Schemas

### `backend/app/schemas/history.py`

```python
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
```

### `backend/app/schemas/polygon.py`

```python
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
```

---

## 5.4 Rewritten Routes — `backend/app/routes/history.py`

### Async Helper Functions

```python
import json
import os
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
```

### Route Handlers

```python
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

    # Clean up files (in executor to avoid blocking)
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
```

---

## 5.5 Rewritten Routes — `backend/app/routes/polygon.py`

```python
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
    doctor_info = body.doctor_info or {}
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
```

---

## 5.6 What to Verify

1. `GET /api/history?page=1&per_page=20` returns paginated prediction history
2. `GET /api/history/{id}` returns a single prediction detail
3. `DELETE /api/history/{id}` deletes a prediction and its associated files
4. `GET /api/get-polygon/{patient_id}` returns disc and cup polygon data
5. `POST /api/save-polygon/{patient_id}` saves polygon data and recalculates CDR/diagnosis
6. All endpoints return proper 404/500 errors for missing/invalid data
