# Phase 2 — Authentication — JWT

**Goal:** Replace Flask session-based auth with JWT tokens using `python-jose`. Create the `get_current_user` dependency used across all protected routes.

**Effort:** Medium (~1.5 hours)

---

## 2.1 New File — `backend/app/auth.py`

```python
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# FastAPI security scheme (reads from Authorization header)
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(data: dict) -> str:
    """Create a signed JWT with expiration."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.app_secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises 401 on failure."""
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    request: Request = None,
) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT.
    Checks the Authorization header first, then falls back to a cookie.
    Returns the user payload dict or raises 401.
    """
    token = None

    # Try Authorization header first
    if credentials:
        token = credentials.credentials

    # Fall back to cookie
    if not token and request:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_token(token)
    return payload
```

---

## 2.2 JWT Payload Structure

When creating a token on login, embed the user info:

```python
token_data = {
    "sub": str(user["id"]),        # Standard JWT subject claim
    "username": user["username"],
    "name": user["name"],
    "dr_id_number": user["dr_id_number"],
    "email": user["email"],
}
token = create_access_token(token_data)
```

---

## 2.3 Cookie vs Header Strategy

| Mechanism | Supported | When Used |
|---|---|---|
| `Authorization: Bearer <token>` | ✅ | Programmatic API calls (preferred) |
| `access_token` HTTP-only cookie | ✅ | Browser SPA (backward compatibility with `credentials: 'include'`) |

The `get_current_user` dependency checks header first, then cookie. This means:
- **No frontend changes needed immediately** — existing cookie-based auth continues working
- **New code can use Bearer header** — more explicit and standard

---

## 2.4 Response Format on Login

Instead of setting `session["user_id"]`, the login endpoint returns:

```json
{
    "success": true,
    "message": "Login berhasil",
    "access_token": "eyJhbGci...",
    "token_type": "bearer",
    "user": { ... }
}
```

And sets an HTTP-only cookie:

```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    max_age=3600,
    samesite="lax",
    secure=settings.is_production,
)
```

---

## 2.5 Logout

Logout clears the cookie on the client side:

```python
response.delete_cookie("access_token")
```

The frontend should also discard the Bearer token from memory.

---

## 2.6 What to Verify

1. `create_access_token` and `decode_token` round-trip correctly
2. Expired tokens raise 401
3. Tampered tokens raise 401
4. `get_current_user` dependency works with both Bearer header and cookie
5. OpenAPI docs show the "Authorize" button (from `HTTPBearer`)
