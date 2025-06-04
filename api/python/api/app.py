import datetime
import os
import uuid

from fastapi import FastAPI, Depends, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlmodel import Session, select

from db import engine
from model import (
    Activity,
    ActivityList,
    ActivityPublic,
    Pagination,
    PerformanceProfile,
    Profile,
    Statistic,
    WeeksStatistics,
    YearsStatistics,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if "TOKEN" not in os.environ:
    raise ValueError("Missing environment variables: TOKEN")

TOKEN = os.environ.get("TOKEN")


@app.middleware("http")
async def verify_token(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path == "/":
        return await call_next(request)

    token = request.headers.get("Authorization")
    if not token or token != f"Bearer {TOKEN}":
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Unauthorized"},
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
        default="start_time", pattern="^(total_distance|start_time)$"
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
    else:
        order_column = Activity.start_time

    if order == "asc":
        query = query.order_by(order_column.asc())  # type: ignore
    else:
        query = query.order_by(order_column.desc())  # type: ignore

    total = len(session.exec(query).all())

    query = query.offset((page - 1) * limit).limit(limit)

    activities = session.exec(query).all()

    return ActivityList(
        activities=[ActivityPublic.model_validate(a) for a in activities],
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
