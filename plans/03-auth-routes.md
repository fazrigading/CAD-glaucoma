# Phase 3 — Auth Route Migration

**Goal:** Rewrite the three auth endpoints (`/api/login`, `/api/logout`, `/api/auth/check`) from Flask Blueprint to FastAPI `APIRouter` with async DB queries and JWT.

**Effort:** Small (~30 minutes)

---

## 3.1 File Changes

| Old file | New file |
|---|---|
| `backend/app/routes/auth.py` | Same file, full rewrite |
| — | `backend/app/schemas/auth.py` (new) |

---

## 3.2 Pydantic Schemas — `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    dr_id_number: str | None = None
    email: str | None = None


class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    success: bool
    message: str


class AuthCheckResponse(BaseModel):
    success: bool
    authenticated: bool
    user: UserResponse | None = None
```

---

## 3.3 Rewritten Routes — `backend/app/routes/auth.py`

```python
import hashlib
from fastapi import APIRouter, Depends, Response, HTTPException, status
from asyncmy import Connection

from app.db import get_db
from app.auth import create_access_token, get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, AuthCheckResponse

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response, db: Connection = Depends(get_db)):
    hashed_password = hashlib.md5(body.password.encode()).hexdigest()

    async with db.cursor() as cursor:
        await cursor.execute(
            "SELECT id, name, dr_id_number, email, username FROM users WHERE username = %s AND password = %s",
            (body.username, hashed_password),
        )
        user = await cursor.fetchone()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    # map tuple to dict (asyncmy returns tuples by default with dictionary=False)
    user_dict = {
        "id": user[0],
        "name": user[1],
        "dr_id_number": user[2],
        "email": user[3],
        "username": user[4],
    }

    token = create_access_token({
        "sub": str(user_dict["id"]),
        "username": user_dict["username"],
        "name": user_dict["name"],
        "dr_id_number": user_dict["dr_id_number"],
        "email": user_dict["email"],
    })

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=False,  # settings.is_production in real code
    )

    return LoginResponse(
        success=True,
        message="Login berhasil",
        access_token=token,
        user=UserResponse(**user_dict),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    response.delete_cookie("access_token")
    return LogoutResponse(success=True, message="Logout berhasil")


@router.get("/auth/check", response_model=AuthCheckResponse)
async def check_auth(current_user: dict = Depends(get_current_user)):
    return AuthCheckResponse(
        success=True,
        authenticated=True,
        user=UserResponse(
            id=int(current_user["sub"]),
            name=current_user["name"],
            username=current_user["username"],
            dr_id_number=current_user.get("dr_id_number"),
            email=current_user.get("email"),
        ),
    )
```

---

## 3.4 Registering the Router

In `backend/app/main.py`:

```python
from app.routes.auth import router as auth_router
app.include_router(auth_router)
```

---

## 3.5 Key Changes from Flask Version

| Flask | FastAPI |
|---|---|
| `request.get_json()` | Pydantic `LoginRequest` body parameter |
| `session["user_id"] = ...` | JWT token in response body + cookie |
| `session.clear()` | `response.delete_cookie()` |
| `"user_id" in session` check | `Depends(get_current_user)` |
| `jsonify({...}), 200` | Return Pydantic model (FastAPI auto-serializes) |
| `return (...), 401` | `raise HTTPException(401, detail=...)` |
| `cursor(dictionary=True)` | asyncmy dict cursor or manual tuple→dict mapping |

**asyncmy note:** By default `cursor.execute()` returns tuples. For dict-style access, create cursor with `cursor = await db.cursor(asyncmy.cursors.DictCursor)` or manually map tuples as shown above. Using `DictCursor` is closer to the Flask code.

---

## 3.6 What to Verify

1. `POST /api/login` with valid credentials returns JWT + user info
2. `POST /api/login` with invalid credentials returns 401
3. `POST /api/logout` clears cookie
4. `GET /api/auth/check` with valid token (header or cookie) returns user info
5. `GET /api/auth/check` without token returns 401
6. OpenAPI docs authenticate correctly via the Authorize button
