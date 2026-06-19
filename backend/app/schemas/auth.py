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
