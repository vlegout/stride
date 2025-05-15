import datetime

from typing import List
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer


def to_degrees(value: float) -> float:
    return value / ((2**32) / 360)


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
    pace: Pace = Pace()


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


class Activity(BaseModel):
    id: UUID | None = None

    fit: str

    title: str = ""
    description: str = ""

    sport: str
    device: str = ""

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

    laps: List[Lap] = []
    data_points: List[DataPoint] = []
    trace_points: List[TracePoint] = []

    @field_serializer("title")
    def serialize_title(self, title: str) -> str:
        if title:
            return title

        if self.sport == "running":
            return "Run"
        elif self.sport == "cycling":
            return "Ride"
        elif self.sport == "swimming":
            return "Swim"

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
    statistics: List[Statistic]


class Profile(BaseModel):
    n_activities: int = 0
    run_n_activities: int = 0
    run_total_distance: float = 0.0
    cycling_n_activities: int = 0
    cycling_total_distance: float = 0.0
    years: List[YearsStatistics] = []
    weeks: List[WeeksStatistics] = []
