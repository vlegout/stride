import os

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlmodel import Session

from api.auth import verify_token
from api.db import engine


def get_session():
    with Session(engine) as session:
        yield session


def get_current_user_id(request: Request) -> str:
    if not hasattr(request.state, "user_id") or not request.state.user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return request.state.user_id


if "JWT_SECRET_KEY" not in os.environ:
    raise ValueError("Missing environment variables: JWT_SECRET_KEY")


async def verify_jwt_token(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path == "/" or request.url.path.startswith("/auth/"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid authorization header"},
        )

    token = auth_header.replace("Bearer ", "")
    try:
        token_data = verify_token(token)
        request.state.user_id = token_data.user_id
        request.state.user_email = token_data.email
    except HTTPException:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired token"},
        )

    return await call_next(request)
