import datetime
import os
import tempfile
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from api.dependencies import (
    get_activity_service_dependency,
    get_current_user_id,
    get_session,
)
from api.model import (
    Activity,
    ActivityList,
    ActivityPublic,
    ActivityPublicWithoutTracepoints,
    ActivityUpdate,
    ActivityZoneHeartRate,
    ActivityZoneHeartRatePublic,
    ActivityZonePace,
    ActivityZonePacePublic,
    ActivityZonePower,
    ActivityZonePowerPublic,
    Notification,
    Pagination,
    Sport,
    Zone,
)
from api.services.activity import ActivityService

router = APIRouter()


@router.get("/activities/", response_model=ActivityList)
def read_activities(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
    map: bool = Query(default=False),
    limit: int = Query(default=10, ge=1, le=100),
    race: bool = Query(default=None),
    sport: str = Query(default=None),
    min_distance: float = Query(default=None, ge=0),
    max_distance: float = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    order_by: str = Query(
        default="start_time",
        pattern="^(total_distance|start_time|avg_speed|avg_power|total_ascent|total_calories|training_stress_score)$",
    ),
):
    query = select(Activity).where(
        Activity.user_id == user_id, Activity.status == "created"
    )
    if race is True:
        query = query.where(Activity.race)
    if sport is not None:
        valid_sports = {s.value for s in Sport}
        sport_list = [s.strip() for s in sport.split(",") if s.strip()]
        invalid = [s for s in sport_list if s not in valid_sports]
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sport(s): {', '.join(invalid)}",
            )
        if len(sport_list) == 1:
            query = query.where(Activity.sport == sport_list[0])
        elif len(sport_list) > 1:
            query = query.where(col(Activity.sport).in_(sport_list))
    if min_distance is not None:
        query = query.where(Activity.total_distance >= min_distance * 1000)
    if max_distance is not None:
        query = query.where(Activity.total_distance <= max_distance * 1000)

    if order_by == "total_distance":
        order_column = Activity.total_distance
    elif order_by == "avg_speed":
        order_column = Activity.avg_speed  # type: ignore[assignment]
    elif order_by == "avg_power":
        order_column = Activity.avg_power  # type: ignore[assignment]
    elif order_by == "total_ascent":
        order_column = Activity.total_ascent  # type: ignore[assignment]
    elif order_by == "total_calories":
        order_column = Activity.total_calories  # type: ignore[assignment]
    elif order_by == "training_stress_score":
        order_column = Activity.training_stress_score  # type: ignore[assignment]
    else:
        order_column = Activity.start_time

    if order == "asc":
        query = query.order_by(order_column.asc())  # type: ignore
    else:
        query = query.order_by(order_column.desc())  # type: ignore

    total = session.exec(select(func.count()).select_from(query.subquery())).one()

    query = query.offset((page - 1) * limit).limit(limit)

    activities = session.exec(query).all()

    notification_counts = {}
    if not map:
        activity_ids = [a.id for a in activities]
        notification_count_query = (
            select(col(Notification.activity_id), func.count(col(Notification.id)))
            .where(col(Notification.activity_id).in_(activity_ids))
            .group_by(col(Notification.activity_id))
        )
        notification_count_results = session.exec(notification_count_query).all()
        notification_counts = {
            activity_id: count for activity_id, count in notification_count_results
        }

    activity_models: list[ActivityPublic | ActivityPublicWithoutTracepoints] = []
    if map:
        activity_models = [ActivityPublic.model_validate(a) for a in activities]
    else:
        activity_models = [
            ActivityPublicWithoutTracepoints.model_validate(
                {
                    **a.model_dump(),
                    "notification_count": notification_counts.get(a.id, 0),
                }
            )
            for a in activities
        ]

    return ActivityList(
        activities=activity_models,
        pagination=Pagination(
            page=page,
            per_page=limit,
            total=total,
        ),
    )


@router.get("/activities/{activity_id}/", response_model=ActivityPublic)
def read_activity(
    activity_id: uuid.UUID,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    activity = session.exec(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.status == "created",
        )
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


class ActivityZonesResponse(BaseModel):
    pace: list[ActivityZonePacePublic]
    power: list[ActivityZonePowerPublic]
    heart_rate: list[ActivityZoneHeartRatePublic]


@router.get("/activities/{activity_id}/zones/", response_model=ActivityZonesResponse)
def read_activity_zones(
    activity_id: uuid.UUID,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    activity = session.exec(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.status == "created",
        )
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    pace_zones = session.exec(
        select(ActivityZonePace)
        .where(ActivityZonePace.activity_id == activity_id)
        .options(selectinload(ActivityZonePace.zone))  # type: ignore
        .join(Zone)
        .order_by(Zone.index)  # type: ignore
    ).all()

    power_zones = session.exec(
        select(ActivityZonePower)
        .where(ActivityZonePower.activity_id == activity_id)
        .options(selectinload(ActivityZonePower.zone))  # type: ignore
        .join(Zone)
        .order_by(Zone.index)  # type: ignore
    ).all()

    heart_rate_zones = session.exec(
        select(ActivityZoneHeartRate)
        .where(ActivityZoneHeartRate.activity_id == activity_id)
        .options(selectinload(ActivityZoneHeartRate.zone))  # type: ignore
        .join(Zone)
        .order_by(Zone.index)  # type: ignore
    ).all()

    return ActivityZonesResponse(
        pace=[ActivityZonePacePublic.model_validate(zone) for zone in pace_zones],
        power=[ActivityZonePowerPublic.model_validate(zone) for zone in power_zones],
        heart_rate=[
            ActivityZoneHeartRatePublic.model_validate(zone)
            for zone in heart_rate_zones
        ],
    )


@router.post(
    "/activities/", response_model=ActivityPublic, status_code=status.HTTP_201_CREATED
)
def create_activity(
    fit_file: UploadFile = File(...),
    title: str = Form(...),
    race: bool = Form(False),
    user_id: str = Depends(get_current_user_id),
    activity_service: ActivityService = Depends(get_activity_service_dependency),
    session: Session = Depends(get_session),
):
    if not fit_file.filename or not fit_file.filename.endswith(".fit"):
        raise HTTPException(status_code=400, detail="File must be a .fit file")

    existing_activity = session.exec(
        select(Activity).where(
            Activity.fit == fit_file.filename,
            Activity.user_id == user_id,
            Activity.status == "created",
        )
    ).first()
    if existing_activity:
        raise HTTPException(
            status_code=409, detail="Activity with this FIT file already exists"
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".fit") as temp_file:
        temp_file.write(fit_file.file.read())
        temp_fit_path = temp_file.name

    try:
        activity = activity_service.create_activity(
            user_id=user_id,
            fit_file_path=temp_fit_path,
            fit_filename=fit_file.filename,
            title=title,
            race=race,
        )
        return ActivityPublic.model_validate(activity)

    except Exception as e:  # noqa: BLE001
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing FIT file: {e!s}")
    finally:
        try:
            os.unlink(temp_fit_path)
        except OSError:
            pass


@router.delete("/activities/{activity_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: uuid.UUID,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    activity = session.exec(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.status == "created",
        )
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.status = "deleted"
    activity.updated_at = datetime.datetime.now(datetime.UTC)
    session.add(activity)
    session.commit()


@router.patch("/activities/{activity_id}/", response_model=ActivityPublic)
def update_activity(
    activity_id: uuid.UUID,
    activity_update: ActivityUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    activity = session.exec(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
            Activity.status == "created",
        )
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    update_data = activity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)

    activity.updated_at = datetime.datetime.now(datetime.UTC)

    session.add(activity)
    session.commit()
    session.refresh(activity)

    return ActivityPublic.model_validate(activity)
