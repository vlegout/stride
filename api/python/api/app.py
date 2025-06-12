import datetime
import json
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
from api.cli import get_activity_from_fit
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


@app.get("/activities/", response_model=ActivityList)
def read_activities(
    session: Session = Depends(get_session),
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
    query = select(Activity)  # type: ignore
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
def read_activity(activity_id: uuid.UUID, session: Session = Depends(get_session)):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@app.post(
    "/activities/", response_model=ActivityPublic, status_code=status.HTTP_201_CREATED
)
def create_activity(
    request: Request,
    fit_file: UploadFile = File(...),
    title: str = Form(...),
    race: bool = Form(False),
    session: Session = Depends(get_session),
):
    if not fit_file.filename or not fit_file.filename.endswith(".fit"):
        raise HTTPException(status_code=400, detail="File must be a .fit file")

    try:
        with open("./data/locations.json", "r") as f:
            locations = json.load(f).get("locations", [])
    except FileNotFoundError:
        locations = []

    with tempfile.NamedTemporaryFile(delete=False, suffix=".fit") as temp_file:
        temp_file.write(fit_file.file.read())
        temp_fit_path = temp_file.name

    try:
        activity, laps, tracepoints = get_activity_from_fit(
            locations=locations,
            fit_file=temp_fit_path,
            title=title,
            description="",
            race=race,
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
        activity.user_id = request.state.user_id

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


@app.get("/profile/", response_model=Profile)
def read_profile(
    session: Session = Depends(get_session),
):
    profile = Profile()

    profile.n_activities = session.query(Activity).count()

    profile.run_n_activities = (
        session.query(Activity).where(Activity.sport == "running").count()  # type: ignore
    )
    profile.run_total_distance = session.exec(
        text("SELECT SUM(total_distance) FROM Activity WHERE sport = 'running'")  # type: ignore
    ).one()[0]

    profile.cycling_n_activities = (
        session.query(Activity).where(Activity.sport == "cycling").count()  # type: ignore
    )
    profile.cycling_total_distance = session.exec(
        text("SELECT SUM(total_distance) FROM Activity WHERE sport = 'cycling'")  # type: ignore
    ).one()[0]

    profile.weeks = [
        WeeksStatistics(
            start=datetime.datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w"),
            week=week,
            statistics=[
                Statistic(
                    sport="running",
                    n_activities=session.exec(
                        text(
                            "SELECT COUNT(*) FROM activity "
                            f"WHERE sport = 'running' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year} "
                            f"AND EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) = {week}"
                        )  # type: ignore
                    ).one()[0],
                    total_distance=session.exec(
                        text(
                            "SELECT SUM(total_distance) FROM activity "
                            f"WHERE sport = 'running' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year} "
                            f"AND EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) = {week}"
                        )  # type: ignore
                    ).one()[0],
                ),
                Statistic(
                    sport="cycling",
                    n_activities=session.exec(
                        text(
                            "SELECT COUNT(*) FROM activity "
                            f"WHERE sport = 'cycling' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year} "
                            f"AND EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) = {week}"
                        )  # type: ignore
                    ).one()[0],
                    total_distance=session.exec(
                        text(
                            "SELECT SUM(total_distance) FROM activity "
                            f"WHERE sport = 'cycling' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year} "
                            f"AND EXTRACT(WEEK FROM TO_TIMESTAMP(start_time)) = {week}"
                        )  # type: ignore
                    ).one()[0],
                ),
            ],
        )
        for year, week in [
            (
                (datetime.datetime.now() - datetime.timedelta(weeks=i)).isocalendar()[
                    0
                ],
                (datetime.datetime.now() - datetime.timedelta(weeks=i)).isocalendar()[
                    1
                ],
            )
            for i in range(20)
        ][::-1]
    ]

    profile.years = [
        YearsStatistics(
            year=year,
            statistics=[
                Statistic(
                    sport="running",
                    n_activities=session.exec(
                        text(
                            "SELECT COUNT(*) FROM activity "
                            f"WHERE sport = 'running' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year}"
                        )  # type: ignore
                    ).one()[0],
                    total_distance=session.exec(
                        text(
                            "SELECT SUM(total_distance) FROM activity "
                            f"WHERE sport = 'running' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year}"
                        )  # type: ignore
                    ).one()[0],
                ),
                Statistic(
                    sport="cycling",
                    n_activities=session.exec(
                        text(
                            "SELECT COUNT(*) FROM activity "
                            f"WHERE sport = 'cycling' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year}"
                        )  # type: ignore
                    ).one()[0],
                    total_distance=session.exec(
                        text(
                            "SELECT SUM(total_distance) FROM activity "
                            f"WHERE sport = 'cycling' AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) = {year}"
                        )  # type: ignore
                    ).one()[0],
                ),
            ],
        )
        for year in range(2013, datetime.datetime.now().year + 1)
    ]

    profile.running_performances = [
        PerformanceProfile(
            distance=distance,
            time=session.exec(
                text(f"SELECT MIN(time) FROM performance WHERE distance = {distance}")  # type: ignore
            ).one()[0],
        )
        for distance in [1000, 1609.344, 5000, 10000, 21097.5, 42195]
    ]

    return profile


@app.get("/weeks/", response_model=WeeksResponse)
def read_weeks(
    session: Session = Depends(get_session),
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
    request: Request,
    session: Session = Depends(get_session),
):
    user_id = request.state.user_id

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
