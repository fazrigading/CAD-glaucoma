# Phase 4: Frontend Quality Improvements

## Overview

Improve error handling, add pagination to history, implement file cleanup on delete, add error boundaries, and consolidate configuration constants.

---

## Step 1: Add Error Boundary

### 1.1 Create `frontend/src/components/general/ErrorBoundary.tsx`

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 1.2 Wrap `App.tsx` with ErrorBoundary

```tsx
import { ErrorBoundary } from './components/general/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* existing routes */}
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

---

## Step 2: Add Pagination to History

### 2.1 Backend: Update `app/routes/history.py`

Add pagination parameters to `get_all_predictions()` and the `/api/history` endpoint:

```python
@history_bp.route("/api/history", methods=["GET"])
def get_prediction_history():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)  # Cap at 100

    try:
        predictions = get_all_predictions()
        if predictions is None:
            return jsonify({"success": False, "message": "Gagal mengambil data history", "data": [], "total": 0, "page": page, "per_page": per_page}), 500

        total = len(predictions)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = predictions[start:end]

        return jsonify({
            "success": True,
            "message": "Data history berhasil diambil",
            "data": paginated,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}", "data": [], "total": 0, "page": page, "per_page": per_page}), 500
```

### 2.2 Frontend: Update `frontend/src/pages/History.tsx`

Add pagination state and UI:

```tsx
const [currentPage, setCurrentPage] = useState(1);
const [perPage] = useState(20);
const [totalPages, setTotalPages] = useState(1);
const [totalItems, setTotalItems] = useState(0);
```

Update `fetchPredictionHistory`:

```tsx
const fetchPredictionHistory = async (page = 1) => {
  try {
    setLoading(true);
    const response = await fetch(`/api/history?page=${page}&per_page=${perPage}`);
    const data: HistoryResponse & { page?: number; per_page?: number; total_pages?: number; total?: number } = await response.json();

    if (data.success) {
      setPredictions(data.data);
      setCurrentPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
      setError(null);
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError('Gagal mengambil data history');
  } finally {
    setLoading(false);
  }
};
```

Add pagination controls below the table:

```tsx
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-4 mt-6">
    <button
      onClick={() => fetchPredictionHistory(currentPage - 1)}
      disabled={currentPage === 1}
      className="btn btn-sm btn-outline disabled:opacity-50"
    >
      Previous
    </button>
    <span className="text-sm text-gray-600">
      Page {currentPage} of {totalPages} ({totalItems} items)
    </span>
    <button
      onClick={() => fetchPredictionHistory(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="btn btn-sm btn-outline disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}
```

### 2.3 Update `frontend/src/interfaces/InterfaceModel.ts`

Add pagination fields to `HistoryResponse`:

```tsx
export interface HistoryResponse {
  success: boolean;
  message: string;
  data: PredictionHistory[];
  total: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}
```

---

## Step 3: File Cleanup on Delete

### 3.1 Backend: Update `app/routes/history.py`

When deleting a prediction, also delete the associated files from disk:

```python
import os
from flask import current_app

@history_bp.route("/api/history/<int:prediction_id>", methods=["DELETE"])
def delete_prediction_data(prediction_id):
    try:
        # Fetch file paths before deletion
        prediction = get_prediction_by_id(prediction_id)
        if not prediction:
            return jsonify({"success": False, "message": "Data tidak ditemukan"}), 404

        # Delete from database
        success = delete_prediction(prediction_id)
        if success:
            # Delete associated files
            for path_key in ["raw_img_path", "mask_img_path", "annot_img_path"]:
                file_path = prediction.get(path_key)
                if file_path:
                    # Normalize path (handle Windows backslashes in DB)
                    clean_path = file_path.replace("\\", "/")
                    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], clean_path)
                    # Security: ensure path is within upload directory
                    real_path = os.path.realpath(full_path)
                    real_upload = os.path.realpath(current_app.config["UPLOAD_FOLDER"])
                    if real_path.startswith(real_upload) and os.path.exists(real_path):
                        os.remove(real_path)

            return jsonify({"success": True, "message": f"Data prediksi dengan ID {prediction_id} berhasil dihapus"}), 200
        else:
            return jsonify({"success": False, "message": f"Gagal menghapus data prediksi dengan ID {prediction_id}"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
```

---

## Step 4: Improve Error Handling in API Calls

### 4.1 Create `frontend/src/utils/api.ts`

Centralize API error handling:

```tsx
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const merged = { ...defaultOptions, ...options };

  // Don't set Content-Type for FormData
  if (options?.body instanceof FormData) {
    delete merged.headers;
  }

  const response = await fetch(url, merged);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let data: unknown;
    try {
      const body = await response.json();
      message = body.message || message;
      data = body;
    } catch {
      // Response is not JSON
    }

    if (response.status === 401) {
      // Session expired — clear local auth state
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    throw new ApiError(response.status, message, data);
  }

  return response.json();
}
```

### 4.2 Update API calls across the frontend

Replace raw `fetch()` calls with `apiFetch()`:

| File | Function | Change |
|------|----------|--------|
| `pages/History.tsx` | `fetchPredictionHistory` | Use `apiFetch<HistoryResponse>` |
| `pages/History.tsx` | `handleDelete` | Use `apiFetch` with try/catch |
| `pages/Correction.tsx` | `fetchPatientData` | Use `apiFetch` |
| `pages/Correction.tsx` | `fetchPolygonData` | Use `apiFetch` |
| `pages/Correction.tsx` | `handleAnalyzePolygons` | Use `apiFetch` |
| `components/model/useModel.tsx` | `handleFormSubmit` | Use `apiFetch` |
| `hooks/useAuth.ts` | `checkAuth` | Use `apiFetch` |
| `hooks/useAuth.ts` | `logout` | Use `apiFetch` |
| `pages/Login.tsx` | `handleSubmit` | Use `apiFetch` |

Example conversion for `History.tsx`:

```tsx
// Before
const response = await fetch('/api/history');
const data: HistoryResponse = await response.json();
if (data.success) { ... }

// After
try {
  const data = await apiFetch<HistoryResponse>('/api/history');
  if (data.success) { ... }
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message);
  }
}
```

---

## Step 5: Consolidate CDR Threshold

### 5.1 Backend: Already done in `app/config.py`

`Config.CDR_THRESHOLD = 0.5` — used in `app/routes/upload.py`.

### 5.2 Frontend: Already done in Phase 2

`CDR_THRESHOLD = 0.5` exported from `frontend/src/utils/cdr.ts`.

### 5.3 Update `app/routes/polygon.py`

Replace the hardcoded `0.5` in `update_polygon_data()`:

```python
# Before
diagnose = "Glaucoma" if v_cdr_value and v_cdr_value > 0.5 else "Non Glaucoma"

# After
from flask import current_app
threshold = current_app.config.get("CDR_THRESHOLD", 0.5)
diagnose = "Glaucoma" if v_cdr_value and v_cdr_value > threshold else "Non Glaucoma"
```

Do the same in the `save_polygon` route handler.

---

## Step 6: Add Health Check Endpoint

### 6.1 Create `app/routes/health.py`

```python
from flask import Blueprint, jsonify
from app.db import get_db_connection

health_bp = Blueprint("health", __name__)

@health_bp.route("/api/health", methods=["GET"])
def health_check():
    status = {"status": "ok", "database": "unknown"}

    connection = get_db_connection()
    if connection and connection.is_connected():
        status["database"] = "connected"
        connection.close()
    else:
        status["database"] = "disconnected"
        status["status"] = "degraded"

    return jsonify(status), 200 if status["status"] == "ok" else 503
```

### 6.2 Register in `app/__init__.py`

```python
from app.routes.health import health_bp
# ...
app.register_blueprint(health_bp)
```

---

## Verification Checklist

After completing all steps:

- [ ] ErrorBoundary catches and displays React errors gracefully
- [ ] History page loads with pagination (20 items per page)
- [ ] Pagination controls work (Previous/Next buttons, page info)
- [ ] Deleting a prediction removes both DB row and files from disk
- [ ] File deletion validates path is within upload directory (no path traversal)
- [ ] All API calls use `apiFetch()` with centralized error handling
- [ ] 401 responses automatically redirect to `/login`
- [ ] CDR threshold is a single constant in both frontend and backend
- [ ] `/api/health` returns `{"status": "ok", "database": "connected"}`
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` produces no TypeScript errors
