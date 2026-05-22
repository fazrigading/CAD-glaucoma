# Phase 7 — Services — Async Adaptations

**Goal:** Adapt the four service modules (`ml.py`, `cdr.py`, `storage.py`, `visualization.py`) for the async architecture. Most require no changes to their core logic — only the call-sites change.

**Effort:** Small (~30 minutes)

---

## 7.1 `ml.py` — Machine Learning (TF U-Net)

**Module:** `backend/app/services/ml.py`

### What stays the same

- The global `_model` cache
- `get_model()` — loads the model once on first call
- `ev_cdr()` — all TF and numpy operations
- `mean_px_acc()` — custom metric function

### What changes

**Nothing.** The module remains fully synchronous. It is called from the upload route via `asyncio.to_thread()`:

```python
# In upload.py route handler:
result = await asyncio.to_thread(ev_cdr, str(temp_gambar_path), str(settings.model_path))
```

### Why this works

TensorFlow 2.x operations run in eager mode and release the Python GIL during computation (C++ backend). Running in a thread pool executor allows the asyncio event loop to handle other concurrent requests while TF is computing.

### Alternative approach: model as app state

If you prefer not to use the global `_model`, the model can be stored in `app.state` after loading:

```python
# In main.py lifespan:
app.state.model = load_model(str(settings.model_path), ...)

# In ml.py:
def ev_cdr(img_path, model, ...):
    # use model parameter instead of global
```

The route would then pass `request.app.state.model` to `ev_cdr()`. Either approach works — the global is simpler and unchanged from the current code.

---

## 7.2 `cdr.py` — CDR Calculation

**Module:** `backend/app/services/cdr.py`

### What stays the same

Everything. This module contains pure numpy functions (`get_bounding_box`, `calculate_area_CDR`). No I/O, no blocking calls. They can be called synchronously from any context.

### Usage in routes

```python
from app.services.cdr import calculate_area_CDR

# Can be called directly — no await needed
result, bbox = calculate_area_CDR(cup_mask, disc_mask)
```

---

## 7.3 `storage.py` — Temp File Cleanup

**Module:** `backend/app/services/storage.py`

### Current code

```python
def clean_temp_files(folder: str):
    for item in os.listdir(folder):
        if item.startswith("temp_"):
            item_path = os.path.join(folder, item)
            if os.path.isfile(item_path):
                os.remove(item_path)
```

### Recommended approach

Keep it synchronous. File operations on the local filesystem are fast (microseconds), so running them in the thread pool adds more overhead than it saves. The function is only called once per upload request.

If you want to make it truly non-blocking, use `aiofiles`:

```python
import aiofiles
import os
from pathlib import Path


async def clean_temp_files(folder: str):
    folder_path = Path(folder)
    for item in folder_path.iterdir():
        if item.name.startswith("temp_") and item.is_file():
            os.remove(item)  # or use aiofiles.os.remove if available
```

But the sync version is acceptable — file deletion is nearly instant.

---

## 7.4 `visualization.py` — Matplotlib & OpenCV

**Module:** `backend/app/services/visualization.py`

### What stays the same

Both `visualize_predict()` and `draw_masking()` remain synchronous. They are called from the upload route via `asyncio.to_thread()`:

```python
masking = await asyncio.to_thread(
    visualize_predict, result["predict"], str(settings.upload_folder)
)

draw_mask, new_mask = await asyncio.to_thread(
    draw_masking, str(temp_gambar_path), str(temp_mask_path), str(settings.upload_folder)
)
```

### Why thread pool

Both Matplotlib and OpenCV are CPU-bound operations that can block the event loop for 100–500ms each. Running them in the executor keeps the API responsive.

---

## 7.5 Summary Table

| Service | Sync/Async | Called How | Changes Needed |
|---|---|---|---|
| `ml.py` | Sync | `await asyncio.to_thread(ev_cdr, ...)` | None |
| `cdr.py` | Sync | Direct call | None |
| `storage.py` | Sync | Direct call (or optional aiofiles) | None (or minor) |
| `visualization.py` | Sync | `await asyncio.to_thread(visualize_predict, ...)` | None |

---

## 7.6 What to Verify

1. `ev_cdr()` runs correctly when called via `asyncio.to_thread()`
2. The cached model is reused across requests (no reload per prediction)
3. `visualize_predict()` produces correct mask images in the thread pool
4. `draw_masking()` produces correct overlay images in the thread pool
5. `clean_temp_files()` correctly removes only `temp_*` files
6. No service-level errors during concurrent requests
