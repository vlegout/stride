from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlmodel import Session

from api.auth import verify_token
from api.db import engine
from api.services import (
    get_activity_service,
    get_heatmap_service,
    get_profile_service,
)
from api.services.activity import ActivityService
from api.services.heatmap import HeatmapService
from api.services.profile import ProfileService


def get_session():
    with Session(engine) as session:
        yield session


def get_activity_service_dependency(
    session: Session = Depends(get_session),
) -> ActivityService:
    return get_activity_service(session)


def get_profile_service_dependency(
    session: Session = Depends(get_session),
) -> ProfileService:
    return get_profile_service(session)


def get_heatmap_service_dependency(
    session: Session = Depends(get_session),
) -> HeatmapService:
    return get_heatmap_service(session)


def get_current_user_id(request: Request) -> str:
    if not hasattr(request.state, "user_id") or not request.state.user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return request.state.user_id


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
