from fastapi import APIRouter, Depends
from sqlmodel import Session

from api.dependencies import get_current_user_id, get_session
from api.fitness import (
    calculate_fitness_and_weekly_data,
    calculate_weekly_zone_data,
    get_ftp_data,
)

router = APIRouter()


@router.get("/fitness/scores/")
def read_fitness_scores(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    return calculate_fitness_and_weekly_data(session, user_id)


@router.get("/fitness/zones/")
def read_fitness_zones(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    return {"weekly_zones": calculate_weekly_zone_data(session, user_id)}


@router.get("/fitness/ftp/")
def read_fitness_ftp(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    return {"ftp": get_ftp_data(session, user_id)}
