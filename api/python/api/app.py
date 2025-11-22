import datetime
import os
import tempfile
import uuid
from enum import Enum

import yaml
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Query,
    status,
    UploadFile,
    File,
    Form,
)
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from api.auth import create_token_response, Token
from api.dependencies import get_session, get_current_user_id, verify_jwt_token
from api.fit import get_activity_from_fit
from api.model import (
    Activity,
    ActivityList,
    ActivityPublic,
    ActivityPublicWithoutTracepoints,
    ActivityUpdate,
    ActivityZonePace,
    ActivityZonePacePublic,
    ActivityZonePower,
    ActivityZonePowerPublic,
    ActivityZoneHeartRate,
    ActivityZoneHeartRatePublic,
    BestPerformanceItem,
    BestPerformanceResponse,
    Pagination,
    Profile,
    Statistic,
    User,
    UserCreate,
    UserPublic,
    UserUpdate,
    WeeklyActivitySummary,
    WeeklySummary,
    WeeksResponse,
    YearsStatistics,
    Zone,
    ZonePublic,
)
from api.utils import (
    calculate_activity_zone_data,
    get_best_performances,
    get_best_performance_power,
    generate_random_string,
    upload_file_to_s3,
    upload_content_to_s3,
    create_default_zones,
    update_user_zones_from_activities,
)
from api.fitness import calculate_fitness_scores, update_ftp_for_date


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(BaseHTTPMiddleware, dispatch=verify_jwt_token)


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
        order_column = Activity.avg_speed
    elif order_by == "avg_power":
        order_column = Activity.avg_power  # type: ignore
    elif order_by == "total_ascent":
        order_column = Activity.total_ascent
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

    activity_models: list[ActivityPublic | ActivityPublicWithoutTracepoints] = []
    if map:
        activity_models = [ActivityPublic.model_validate(a) for a in activities]
    else:
        activity_models = [
            ActivityPublicWithoutTracepoints.model_validate(a) for a in activities
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
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    if not fit_file.filename or not fit_file.filename.endswith(".fit"):
        raise HTTPException(status_code=400, detail="File must be a .fit file")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".fit") as temp_file:
        temp_file.write(fit_file.file.read())
        temp_fit_path = temp_file.name

    try:
        activity, laps, tracepoints = get_activity_from_fit(
            session=session,
            fit_file=temp_fit_path,
            title=title,
            description="",
            race=race,
            fit_name=fit_file.filename,
        )

        performances = get_best_performances(activity, tracepoints)
        performance_powers = get_best_performance_power(activity, tracepoints)

        # Store original tracepoints for zone calculation before filtering
        original_tracepoints = tracepoints.copy()

        MAX_DATA_POINTS = 500
        while len(tracepoints) > MAX_DATA_POINTS:
            tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

        existing_activity = session.get(Activity, activity.id)
        if existing_activity:
            raise HTTPException(
                status_code=409, detail="Activity with this FIT file already exists"
            )

        fit_s3_key = f"data/fit/{fit_file.filename}"

        now = datetime.datetime.now()
        yaml_s3_key = f"data/{now.year}/{now.month:02d}/{generate_random_string()}.yaml"
        yaml_content = {"fit": fit_file.filename, "title": title, "race": race}
        yaml_string = yaml.dump(yaml_content, default_flow_style=False)

        upload_file_to_s3(temp_fit_path, fit_s3_key)
        upload_content_to_s3(yaml_string, yaml_s3_key)

        # Set user_id from JWT token
        activity.user_id = user_id

        session.add(activity)

        for lap in laps:
            session.add(lap)

        for tracepoint in tracepoints:
            session.add(tracepoint)

        for performance in performances:
            session.add(performance)

        for performance_power in performance_powers:
            session.add(performance_power)

        calculate_activity_zone_data(session, activity, original_tracepoints)

        session.commit()

        # Update user's training zones based on this new activity
        update_user_zones_from_activities(session, user_id)

        # Update FTP if this is a cycling activity
        if activity.sport == "cycling":
            activity_date = datetime.date.fromtimestamp(activity.start_time)
            update_ftp_for_date(session, user_id, activity_date)

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

    session.add(activity)
    session.commit()
    session.refresh(activity)

    return ActivityPublic.model_validate(activity)


@app.get("/profile/", response_model=Profile)
def read_profile(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    current_date = datetime.datetime.now()

    overall_stats = session.execute(
        text("""
            SELECT
                COUNT(*) as total_activities,
                COUNT(CASE WHEN sport = 'running' THEN 1 END) as run_activities,
                COALESCE(SUM(CASE WHEN sport = 'running' THEN total_distance END), 0) as run_distance,
                COUNT(CASE WHEN sport = 'cycling' THEN 1 END) as cycling_activities,
                COALESCE(SUM(CASE WHEN sport = 'cycling' THEN total_distance END), 0) as cycling_distance,
                COUNT(CASE WHEN sport = 'swimming' THEN 1 END) as swimming_activities,
                COALESCE(SUM(CASE WHEN sport = 'swimming' THEN total_distance END), 0) as swimming_distance
             FROM activity
            WHERE user_id = :user_id AND status = 'created'
        """),
        {"user_id": user_id},
    ).one()

    yearly_stats = session.execute(
        text("""
            SELECT
                EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) as year,
                sport,
                COUNT(*) as n_activities,
                COALESCE(SUM(total_distance), 0) as total_distance
            FROM activity
            WHERE user_id = :user_id AND status = 'created'
            AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) >= 2013
            GROUP BY year, sport
            ORDER BY year, sport
        """),
        {"user_id": user_id},
    ).all()

    yearly_dict: dict[int, dict[str, dict[str, int | float]]] = {}
    for row in yearly_stats:
        year = int(row[0])
        if year not in yearly_dict:
            yearly_dict[year] = {}
        yearly_dict[year][row[1]] = {
            "n_activities": row[2],
            "total_distance": row[3] or 0,
        }

    years_data = []
    for year in range(2013, current_date.year + 1):
        year_data = yearly_dict.get(year, {})
        years_data.append(
            YearsStatistics(
                year=year,
                statistics=[
                    Statistic(
                        sport="running",
                        n_activities=int(
                            year_data.get("running", {}).get("n_activities", 0)
                        ),
                        total_distance=year_data.get("running", {}).get(
                            "total_distance", 0.0
                        ),
                    ),
                    Statistic(
                        sport="cycling",
                        n_activities=int(
                            year_data.get("cycling", {}).get("n_activities", 0)
                        ),
                        total_distance=year_data.get("cycling", {}).get(
                            "total_distance", 0.0
                        ),
                    ),
                    Statistic(
                        sport="swimming",
                        n_activities=int(
                            year_data.get("swimming", {}).get("n_activities", 0)
                        ),
                        total_distance=year_data.get("swimming", {}).get(
                            "total_distance", 0.0
                        ),
                    ),
                ],
            )
        )

    # Get user zones
    zones = session.exec(
        select(Zone).where(Zone.user_id == user_id).order_by(Zone.type, Zone.index)  # type: ignore
    ).all()

    zones_public = [ZonePublic.model_validate(zone) for zone in zones]

    return Profile(
        n_activities=overall_stats[0],
        run_n_activities=overall_stats[1],
        run_total_distance=overall_stats[2] or 0.0,
        cycling_n_activities=overall_stats[3],
        cycling_total_distance=overall_stats[4] or 0.0,
        swimming_n_activities=overall_stats[5],
        swimming_total_distance=overall_stats[6] or 0.0,
        years=years_data,
        zones=zones_public,
    )


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

        power_performances = session.execute(text(query), params).all()

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

        running_performances = session.execute(text(query), params).all()

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


@app.get("/weeks/", response_model=WeeksResponse)
def read_weeks(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    weeks_data = []

    # Get last 5 weeks
    for i in range(5):
        week_start = datetime.datetime.now() - datetime.timedelta(weeks=i)
        week_start = week_start - datetime.timedelta(
            days=week_start.weekday()
        )  # Start of week (Monday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + datetime.timedelta(days=7)

        year, week_number, _ = week_start.isocalendar()

        # Get activities for this week
        activities = session.exec(
            select(Activity)
            .where(Activity.user_id == user_id, Activity.status == "created")
            .where(Activity.start_time >= int(week_start.timestamp()))
            .where(Activity.start_time < int(week_end.timestamp()))
            .order_by(Activity.start_time.desc())  # type: ignore
        ).all()

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
            for activity in activities
        ]

        # Calculate week summary statistics
        total_activities = len(activities)
        total_distance = sum(activity.total_distance for activity in activities)
        total_time = sum(activity.total_timer_time for activity in activities)
        total_tss = sum(
            activity.training_stress_score or 0.0 for activity in activities
        )

        # Calculate sports breakdown
        sports_breakdown = {}
        for activity in activities:
            sport = activity.sport
            if sport not in sports_breakdown:
                sports_breakdown[sport] = {"distance": 0.0, "time": 0.0, "count": 0}

            sports_breakdown[sport]["distance"] += activity.total_distance
            sports_breakdown[sport]["time"] += activity.total_timer_time
            sports_breakdown[sport]["count"] += 1

        week_summary = WeeklySummary(
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

        weeks_data.append(week_summary)

    return WeeksResponse(weeks=weeks_data)


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

            # Create default zones for the new user
            create_default_zones(session, user.id)
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
