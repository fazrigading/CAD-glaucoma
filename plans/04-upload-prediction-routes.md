# Phase 4 — Upload & Prediction Route Migration

**Goal:** Rewrite the upload/prediction endpoints and the file-serving endpoints from Flask to FastAPI. This is the most complex phase because it involves file uploads, ML inference, OpenCV processing, and file system operations.

**Effort:** Medium (~1.5 hours)

---

## 4.1 Files to Create/Modify

| File | Action |
|---|---|
| `backend/app/routes/upload.py` | Full rewrite |
| `backend/app/schemas/upload.py` | New — Pydantic models |

---

## 4.2 Pydantic Schemas — `backend/app/schemas/upload.py`

```python
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
```

---

## 4.3 Rewritten Routes — `backend/app/routes/upload.py`

**Key design decisions:**
- `UploadFile` from FastAPI handles multipart file uploads asynchronously
- ML inference (`ev_cdr`) runs in a thread pool via `asyncio.to_thread()` to avoid blocking the event loop
- OpenCV/Matplotlib operations also run in thread pool
- File I/O (rename, remove) uses `aiofiles` or runs in executor
- Database queries are async via `asyncmy`

```python
import os
import asyncio
import aiofiles
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from asyncmy import Connection

from app.config import settings
from app.db import get_db
from app.auth import get_current_user
from app.services.ml import ev_cdr
from app.services.visualization import visualize_predict, draw_masking
from app.services.storage import clean_temp_files
from app.routes.history import save_prediction_to_db, update_image_paths
from app.schemas.upload import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])


def _allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in settings.allowed_image_extensions


@router.post("/upload", response_model=UploadResponse)
async def predict_image(
    nama: str = Form(...),
    umur: str = Form(...),
    gender: str = Form(...),
    posisi: str = Form(...),
    gambar: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate file type
    if not _allowed_file(gambar.filename or ""):
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG atau PNG.")

    # Clean temp files
    clean_temp_files(str(settings.raw_folder))

    # Save uploaded file to temp location
    file_extension = Path(gambar.filename or "temp.jpg").suffix.lower()
    temp_filename = f"temp_raw{file_extension}"
    temp_gambar_path = settings.raw_folder / temp_filename

    async with aiofiles.open(temp_gambar_path, "wb") as f:
        content = await gambar.read()
        await f.write(content)

    # --- ML inference (CPU-bound, run in thread pool) ---
    try:
        result = await asyncio.to_thread(
            ev_cdr, str(temp_gambar_path), str(settings.model_path)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    diagnose = "Glaucoma" if result["vertical_cdr"] > settings.cdr_threshold else "Non Glaucoma"

    patient_data = {
        "name": nama,
        "age": umur,
        "gender": gender,
        "eyes": result["eye_side"],
    }

    # --- Visualization (CPU-bound, run in thread pool) ---
    masking = await asyncio.to_thread(
        visualize_predict, result["predict"], str(settings.upload_folder)
    )
    temp_mask_path = settings.upload_folder / masking

    draw_mask, new_mask = await asyncio.to_thread(
        draw_masking, str(temp_gambar_path), str(temp_mask_path), str(settings.upload_folder)
    )

    prediction_result = {
        "h_cdr": round(result["horizontal_cdr"], 2),
        "v_cdr": round(result["vertical_cdr"], 2),
        "area_cdr": round(result["area_cdr"], 2),
        "diagnose": diagnose,
    }

    temp_image_paths = {
        "raw_img_path": str(temp_gambar_path),
        "mask_img_path": str(temp_mask_path),
        "annot_img_path": str(settings.upload_folder / draw_mask),
    }

    doctor_id = int(current_user["sub"])

    # --- DB save (async) ---
    db: Connection
    async with get_db() as db:
        patient_id = await save_prediction_to_db(db, patient_data, prediction_result, temp_image_paths, doctor_id)

    if patient_id:
        # Rename temp files to permanent names (file ops in executor)
        final_raw_filename = f"{patient_id}_raw{file_extension}"
        final_mask_filename = f"{patient_id}_masking.jpg"
        final_new_mask_filename = f"{patient_id}_new_mask.jpg"
        final_draw_mask_filename = f"{patient_id}_draw_mask.jpg"

        final_raw_path = settings.raw_folder / final_raw_filename
        final_mask_path = settings.mask_folder / final_mask_filename
        final_new_mask_path = settings.mask_folder / final_new_mask_filename
        final_draw_mask_path = settings.annot_folder / final_draw_mask_filename

        move_pairs = [
            (temp_gambar_path, final_raw_path),
            (temp_mask_path, final_mask_path),
            (settings.upload_folder / new_mask, final_new_mask_path),
            (settings.upload_folder / draw_mask, final_draw_mask_path),
        ]

        for src, dst in move_pairs:
            if dst.exists():
                dst.unlink()
            src.rename(dst)

        updated_image_paths = {
            "raw_img_path": str(final_raw_path),
            "mask_img_path": str(final_mask_path),
            "annot_img_path": str(final_draw_mask_path),
        }

        async with get_db() as db:
            await update_image_paths(db, patient_id, updated_image_paths)

        db_save_success = True
    else:
        db_save_success = False
        final_raw_filename = temp_filename
        final_mask_filename = masking
        final_draw_mask_filename = draw_mask

    # Build URLs
    if patient_id:
        gambar_url = f"/uploads/raw/{final_raw_filename}"
        mask_url = f"/uploads/mask/{final_new_mask_filename}"
        draw_mask_url = f"/uploads/annot/{final_draw_mask_filename}"
    else:
        gambar_url = f"/uploads/raw/{final_raw_filename}"
        mask_url = f"/uploads/{final_mask_filename}"
        draw_mask_url = f"/uploads/{final_draw_mask_filename}"

    message = (
        f"Prediksi berhasil dan data tersimpan ke database dengan ID: {patient_id}"
        if db_save_success
        else "Prediksi berhasil tetapi gagal menyimpan ke database"
    )

    return UploadResponse(
        message=message,
        patient_id=patient_id,
        nama=nama,
        umur=umur,
        gender=gender,
        posisi=result["eye_side"],
        gambar_url=gambar_url,
        mask_url=mask_url,
        draw_url=draw_mask_url,
        v_cdr=round(result["vertical_cdr"], 2),
        h_cdr=round(result["horizontal_cdr"], 2),
        area_cdr=round(result["area_cdr"], 2),
        diagnose=diagnose,
        db_saved=db_save_success,
    )
```

---

## 4.4 File Serving — Static File Routes

Add these to the same `upload.py` file or create a separate static file router.

```python
from pathlib import Path
from fastapi.responses import FileResponse


@router.get("/uploads/{file_path:path}")
async def serve_uploaded_file(file_path: str):
    """Serve uploaded images with path traversal protection."""
    safe_path = Path(file_path)
    if ".." in safe_path.parts:
        raise HTTPException(status_code=400, detail="Invalid path")

    full_path = settings.upload_folder / safe_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(full_path))
```

Alternatively, mount the upload folder as `StaticFiles`:

```python
from fastapi.staticfiles import StaticFiles

# In main.py:
app.mount("/uploads", StaticFiles(directory=str(settings.upload_folder)), name="uploads")
```

**Choose one approach:**
- `StaticFiles` mount is simpler but serves any file in the directory
- `FileResponse` with path validation is safer (preserves the path traversal protection from the Flask version)

---

## 4.5 Thread Pool Strategy Detail

| Operation | Why Thread Pool | Code Pattern |
|---|---|---|
| `ev_cdr()` | TF inference + numpy processing | `await asyncio.to_thread(ev_cdr, img_path, model_path)` |
| `visualize_predict()` | Matplotlib rendering | `await asyncio.to_thread(visualize_predict, result, output_dir)` |
| `draw_masking()` | OpenCV image processing | `await asyncio.to_thread(draw_masking, ori_path, mask_path, output_dir)` |
| `os.rename()` / `os.remove()` | File system blocking | Use `aiofiles.os` or `await asyncio.to_thread(os.rename, src, dst)` |

Python's default thread pool is used. Since TF 2.x releases the GIL during computation, the event loop can serve other requests concurrently while inference runs.

---

## 4.6 What to Verify

1. `POST /api/upload` with multipart form data and a valid image returns prediction results
2. Uploading an invalid file type returns 400
3. Prediction results are saved to the database
4. Temporary files are cleaned up and renamed correctly
5. `GET /uploads/raw/{filename}` returns the uploaded image
6. `GET /uploads/mask/{filename}` returns the mask image
7. `GET /uploads/annot/{filename}` returns the annotated image
8. Path traversal attempts are blocked
