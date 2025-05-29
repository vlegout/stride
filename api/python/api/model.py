import datetime
import uuid

from typing import List

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


class ActivityBase(SQLModel):
    id: uuid.UUID = Field(default=None, primary_key=True)

    fit: str = Field(unique=True)

    title: str
    description: str | None = None

    sport: str
    device: str

    race: bool

    start_time: int
    timestamp: int
    total_timer_time: float
    total_elapsed_time: float

    total_distance: float
    total_ascent: float

    avg_speed: float

    avg_heart_rate: float | None = None
    max_heart_rate: float | None = None

    total_calories: float | None = None

    total_training_effect: float | None = None

    lat: float | None = None
    lon: float | None = None
    delta_lat: float | None = None
    delta_lon: float | None = None
    location: str | None = None


class Activity(ActivityBase, table=True):
    laps: list["Lap"] = Relationship()
    performances: list["Performance"] = Relationship()
    tracepoints: list["Tracepoint"] = Relationship(back_populates="activity")


class ActivityPublicNoTracepoints(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []


class ActivityPublic(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []
    tracepoints: list["Tracepoint"] = []


class LapBase(SQLModel):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    index: int
    start_time: int
    total_elapsed_time: float
    total_timer_time: float
    total_distance: float
    max_speed: float | None = None
    max_heart_rate: int | None = None
    avg_heart_rate: int | None = None
    minutes: int
    seconds: int


class Lap(LapBase, table=True):
    activity: Activity = Relationship()


class Performance(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship()
    distance: float
    time: datetime.timedelta | None = None


class TracepointBase(SQLModel):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    lat: float
    lon: float
    timestamp: datetime.datetime
    distance: float
    heart_rate: int | None
    speed: float
    power: int | None = None
    altitude: float | None = None


class Tracepoint(TracepointBase, table=True):
    activity: Activity = Relationship(back_populates="tracepoints")


class Statistic(BaseModel):
    sport: str
    n_activities: int = 0
    total_distance: float = 0.0


class YearsStatistics(BaseModel):
    year: int
    statistics: List[Statistic]


class WeeksStatistics(BaseModel):
    start: datetime.datetime
    week: int
    statistics: List[Statistic]


class Profile(BaseModel):
    n_activities: int = 0
    run_n_activities: int = 0
    run_total_distance: float = 0.0
    cycling_n_activities: int = 0
    cycling_total_distance: float = 0.0
    years: List[YearsStatistics] = []
    weeks: List[WeeksStatistics] = []
    running_performances: List[Performance] = []
