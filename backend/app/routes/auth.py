import hashlib
from fastapi import APIRouter, Depends, Response, HTTPException, status
from asyncmy import Connection

from app.db import get_db
from app.auth import create_access_token, get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, AuthCheckResponse, UserResponse

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
        secure=False,
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
