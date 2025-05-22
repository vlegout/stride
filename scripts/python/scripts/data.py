import datetime
import math

from typing import List
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, field_serializer, field_validator


DEVICE_MAP = {
    1124: "FR 110",
    1482: "FR 10",
    2431: "FR 235",
    3121: "Edge 530",
    3589: "FR 745",
    4062: "Edge 840",
    4315: "FR 965",
}

SPORTS = {
    1: "running",
    2: "cycling",
}


def to_degrees(value: float) -> float:
    return value / ((2**32) / 360)


class Performance(BaseModel):
    distance: float
    time: datetime.timedelta | None = None


class Pace(BaseModel):
    minutes: int = 0
    seconds: int = 0


class Lap(BaseModel):
    index: int = 0
    start_time: datetime.datetime
    total_elapsed_time: float
    total_timer_time: float = 0.0
    total_distance: float = 0.0
    max_speed: float = 0.0
    max_heart_rate: int = 0
    avg_heart_rate: int = 0

    @property
    @computed_field
    def pace(self) -> Pace:
        pace = datetime.timedelta(
            seconds=self.total_timer_time * 1000 / self.total_distance
        )
        return Pace(
            minutes=math.floor(pace.total_seconds() / 60),
            seconds=int(pace.total_seconds() % 60),
        )


class TracePoint(BaseModel):
    lat: float
    lon: float


class DataPoint(BaseModel):
    lat: float
    lon: float
    timestamp: datetime.datetime
    distance: float = 0.0
    heart_rate: int = 0
    enhanced_speed: float = Field(default=0.0, serialization_alias="speed")
    power: int = 0
    enhanced_altitude: float = Field(default=0.0, serialization_alias="altitude")

    @field_validator("enhanced_speed", mode="before")
    @classmethod
    def speed_ms(cls, value: int) -> float:
        return value * 60.0 * 60.0 / 1000.0

    @field_validator("enhanced_altitude", mode="before")
    @classmethod
    def altitude_m(cls, value: int) -> float:
        return value / 5 - 500.0


class Activity(BaseModel):
    id: UUID | None = None

    fit: str = ""

    title: str = ""
    description: str = ""

    sport: str
    device: str = ""

    race: bool = False

    start_time: datetime.datetime
    timestamp: datetime.datetime
    total_timer_time: float
    total_elapsed_time: float

    total_distance: float = 0.0
    total_ascent: float = 0.0

    enhanced_avg_speed: float = Field(default=0.0, serialization_alias="average_speed")

    total_calories: float = 0.0

    total_training_effect: float = 0.0

    lat: float = 0.0
    lon: float = 0.0
    delta_lat: float = 0.0
    delta_lon: float = 0.0
    location: str = ""

    laps: List[Lap] = []
    data_points: List[DataPoint] = []
    trace_points: List[TracePoint] = []

    performances: List[Performance] = []

    @field_validator("device", mode="before")
    @classmethod
    def device_string(cls, value: int) -> str:
        return DEVICE_MAP[value]

    @field_validator("sport", mode="before")
    @classmethod
    def sport_string(cls, value: int) -> str:
        return SPORTS[value]

    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int) -> float:
        return value / 10.0

    @field_validator("enhanced_avg_speed", mode="before")
    @classmethod
    def avg_speed(cls, value: int) -> float:
        return value * 3.6 / 1000

    @field_serializer("title")
    def serialize_title(self, title: str) -> str:
        if title:
            return title

        if self.sport == "running":
            return "Run"
        elif self.sport == "cycling":
            return "Ride"

        return "Activity"


class Activities(BaseModel):
    activities: list[Activity]


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
