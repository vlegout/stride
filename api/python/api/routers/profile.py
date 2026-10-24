from fastapi import APIRouter, Depends

from api.dependencies import get_current_user_id, get_profile_service_dependency
from api.model import Profile
from api.services.profile import ProfileService

router = APIRouter()


@router.get("/profile/", response_model=Profile)
def read_profile(
    user_id: str = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service_dependency),
):
    return profile_service.get_user_profile(user_id)
