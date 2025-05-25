import os
import uuid

from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select

from db import engine
from model import Activity, ActivityPublic, Tracepoint


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_session():
    with Session(engine) as session:
        yield session


@app.get("/activities/", response_model=List[ActivityPublic])
def read_activities(session: Session = Depends(get_session)) -> List[ActivityPublic]:
    activities = session.exec(select(Activity)).all()
    return activities


@app.get("/activities/{activity_id}", response_model=ActivityPublic)
def read_activity(
    activity_id: uuid.UUID, session: Session = Depends(get_session)
) -> ActivityPublic:
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity
