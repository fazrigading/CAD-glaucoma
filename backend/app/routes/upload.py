import asyncio
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
    if not _allowed_file(gambar.filename or ""):
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG atau PNG.")

    await asyncio.to_thread(clean_temp_files, str(settings.raw_folder))

    file_extension = Path(gambar.filename or "temp.jpg").suffix.lower()
    temp_filename = f"temp_raw{file_extension}"
    temp_gambar_path = settings.raw_folder / temp_filename

    content = await gambar.read()
    temp_gambar_path.write_bytes(content)

    try:
        result = await asyncio.to_thread(ev_cdr, str(temp_gambar_path), str(settings.model_path))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    diagnose = "Glaucoma" if result["vertical_cdr"] > settings.cdr_threshold else "Non Glaucoma"

    patient_data = {
        "name": nama,
        "age": umur,
        "gender": gender,
        "eyes": result["eye_side"],
    }

    masking = await asyncio.to_thread(visualize_predict, result["predict"], str(settings.upload_folder))
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

    async with get_db() as db:
        patient_id = await save_prediction_to_db(db, patient_data, prediction_result, temp_image_paths, doctor_id)

    if patient_id:
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

        async with get_db() as db2:
            await update_image_paths(db2, patient_id, updated_image_paths)

        db_save_success = True
    else:
        db_save_success = False
        final_raw_filename = temp_filename
        final_mask_filename = masking
        final_draw_mask_filename = draw_mask

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


@router.get("/uploads/{file_path:path}")
async def serve_uploaded_file(file_path: str):
    safe_path = Path(file_path)
    if ".." in safe_path.parts:
        raise HTTPException(status_code=400, detail="Invalid path")

    full_path = settings.upload_folder / safe_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(full_path))
