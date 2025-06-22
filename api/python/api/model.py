import datetime
import uuid

from typing import List

from pydantic import BaseModel, computed_field, field_serializer
from sqlmodel import Field, Relationship, SQLModel


class UserBase(SQLModel):
    id: str = Field(primary_key=True)
    first_name: str
    last_name: str
    email: str = Field(unique=True)
    google_id: str = Field(unique=True)
    google_picture: str | None = None
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )


class User(UserBase, table=True):
    activities: list["Activity"] = Relationship(back_populates="user")


class UserPublic(UserBase):
    pass


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    google_id: str
    google_picture: str | None = None


class ActivityBase(SQLModel):
    id: uuid.UUID = Field(default=None, primary_key=True)

    fit: str = Field(unique=True)

    status: str = Field(default="created")

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

    avg_power: float | None = None
    max_power: float | None = None
    np_power: float | None = None

    total_calories: float | None = None

    total_training_effect: float | None = None
    training_stress_score: float | None = None
    intensity_factor: float | None = None

    lat: float | None = None
    lon: float | None = None
    delta_lat: float | None = None
    delta_lon: float | None = None
    city: str | None = None
    subdivision: str | None = None
    country: str | None = None

    user_id: str | None = Field(foreign_key="user.id", default=None)


class Activity(ActivityBase, table=True):
    laps: list["Lap"] = Relationship()
    performances: list["Performance"] = Relationship()
    tracepoints: list["Tracepoint"] = Relationship(back_populates="activity")
    user: User = Relationship(back_populates="activities")


class ActivityPublic(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []
    tracepoints: list["Tracepoint"] = []

    @field_serializer("tracepoints")
    def serialize_tracepoints(self, tracepoints: List["Tracepoint"]):
        return sorted(tracepoints, key=lambda a: a.timestamp, reverse=True)

    @computed_field
    def location(self) -> str | None:
        parts = [part for part in [self.city, self.subdivision, self.country] if part]
        return ", ".join(parts) if parts else None


class ActivityPublicWithoutTracepoints(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []

    @computed_field
    def location(self) -> str | None:
        parts = [part for part in [self.city, self.subdivision, self.country] if part]
        return ", ".join(parts) if parts else None


class Pagination(BaseModel):
    page: int = 1
    per_page: int = 10
    total: int = 10


class ActivityList(BaseModel):
    activities: List[ActivityPublic | ActivityPublicWithoutTracepoints] = []
    pagination: Pagination = Pagination()


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
    activity: Activity = Relationship(back_populates="laps")


class PerformanceBase(SQLModel):
    distance: float
    time: datetime.timedelta | None = None


class Performance(PerformanceBase, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship(back_populates="performances")


class PerformanceProfile(PerformanceBase):
    pass


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


class Location(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    lat: float
    lon: float
    city: str | None = None
    subdivision: str | None = None
    country: str | None = None


class Statistic(BaseModel):
    sport: str
    n_activities: int = 0
    total_distance: float | None = None


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
    running_performances: List[PerformanceProfile] = []


class WeeklyActivitySummary(BaseModel):
    id: uuid.UUID
    title: str
    sport: str
    start_time: int
    total_distance: float
    total_timer_time: float
    avg_speed: float
    avg_heart_rate: float | None = None
    avg_power: float | None = None
    race: bool


class WeeklySummary(BaseModel):
    week_start: datetime.datetime
    week_number: int
    year: int
    activities: List[WeeklyActivitySummary]
    total_activities: int
    total_distance: float
    total_time: float
    sports_breakdown: dict[
        str, dict[str, float]
    ]  # {sport: {distance: float, time: float, count: int}}


class WeeksResponse(BaseModel):
    weeks: List[WeeklySummary]
