import os
import uuid

from typing import List

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from db import engine
from model import Activity, ActivityPublic, ActivityPublicNoTracepoints
from fastapi import Query


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


@app.get("/activities/", response_model=List[ActivityPublic])
def read_activities(
    session: Session = Depends(get_session),
    map: bool = Query(default=False),
    limit: int = Query(default=10, ge=1, le=100),
    race: bool = Query(default=None),
):
    query = select(Activity).order_by(Activity.start_time.desc()).limit(limit)  # type: ignore
    if race is True:
        query = query.where(Activity.race)
    activities = session.exec(query).all()
    if map:
        return activities
    return [ActivityPublicNoTracepoints.model_validate(a) for a in activities]


@app.get("/activities/{activity_id}", response_model=ActivityPublic)
def read_activity(activity_id: uuid.UUID, session: Session = Depends(get_session)):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity
