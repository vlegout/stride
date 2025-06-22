import datetime
import os
import tempfile
import uuid

import yaml
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
    UploadFile,
    File,
    Form,
)
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, text
from sqlmodel import Session, select

from api.auth import verify_token, create_token_response, Token
from api.fit import get_activity_from_fit
from api.db import engine
from api.model import (
    Activity,
    ActivityList,
    ActivityPublic,
    ActivityPublicWithoutTracepoints,
    Pagination,
    PerformanceProfile,
    Profile,
    Statistic,
    User,
    UserCreate,
    UserPublic,
    WeeklyActivitySummary,
    WeeklySummary,
    WeeksResponse,
    WeeksStatistics,
    YearsStatistics,
)
from api.utils import (
    get_best_performances,
    generate_random_string,
    upload_file_to_s3,
    upload_content_to_s3,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if "JWT_SECRET_KEY" not in os.environ:
    raise ValueError("Missing environment variables: JWT_SECRET_KEY")


@app.middleware("http")
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
        # Add user info to request state for use in endpoints
        request.state.user_id = token_data.user_id
        request.state.user_email = token_data.email
    except HTTPException:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired token"},
        )

    return await call_next(request)


def get_session():
    with Session(engine) as session:
        yield session


def get_current_user_id(request: Request) -> str:
    if not hasattr(request.state, "user_id") or not request.state.user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return request.state.user_id


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
        pattern="^(total_distance|start_time|avg_speed|avg_power|total_ascent|total_calories)$",
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

        session.commit()
        session.refresh(activity)

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


@app.get("/profile/", response_model=Profile)
def read_profile(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    # Single query for overall statistics
    overall_stats = session.execute(
        text("""
            SELECT
                COUNT(*) as total_activities,
                COUNT(CASE WHEN sport = 'running' THEN 1 END) as run_activities,
                COALESCE(SUM(CASE WHEN sport = 'running' THEN total_distance END), 0) as run_distance,
                COUNT(CASE WHEN sport = 'cycling' THEN 1 END) as cycling_activities,
                COALESCE(SUM(CASE WHEN sport = 'cycling' THEN total_distance END), 0) as cycling_distance
            FROM activity
            WHERE user_id = :user_id AND status = 'created'
        """),
        {"user_id": user_id},
    ).one()

    # Single query for weekly statistics (last 20 weeks)
    current_date = datetime.datetime.now()
    weeks_data = []
    week_periods = [
        (current_date - datetime.timedelta(weeks=i)).isocalendar()[:2]
        for i in range(20)
    ][::-1]

    # Get unique years and weeks for filtering
    unique_years = list(set(year for year, _ in week_periods))
    unique_weeks = list(set(week for _, week in week_periods))

    # Create SQL-safe IN clauses
    years_clause = ",".join(str(y) for y in unique_years)
    weeks_clause = ",".join(str(w) for w in unique_weeks)

    weekly_stats = session.execute(
        text(f"""
            SELECT
                EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) as year,
                EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) as week,
                sport,
                COUNT(*) as n_activities,
                COALESCE(SUM(total_distance), 0) as total_distance
            FROM activity
            WHERE user_id = :user_id AND status = 'created'
            AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) IN ({years_clause})
            AND EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) IN ({weeks_clause})
            GROUP BY year, week, sport
            ORDER BY year, week, sport
        """),
        {"user_id": user_id},
    ).all()

    # Organize weekly data
    weekly_dict: dict[tuple[int, int], dict[str, dict[str, int | float]]] = {}
    for row in weekly_stats:
        key = (int(row[0]), int(row[1]))
        if key not in weekly_dict:
            weekly_dict[key] = {}
        weekly_dict[key][row[2]] = {
            "n_activities": row[3],
            "total_distance": row[4] or 0,
        }

    for year, week in week_periods:
        week_data = weekly_dict.get((year, week), {})
        weeks_data.append(
            WeeksStatistics(
                start=datetime.datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w"),
                week=week,
                statistics=[
                    Statistic(
                        sport="running",
                        n_activities=int(
                            week_data.get("running", {}).get("n_activities", 0)
                        ),
                        total_distance=week_data.get("running", {}).get(
                            "total_distance", 0.0
                        ),
                    ),
                    Statistic(
                        sport="cycling",
                        n_activities=int(
                            week_data.get("cycling", {}).get("n_activities", 0)
                        ),
                        total_distance=week_data.get("cycling", {}).get(
                            "total_distance", 0.0
                        ),
                    ),
                ],
            )
        )

    # Single query for yearly statistics
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

    # Organize yearly data
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
                ],
            )
        )

    # Single query for running performances
    performance_distances = [1000, 1609.344, 5000, 10000, 21097.5, 42195]
    distances_clause = ",".join(str(d) for d in performance_distances)
    performance_stats = session.execute(
        text(f"""
            SELECT p.distance, MIN(p.time) as best_time
            FROM performance p
            JOIN activity a ON p.activity_id = a.id
            WHERE p.distance IN ({distances_clause})
            AND a.user_id = :user_id AND a.status = 'created'
            GROUP BY p.distance
            ORDER BY p.distance
        """),
        {"user_id": user_id},
    ).all()

    performance_dict = {row[0]: row[1] for row in performance_stats}
    running_performances = [
        PerformanceProfile(
            distance=distance,
            time=performance_dict.get(distance),
        )
        for distance in performance_distances
        if performance_dict.get(distance) is not None
    ]

    return Profile(
        n_activities=overall_stats[0],
        run_n_activities=overall_stats[1],
        run_total_distance=overall_stats[2] or 0.0,
        cycling_n_activities=overall_stats[3],
        cycling_total_distance=overall_stats[4] or 0.0,
        weeks=weeks_data,
        years=years_data,
        running_performances=running_performances,
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

            user_public = UserPublic.model_validate(user)
            token = create_token_response(user.id, user.email)

            return GoogleAuthResponse(user=user_public, token=token)

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
