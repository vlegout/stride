import datetime
import uuid

from pydantic import field_validator
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

    enhanced_avg_speed: float

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


class ActivityPublic(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []
    tracepoints: list["Tracepoint"] = []


class ActivityCreate(ActivityBase):
    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int) -> float:
        return value / 10.0


class Lap(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship()
    index: int
    start_time: int
    total_elapsed_time: float
    total_timer_time: float
    minutes: int | None = None
    seconds: int | None = None
    total_distance: float
    max_speed: float | None = None
    max_heart_rate: int | None = None
    avg_heart_rate: int | None = None


class Performance(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship()
    distance: float
    time: datetime.timedelta | None = None


class Tracepoint(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship(back_populates="tracepoints")
    lat: float
    lon: float
    timestamp: int
    distance: float
    heart_rate: int | None
    speed: float
    power: int | None = None
    altitude: float | None = None
