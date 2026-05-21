# Phase 2: Frontend Restructure + Cleanup

## Overview

Rename `client/` → `frontend/`, fix broken auth flow, remove dead code, and improve TypeScript safety. All changes preserve existing functionality — no API contract changes.

---

## Step 1: Rename `client/` → `frontend/`

```bash
mv client frontend
```

### Update references

**`backend/app/__init__.py`** — change `static_folder` path:

```python
# Before
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "client", "dist")

# After
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")
```

**`client/package.json`** → **`frontend/package.json`** — fix the `backend` script:

```json
// Before
"backend": "cd backend && venv\\scripts\\flask run --no-debugger"

// After
"backend": "cd ../backend && .venv-win/Scripts/flask run --no-debugger"
```

**`.gitignore`** (root) — update build output path:

```
# Before
client/dist/

# After
frontend/dist/
```

**`AGENTS.md`** — update all `client/` references to `frontend/`:
- Developer commands section
- Setup section
- Key Paths section

---

## Step 2: Fix Auth Flow

### 2.1 Remove `DUMMY_USER` from `frontend/src/pages/Login.tsx`

Delete lines 12–19:

```tsx
// DELETE THIS
const DUMMY_USER = {
  id: 1,
  name: 'Andi',
  username: 'andi',
  dr_id_number: '202501',
  email: 'andi@example.com'
};
```

Replace the `handleSubmit` function (lines 63–93) to call the real `/api/login` endpoint:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.username.trim() || !formData.password.trim()) {
    setError('Username dan password harus diisi');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      const from = location.state?.from?.pathname || '/history';
      navigate(from, { replace: true });
    } else {
      setError(data.message || 'Username atau password salah');
    }
  } catch (err) {
    setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    console.error('Login error:', err);
  } finally {
    setIsLoading(false);
  }
};
```

### 2.2 Uncomment `useAuth` imports in all pages

In each file, uncomment the `useAuth` import and the `AuthGuard` import where present:

| File | Line |
|------|------|
| `frontend/src/pages/Correction.tsx` | Lines 3–4 |
| `frontend/src/pages/History.tsx` | Line 3 |

### 2.3 Replace `localStorage` auth checks with `useAuth()` hook

**`frontend/src/pages/Correction.tsx`** (line 163):

```tsx
// Before
const isLoggedIn = !!localStorage.getItem('user');

// After
const { isAuthenticated, isLoading, logout } = useAuth();
```

Update the `useEffect` guard (lines 166–171):

```tsx
// Before
useEffect(() => {
  if (!isLoggedIn) {
    navigate('/login', { replace: true });
    return;
  }
}, [isLoggedIn, navigate]);

// After
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    navigate('/login', { replace: true });
  }
}, [isLoading, isAuthenticated, navigate]);
```

Replace `handleLogout` (lines 716–719):

```tsx
// Before
const handleLogout = () => {
  localStorage.removeItem('user');
  navigate('/login', { replace: true });
};

// After
const handleLogout = async () => {
  await logout();
};
```

**`frontend/src/pages/History.tsx`** (line 12):

```tsx
// Before
const isLoggedIn = !!localStorage.getItem('user');

// After
const { isAuthenticated, isLoading: authLoading } = useAuth();
```

Update the `useEffect` guard (lines 20–29):

```tsx
// Before
useEffect(() => {
  if (!isLoggedIn) {
    navigate('/login', { state: { from: { pathname: '/history' } }, replace: true });
    return;
  }
  fetchPredictionHistory();
}, [isLoggedIn]);

// After
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    navigate('/login', { state: { from: { pathname: '/history' } }, replace: true });
    return;
  }
  if (isAuthenticated) {
    fetchPredictionHistory();
  }
}, [authLoading, isAuthenticated, navigate]);
```

Replace the early return guard (lines 84–101) to use `authLoading` and `isAuthenticated` instead of `isLoggedIn`.

### 2.4 Update `frontend/src/components/correction/CorrectionAccount.tsx`

Check if this component uses `localStorage` for user display. If it does, replace with `useAuth()` hook to get the current user object.

---

## Step 3: Fix Navigation

### 3.1 Replace `window.location.href` in `frontend/src/components/model/inputComponent.tsx`

Lines 36–47:

```tsx
// Before
const handleReview = (e: React.MouseEvent) => {
  e.preventDefault();
  if (canReview) {
    const currentPatientId = localStorage.getItem('currentPatientId');
    if (currentPatientId) {
      window.location.href = `/correction?patient_id=${currentPatientId}`;
    } else {
      window.location.href = '/correction';
    }
  }
};

// After
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
const handleReview = (e: React.MouseEvent) => {
  e.preventDefault();
  if (canReview) {
    const currentPatientId = localStorage.getItem('currentPatientId');
    navigate(currentPatientId ? `/correction?patient_id=${currentPatientId}` : '/correction');
  }
};
```

### 3.2 Fix `<Outlet />` misuse in `frontend/src/components/general/navbar.tsx`

Line 41: `<Outlet />` does nothing because `Navbar` is not used as a layout route in `App.tsx`. Remove it:

```tsx
// Before
return (
  <>
    <div className="text-lg m-auto flex justify-center gap-5">
      {/* links */}
    </div>
    <Outlet/>
  </>
);

// After
return (
  <div className="text-lg m-auto flex justify-center gap-5">
    {/* links */}
  </div>
);
```

Also remove the `Outlet` import from line 1.

---

## Step 4: Remove Dead Code

### 4.1 `frontend/src/components/model/inputComponent.tsx`

- Delete commented-out blocks at lines 129–168 (duplicate gender/posisi selects)
- Delete the comment block at lines 49–56 (obvious handler descriptions)
- Delete the comment block at lines 57–72 (obvious image handler description)
- Delete the comment block at lines 74–82 (obvious submit handler description)

### 4.2 `frontend/src/pages/Correction.tsx`

- Delete `console.log(polygons)` at line 720
- Move `dummyResult` outside the component function (lines 604–618) so it's not recreated every render:

```tsx
// Move to module level, before the Correction function
const dummyResult: ResponseData = {
  nama: 'John Doe',
  umur: '45',
  gender: 'Laki-laki',
  posisi: 'Kanan',
  gambar_url: '',
  mask_url: '',
  draw_url: '',
  html_content: '',
  v_cdr: '0.45',
  h_cdr: '0.40',
  area_cdr: '0.42',
  diagnose: 'Glaukoma',
};
```

### 4.3 `frontend/src/pages/History.tsx`

- Delete the large commented-out auth loading spinner block (lines 61–80)

### 4.4 `frontend/src/hooks/useAuth.ts`

- Remove all `console.log` debug statements (lines 30, 33, 36, 40, 43, 47, 50, 53, 56, 59)

---

## Step 5: Extract Shared Utilities

### 5.1 Create `frontend/src/utils/cdr.ts`

Move the CDR calculation functions from `frontend/src/pages/Correction.tsx` (lines 28–158) into a shared utility file:

```tsx
// frontend/src/utils/cdr.ts

export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  id: string;
  label: string;
  points: Point[];
}

export const CDR_THRESHOLD = 0.5;

export function calculateHCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  // ... (copy the existing implementation)
}

export function calculateVCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  // ... (copy the existing implementation)
}

export function calculatePolygonArea(points: Point[]): number {
  // ... (copy the existing implementation)
}

export function calculateAreaCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  // ... (copy the existing implementation)
}

export function getDiagnose(vCdr: number | null): string {
  return vCdr !== null && vCdr > CDR_THRESHOLD ? "Glaucoma" : "Non Glaucoma";
}
```

Then update `Correction.tsx` to import from this module instead of defining locally.

---

## Step 6: Add TypeScript Types for API Payloads

### 6.1 Create `frontend/src/types/api.ts`

```tsx
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
}

export interface AuthCheckResponse {
  success: boolean;
  authenticated: boolean;
  user?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
  message?: string;
}

export interface PolygonPayload {
  disc_polygons: Array<{ id: string; label: string; points: Array<{ x: number; y: number }> }>;
  cup_polygons: Array<{ id: string; label: string; points: Array<{ x: number; y: number }> }>;
  calculated_cdr?: {
    v_cdr: number;
    h_cdr: number;
    area_cdr: number;
  };
  doctor_info?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
}

export interface SavePolygonResponse {
  success: boolean;
  message: string;
  patient_id: number;
  doctor_name?: string;
}
```

### 6.2 Replace `any` types in `Correction.tsx`

| Line | Before | After |
|------|--------|-------|
| 322 | `discPolygon: any` | `discPolygon: { id?: string; points?: Array<{ x: number; y: number }> }` |
| 335 | `point: any` | `point: { x: number; y: number }` |
| 345 | `cupPolygon: any` | `cupPolygon: { id?: string; points?: Array<{ x: number; y: number }> }` |
| 355 | `point: any` | `point: { x: number; y: number }` |
| 359 | `point: any` | `point: { x: number; y: number }` |
| 425 | `polygonData: any` | `polygonData: PolygonPayload` |

---

## Step 7: Update Config Files

### 7.1 `frontend/vite.config.ts`

No changes needed — the `/api` proxy still targets `http://localhost:5000`.

### 7.2 `frontend/tsconfig.app.json`

Add path alias for cleaner imports (optional):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Verification Checklist

After completing all steps:

- [ ] `frontend/` directory exists, `client/` does not
- [ ] `npm run dev` starts without errors on port 5173
- [ ] `npm run build` produces `frontend/dist/` without TypeScript errors
- [ ] `npm run lint` passes with zero errors
- [ ] Login uses real `/api/login` endpoint (not dummy credentials)
- [ ] Auth state uses `useAuth()` hook, not `localStorage` checks
- [ ] No `window.location.href` navigation in the codebase
- [ ] No `console.log` statements in production code
- [ ] No commented-out code blocks
- [ ] CDR functions imported from `utils/cdr.ts`
- [ ] No `any` types in API payload handling
- [ ] Backend serves SPA from `../frontend/dist` correctly
