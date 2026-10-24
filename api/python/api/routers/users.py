import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from api.dependencies import get_current_user_id, get_session
from api.model import User, UserPublic, UserUpdate

router = APIRouter()


@router.get("/users/me/", response_model=UserPublic)
def read_current_user(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserPublic.model_validate(user)


@router.patch("/users/me/", response_model=UserPublic)
def update_current_user(
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    if not (user.running_enabled or user.cycling_enabled or user.swimming_enabled):
        raise HTTPException(
            status_code=422, detail="At least one sport must be enabled"
        )

    user.updated_at = datetime.datetime.now(datetime.UTC)
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserPublic.model_validate(user)
