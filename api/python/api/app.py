import datetime
import os
import tempfile
import uuid
from enum import Enum

from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select
from starlette.middleware.base import BaseHTTPMiddleware

from api.auth import Token, create_token_response
from api.dependencies import get_current_user_id, get_session, verify_jwt_token
from api.fitness import calculate_fitness_scores
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
    BestPerformanceItem,
    BestPerformanceResponse,
    HeatmapPublic,
    Notification,
    Pagination,
    PowerProfileResponse,
    Profile,
    User,
    UserCreate,
    UserPublic,
    UserUpdate,
    WeeklyActivitySummary,
    WeeklySummary,
    WeeksResponse,
    Zone,
)
from api.services import (
    get_activity_service,
    get_heatmap_service,
    get_profile_service,
    get_zone_service,
)
from api.services.activity import ActivityService
from api.services.heatmap import HeatmapService
from api.services.profile import ProfileService


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


app = FastAPI()

app.add_middleware(
    CORSMiddleware,  # type: ignore[arg-type]
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(BaseHTTPMiddleware, dispatch=verify_jwt_token)  # type: ignore[arg-type]


@app.get("/activities/", response_model=ActivityList)
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
    )  # type: ignore
    if race is True:
        query = query.where(Activity.race)
    if sport is not None:
        query = query.where(Activity.sport == sport)
    if min_distance is not None:
        query = query.where(Activity.total_distance >= min_distance * 1000)
    if max_distance is not None:
        query = query.where(Activity.total_distance <= max_distance * 1000)

    if order_by == "total_distance":
        order_column = Activity.total_distance
    elif order_by == "avg_speed":
        order_column = Activity.avg_speed  # type: ignore
    elif order_by == "avg_power":
        order_column = Activity.avg_power  # type: ignore
    elif order_by == "total_ascent":
        order_column = Activity.total_ascent  # type: ignore
    elif order_by == "total_calories":
        order_column = Activity.total_calories  # type: ignore
    elif order_by == "training_stress_score":
        order_column = Activity.training_stress_score  # type: ignore
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


@app.get("/activities/{activity_id}/", response_model=ActivityPublic)
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


@app.get("/activities/{activity_id}/zones/", response_model=ActivityZonesResponse)
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


@app.post(
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

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error processing FIT file: {str(e)}"
        )
    finally:
        try:
            os.unlink(temp_fit_path)
        except OSError:
            pass


@app.delete("/activities/{activity_id}/", status_code=status.HTTP_204_NO_CONTENT)
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
    activity.updated_at = datetime.datetime.now(datetime.timezone.utc)
    session.add(activity)
    session.commit()


@app.patch("/activities/{activity_id}/", response_model=ActivityPublic)
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

    activity.updated_at = datetime.datetime.now(datetime.timezone.utc)

    session.add(activity)
    session.commit()
    session.refresh(activity)

    return ActivityPublic.model_validate(activity)


@app.get("/profile/", response_model=Profile)
def read_profile(
    user_id: str = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service_dependency),
):
    return profile_service.get_user_profile(user_id)


class Sport(str, Enum):
    running = "running"
    cycling = "cycling"
    swimming = "swimming"


class CyclingDistance(str, Enum):
    one_minute = "1"
    five_minutes = "5"
    ten_minutes = "10"
    twenty_minutes = "20"
    one_hour = "60"
    two_hours = "120"
    four_hours = "240"


class RunningDistance(str, Enum):
    one_km = "1"
    five_km = "5"
    ten_km = "10"
    half_marathon = "21.098"
    full_marathon = "42.195"


@app.get("/best/", response_model=BestPerformanceResponse)
def read_best_performances(
    sport: Sport,
    distance: CyclingDistance | None = None,
    time: RunningDistance | None = None,
    year: int | None = None,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    # Validate parameters based on sport
    if sport == Sport.cycling:
        if distance is None:
            raise HTTPException(
                status_code=400, detail="Distance parameter required for cycling"
            )
        if time is not None:
            raise HTTPException(
                status_code=400, detail="Time parameter not valid for cycling"
            )
    elif sport == Sport.running:
        if time is None:
            raise HTTPException(
                status_code=400, detail="Time parameter required for running"
            )
        if distance is not None:
            raise HTTPException(
                status_code=400, detail="Distance parameter not valid for running"
            )

    performances = []

    if sport == Sport.cycling:
        assert distance is not None  # Validated above

        # Convert distance enum to timedelta (minutes)
        distance_mapping = {
            CyclingDistance.one_minute: datetime.timedelta(minutes=1),
            CyclingDistance.five_minutes: datetime.timedelta(minutes=5),
            CyclingDistance.ten_minutes: datetime.timedelta(minutes=10),
            CyclingDistance.twenty_minutes: datetime.timedelta(minutes=20),
            CyclingDistance.one_hour: datetime.timedelta(minutes=60),
            CyclingDistance.two_hours: datetime.timedelta(minutes=120),
            CyclingDistance.four_hours: datetime.timedelta(minutes=240),
        }

        target_time = distance_mapping[distance]

        # Query for cycling power performances
        query = """
            SELECT pp.power, a.*
            FROM performancepower pp
            JOIN activity a ON pp.activity_id = a.id
            WHERE a.user_id = :user_id AND a.status = 'created'
            AND pp.time = :target_time
        """
        params = {"user_id": user_id, "target_time": target_time}

        if year is not None:
            query += " AND EXTRACT(YEAR FROM to_timestamp(a.start_time)) = :year"
            params["year"] = year

        query += " ORDER BY pp.power DESC LIMIT 10"

        power_performances = session.exec(text(query).bindparams(**params)).all()  # type: ignore[call-overload]

        for row in power_performances:
            power = row[0]
            activity_data = dict(row._mapping)
            del activity_data["power"]  # Remove power from activity data
            activity = ActivityPublicWithoutTracepoints(**activity_data)
            performances.append(BestPerformanceItem(value=power, activity=activity))

        parameter = distance.value

    elif sport == Sport.running:
        assert time is not None  # Validated above

        # Convert time enum to distance in meters
        time_mapping = {
            RunningDistance.one_km: 1000,
            RunningDistance.five_km: 5000,
            RunningDistance.ten_km: 10000,
            RunningDistance.half_marathon: 21097.5,
            RunningDistance.full_marathon: 42195,
        }

        target_distance = time_mapping[time]

        # Query for running performances (best times)
        query = """
            SELECT EXTRACT(EPOCH FROM p.time) as time_seconds, a.*
            FROM performance p
            JOIN activity a ON p.activity_id = a.id
            WHERE a.user_id = :user_id AND a.status = 'created'
            AND p.distance = :target_distance
            AND p.time IS NOT NULL
        """
        params = {"user_id": user_id, "target_distance": target_distance}

        if year is not None:
            query += " AND EXTRACT(YEAR FROM to_timestamp(a.start_time)) = :year"
            params["year"] = year

        query += " ORDER BY p.time ASC LIMIT 10"

        running_performances = session.exec(text(query).bindparams(**params)).all()  # type: ignore[call-overload]

        for row in running_performances:
            time_seconds = row[0]
            activity_data = dict(row._mapping)
            del activity_data["time_seconds"]  # Remove time_seconds from activity data
            activity = ActivityPublicWithoutTracepoints(**activity_data)
            performances.append(
                BestPerformanceItem(value=time_seconds, activity=activity)
            )

        parameter = time.value

    return BestPerformanceResponse(
        sport=sport.value,
        parameter=parameter,
        performances=performances,
    )


@app.get("/best/power-profile/", response_model=PowerProfileResponse)
def read_power_profile(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    # Define time periods for power profile
    time_periods = [
        (datetime.timedelta(seconds=5), "5s"),
        (datetime.timedelta(seconds=15), "15s"),
        (datetime.timedelta(seconds=30), "30s"),
        (datetime.timedelta(minutes=1), "1min"),
        (datetime.timedelta(minutes=2), "2min"),
        (datetime.timedelta(minutes=5), "5min"),
        (datetime.timedelta(minutes=10), "10min"),
        (datetime.timedelta(minutes=20), "20min"),
        (datetime.timedelta(minutes=30), "30min"),
        (datetime.timedelta(minutes=60), "1h"),
        (datetime.timedelta(minutes=90), "1h30"),
        (datetime.timedelta(minutes=120), "2h"),
    ]

    labels = [label for _, label in time_periods]

    time_values = [t for t, _ in time_periods]

    # Single query to get max power per time period, both overall and by year
    query = """
        SELECT
            pp.time,
            MAX(pp.power) as max_power,
            EXTRACT(YEAR FROM to_timestamp(a.start_time))::int as year
        FROM performancepower pp
        JOIN activity a ON pp.activity_id = a.id
        WHERE a.user_id = :user_id
        AND a.status = 'created'
        AND pp.time = ANY(:time_values)
        GROUP BY pp.time, year
        ORDER BY year DESC, pp.time
    """
    results = session.exec(  # type: ignore[call-overload]
        text(query).bindparams(user_id=user_id, time_values=time_values)
    ).all()

    # Build lookup: (time, year) -> power, and (time, None) -> overall max
    power_by_time_year: dict[tuple[datetime.timedelta, int | None], float] = {}
    available_years_set: set[int] = set()
    for row in results:
        time_val, power, year = row
        available_years_set.add(year)
        key = (time_val, year)
        power_by_time_year[key] = float(power) if power else 0.0
        # Track overall max
        overall_key = (time_val, None)
        if overall_key not in power_by_time_year:
            power_by_time_year[overall_key] = 0.0
        power_by_time_year[overall_key] = max(
            power_by_time_year[overall_key], float(power) if power else 0.0
        )

    available_years = sorted(available_years_set, reverse=True)

    # Build overall powers list
    overall_powers = [power_by_time_year.get((t, None), 0.0) for t, _ in time_periods]

    # Build years data
    years_data: dict[int, list[float]] = {}
    for year in available_years:
        years_data[year] = [
            power_by_time_year.get((t, year), 0.0) for t, _ in time_periods
        ]

    return PowerProfileResponse(
        labels=labels,
        overall=overall_powers,
        years=years_data,
        available_years=available_years,
    )


@app.get("/weeks/", response_model=WeeksResponse)
def read_weeks(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
    offset: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=52),
):
    now = datetime.datetime.now()
    current_week_start = now - datetime.timedelta(days=now.weekday())
    current_week_start = current_week_start.replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Query enough activities to fill limit weeks (fetch limit+1 to check has_more)
    # Order by start_time desc and use offset to skip already-seen weeks
    range_end = current_week_start + datetime.timedelta(days=7)

    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == user_id, Activity.status == "created")
        .where(Activity.start_time < int(range_end.timestamp()))
        .order_by(Activity.start_time.desc())  # type: ignore
    ).all()

    # Group activities by week (year, week_number)
    weeks_map: dict[tuple[int, int], list[Activity]] = {}
    for activity in activities:
        activity_dt = datetime.datetime.fromtimestamp(activity.start_time)
        year, week_number, _ = activity_dt.isocalendar()
        key = (year, week_number)
        if key not in weeks_map:
            weeks_map[key] = []
        weeks_map[key].append(activity)

    # Sort weeks by date (most recent first)
    sorted_weeks = sorted(weeks_map.keys(), reverse=True)

    # Apply offset and limit to get the requested page of weeks
    paginated_weeks = sorted_weeks[offset : offset + limit]
    weeks_data = []

    for year, week_number in paginated_weeks:
        week_activities = weeks_map[(year, week_number)]

        # Calculate week start date
        week_start = datetime.datetime.strptime(
            f"{year}-W{week_number:02d}-1", "%G-W%V-%u"
        )

        # Create activity summaries
        activity_summaries = [
            WeeklyActivitySummary(
                id=activity.id,
                title=activity.title,
                sport=activity.sport,
                start_time=activity.start_time,
                total_distance=activity.total_distance,
                total_timer_time=activity.total_timer_time,
                avg_speed=activity.avg_speed,
                avg_heart_rate=activity.avg_heart_rate,
                avg_power=activity.avg_power,
                race=activity.race,
            )
            for activity in sorted(
                week_activities, key=lambda a: a.start_time, reverse=True
            )
        ]

        # Calculate week summary statistics
        total_activities = len(week_activities)
        total_distance = sum(a.total_distance for a in week_activities)
        total_time = sum(a.total_timer_time for a in week_activities)
        total_tss = sum(a.training_stress_score or 0.0 for a in week_activities)

        # Calculate sports breakdown
        sports_breakdown: dict[str, dict[str, float]] = {}
        for activity in week_activities:
            sport = activity.sport
            if sport not in sports_breakdown:
                sports_breakdown[sport] = {"distance": 0.0, "time": 0.0, "count": 0}
            sports_breakdown[sport]["distance"] += activity.total_distance
            sports_breakdown[sport]["time"] += activity.total_timer_time
            sports_breakdown[sport]["count"] += 1

        weeks_data.append(
            WeeklySummary(
                week_start=week_start,
                week_number=week_number,
                year=year,
                activities=activity_summaries,
                total_activities=total_activities,
                total_distance=total_distance,
                total_time=total_time,
                total_tss=total_tss,
                sports_breakdown=sports_breakdown,
            )
        )

    # has_more is true if there are more weeks beyond what we returned
    has_more = len(sorted_weeks) > offset + limit

    # next_offset points to the next set of weeks
    next_offset = offset + len(weeks_data)

    return WeeksResponse(weeks=weeks_data, has_more=has_more, next_offset=next_offset)


@app.get("/users/me/", response_model=UserPublic)
def read_current_user(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserPublic.model_validate(user)


@app.patch("/users/me/", response_model=UserPublic)
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

    user.updated_at = datetime.datetime.now(datetime.timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserPublic.model_validate(user)


class GoogleAuthResponse(BaseModel):
    user: UserPublic
    token: Token


@app.post("/auth/google/", response_model=GoogleAuthResponse)
def google_auth(
    user_data: UserCreate,
    session: Session = Depends(get_session),
):
    try:
        existing_user = session.exec(
            select(User).where(User.google_id == user_data.google_id)
        ).first()

        if existing_user:
            existing_user.first_name = user_data.first_name
            existing_user.last_name = user_data.last_name
            existing_user.email = user_data.email
            existing_user.google_picture = user_data.google_picture
            existing_user.updated_at = datetime.datetime.now(datetime.timezone.utc)

            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)

            user_public = UserPublic.model_validate(existing_user)
            token = create_token_response(existing_user.id, existing_user.email)

            return GoogleAuthResponse(user=user_public, token=token)
        else:
            user = User(
                id=str(uuid.uuid4()),
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                email=user_data.email,
                google_id=user_data.google_id,
                google_picture=user_data.google_picture,
            )

            session.add(user)
            session.commit()
            session.refresh(user)

            zone_service = get_zone_service(session)
            zone_service.create_default_zones(user.id)
            session.commit()

            user_public = UserPublic.model_validate(user)
            token = create_token_response(user.id, user.email)

            return GoogleAuthResponse(user=user_public, token=token)

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/fitness/")
def read_fitness_score(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    return calculate_fitness_scores(session, user_id)


@app.get("/heatmap/", response_model=HeatmapPublic)
def read_heatmap(
    user_id: str = Depends(get_current_user_id),
    heatmap_service: HeatmapService = Depends(get_heatmap_service_dependency),
):
    heatmap = heatmap_service.get_heatmap(user_id)
    if not heatmap:
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return heatmap
