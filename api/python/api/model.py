import datetime
import uuid

from typing import List

from pydantic import BaseModel, field_serializer, field_validator
from sqlmodel import Field, Relationship, SQLModel


class UserBase(SQLModel):
    id: str = Field(primary_key=True)
    first_name: str
    last_name: str
    email: str = Field(unique=True)
    google_id: str = Field(unique=True)
    google_picture: str | None = None
    map: str = Field(default="leaflet")
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )

    @field_validator("map")
    @classmethod
    def validate_map(cls, v):
        if v not in ["leaflet", "openlayers", "mapbox"]:
            raise ValueError("Map must be one of: leaflet, openlayers, mapbox")
        return v


class User(UserBase, table=True):
    activities: list["Activity"] = Relationship(back_populates="user")
    zones: list["Zone"] = Relationship(back_populates="user")
    ftps: list["Ftp"] = Relationship()


class UserPublic(UserBase):
    pass


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    google_id: str
    google_picture: str | None = None


class UserUpdate(BaseModel):
    map: str | None = None

    @field_validator("map")
    @classmethod
    def validate_map(cls, v):
        if v is not None and v not in ["leaflet", "openlayers", "mapbox"]:
            raise ValueError("Map must be one of: leaflet, openlayers, mapbox")
        return v


class ActivityUpdate(BaseModel):
    title: str | None = None
    race: bool | None = None


class ActivityBase(SQLModel):
    id: uuid.UUID = Field(default=None, primary_key=True)

    fit: str

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

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )


class Activity(ActivityBase, table=True):
    laps: list["Lap"] = Relationship()
    performances: list["Performance"] = Relationship()
    performance_power: list["PerformancePower"] = Relationship(
        back_populates="activity"
    )
    notifications: list["Notification"] = Relationship(back_populates="activity")
    tracepoints: list["Tracepoint"] = Relationship(back_populates="activity")
    zone_paces: list["ActivityZonePace"] = Relationship(back_populates="activity")
    zone_powers: list["ActivityZonePower"] = Relationship(back_populates="activity")
    zone_heart_rates: list["ActivityZoneHeartRate"] = Relationship(
        back_populates="activity"
    )
    user: User = Relationship(back_populates="activities")


class ActivityPublic(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []
    performance_power: list["PerformancePower"] = []
    notifications: list["NotificationPublic"] = []
    tracepoints: list["Tracepoint"] = []

    @field_serializer("tracepoints")
    def serialize_tracepoints(self, tracepoints: List["Tracepoint"]):
        return sorted(tracepoints, key=lambda a: a.timestamp)


class ActivityPublicWithoutTracepoints(ActivityBase):
    laps: list["Lap"] = []
    performances: list["Performance"] = []
    performance_power: list["PerformancePower"] = []


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


class Lap(LapBase, table=True):
    activity: Activity = Relationship(back_populates="laps")


class PerformanceBase(SQLModel):
    distance: float
    time: datetime.timedelta | None = None


class Performance(PerformanceBase, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship(back_populates="performances")


class PerformancePowerBase(SQLModel):
    time: datetime.timedelta
    power: float


class PerformancePower(PerformancePowerBase, table=True):
    id: uuid.UUID = Field(primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    activity: Activity = Relationship(back_populates="performance_power")


class NotificationBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    type: str
    distance: float
    achievement_year: int | None = None
    message: str
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )


class Notification(NotificationBase, table=True):
    activity: Activity = Relationship(back_populates="notifications")


class NotificationPublic(NotificationBase):
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


class ActivityZonePaceBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    zone_id: uuid.UUID = Field(foreign_key="zone.id")
    time_in_zone: float


class ActivityZonePace(ActivityZonePaceBase, table=True):
    activity: Activity = Relationship(back_populates="zone_paces")
    zone: "Zone" = Relationship()


class ActivityZonePacePublic(ActivityZonePaceBase):
    zone: "ZonePublic"


class ActivityZonePowerBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    zone_id: uuid.UUID = Field(foreign_key="zone.id")
    time_in_zone: float


class ActivityZonePower(ActivityZonePowerBase, table=True):
    activity: Activity = Relationship(back_populates="zone_powers")
    zone: "Zone" = Relationship()


class ActivityZonePowerPublic(ActivityZonePowerBase):
    zone: "ZonePublic"


class ActivityZoneHeartRateBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id")
    zone_id: uuid.UUID = Field(foreign_key="zone.id")
    time_in_zone: float


class ActivityZoneHeartRate(ActivityZoneHeartRateBase, table=True):
    activity: Activity = Relationship(back_populates="zone_heart_rates")
    zone: "Zone" = Relationship()


class ActivityZoneHeartRatePublic(ActivityZoneHeartRateBase):
    zone: "ZonePublic"


class ZoneBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    index: int
    type: str = Field(regex="^(heart_rate|pace|power)$")
    max_value: float


class Zone(ZoneBase, table=True):
    user: User = Relationship(back_populates="zones")


class ZonePublic(ZoneBase):
    pass


class FtpBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    date: datetime.date
    ftp: int


class Ftp(FtpBase, table=True):
    user: User = Relationship(back_populates="ftps")


class FtpPublic(FtpBase):
    pass


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
    swimming_n_activities: int = 0
    swimming_total_distance: float = 0.0
    years: List[YearsStatistics] = []
    zones: List[ZonePublic] = []


class BestPerformanceItem(BaseModel):
    value: float
    activity: ActivityPublicWithoutTracepoints


class BestPerformanceResponse(BaseModel):
    sport: str
    parameter: str
    performances: List[BestPerformanceItem]


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
    total_tss: float
    sports_breakdown: dict[
        str, dict[str, float]
    ]  # {sport: {distance: float, time: float, count: int}}


class WeeksResponse(BaseModel):
    weeks: List[WeeklySummary]
