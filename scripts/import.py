import datetime
import json
import math
import os
import uuid

from typing import Any, Dict, List, Optional, Tuple

import click
import fitdecode  # type: ignore
import yaml

from pydantic import BaseModel, Field, field_serializer, field_validator


MAX_DATA_POINTS = 500

DEVICE_MAP = {
    "edge_530": "Edge 530",
    "fr10": "FR 10",
    "fr110": "FR 110",
    "fr235": "FR 235",
    "fr745": "FR 745",
    "3121": "Edge 530",
    "3589": "FR 745",
    "4062": "Edge 840",
    "4315": "FR 965",
}


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

    @field_validator("enhanced_speed", mode="before")
    @classmethod
    def speed_to_kmh(cls, value: float) -> float:
        return value * 60 * 60 / 1000


class Activity(BaseModel):
    id: uuid.UUID = Field(default_factory=lambda: uuid.uuid4())

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

    laps: List[Lap] = []
    data_points: List[DataPoint] = []
    trace_points: List[TracePoint] = []

    @field_validator("enhanced_avg_speed", mode="before")
    @classmethod
    def speed_to_kmh(cls, value: float) -> float:
        return value * 60 * 60 / 1000

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


def get_lat_lon(points: List[TracePoint]) -> Tuple[float, float]:
    x = y = z = 0.0

    if len(points) == 0:
        return 0.0, 0.0

    for point in points:
        lon = math.radians(float(point.lon))
        lat = math.radians(float(point.lat))

        x += math.cos(lon) * math.cos(lat)
        y += math.cos(lon) * math.sin(lat)
        z += math.sin(lon)

    total = len(points)

    x = x / total
    y = y / total
    z = z / total

    lon = math.atan2(y, x)
    lat = math.atan2(z, math.sqrt(x * x + y * y))

    lat, lon = map(math.degrees, (lon, lat))

    return lat, lon


def get_lap(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    for field in list(Lap.model_fields.keys()):
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    if data.get("total_timer_time") and data.get("total_distance"):
        pace = datetime.timedelta(
            seconds=data.get("total_timer_time") * 1000 / data.get("total_distance")  # type: ignore
        )
        data["pace"] = Pace(
            minutes=math.floor(pace.total_seconds() / 60),
            seconds=int(pace.total_seconds() % 60),
        )

    return data


def get_session(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    for field in list(Activity.model_fields.keys())[4:]:
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    return data


def get_record(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    if not frame.has_field("position_lat") or not frame.get_value("position_lat"):
        return None
    elif not frame.has_field("position_long") or not frame.get_value("position_long"):
        return None

    data["lat"] = frame.get_value("position_lat") / ((2**32) / 360)
    data["lon"] = frame.get_value("position_long") / ((2**32) / 360)

    for field in list(DataPoint.model_fields.keys())[2:]:
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    return data


def get_activity_from_fit(fit_file: str) -> Activity:
    activity: Optional[Activity] = None
    device: str = ""
    index: int = 0
    laps: List[Lap] = []
    data_points: List[DataPoint] = []
    trace_points: List[TracePoint] = []

    with fitdecode.FitReader(fit_file) as fit:
        for frame in fit:
            if not isinstance(frame, fitdecode.records.FitDataMessage):
                continue

            if frame.name == "session":
                if session := get_session(frame):
                    activity = Activity(**session, fit=fit_file)
            elif frame.name == "lap":
                if lap := get_lap(frame):
                    laps.append(Lap(**lap))
                    index += 1
                    laps[-1].index = index
            elif frame.name == "record":
                if point := get_record(frame):
                    trace_points.append(TracePoint(lat=point["lat"], lon=point["lon"]))
            elif frame.name == "device_info":
                if frame.has_field("garmin_product") and frame.get_value(
                    "garmin_product"
                ):
                    value = str(frame.get_value("garmin_product"))
                    if value in DEVICE_MAP:
                        device = DEVICE_MAP[value]

    if not activity:
        raise ValueError("Cannot find activity in file " + fit_file)

    activity.device = device
    activity.laps = laps
    activity.data_points = data_points
    activity.trace_points = trace_points
    activity.lat, activity.lon = get_lat_lon(activity.trace_points)

    while len(activity.data_points) > MAX_DATA_POINTS:
        activity.data_points = [
            dp for idx, dp in enumerate(activity.data_points) if idx % 2 == 0
        ]

    values = []
    for data_point in data_points:
        values.append(data_point.enhanced_speed)
        if len(values) >= 10:
            data_point.enhanced_speed = sum(values) / len(values)
            values.pop(0)

    return activity


def dump_actitivities(activities: Activities, full: bool):
    for activity in activities.activities:
        data = activity.model_dump(by_alias=True)

        if full and activity.fit.startswith("data/files"):
            with open("./legacy/" + str(activity.id) + ".json", "w") as file:
                json.dump(data, file, default=str)

        with open("./public/activities/" + str(activity.id) + ".json", "w") as file:
            json.dump(data, file, default=str)

    with open("./public/activities.json", "w") as file:
        json.dump(
            activities.model_dump(
                by_alias=True,
                exclude={
                    "activities": {"__all__": {"laps", "data_points", "trace_points"}}
                },
            ),
            file,
            default=str,
        )

    activities.activities = activities.activities[:10]

    with open("./public/last.json", "w") as file:
        json.dump(activities.model_dump(by_alias=True), file, default=str)


@click.command()
@click.option("--full", is_flag=True, help="Full import of all activities.")
@click.option("--partial", is_flag=True, help="Partial import of activities.")
def run(full, partial):
    print("Full import:", full)
    print("Partial import:", partial)

    activities = Activities(activities=[])

    for root, _, files in os.walk("data/files" if full else "legacy"):
        for data_file in files:
            if full:
                activity = get_activity_from_fit(os.path.join(root, data_file))

                if partial and len(activities.activities) > 20:
                    break
            else:
                activity = Activity.parse_file(os.path.join(root, data_file))

            activities.activities.append(activity)

    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue

            with open(os.path.join(root, yaml_file), "r") as file:
                config = yaml.safe_load(file)
                activity = get_activity_from_fit("data/fit/" + config["fit"])

                if config.get("title"):
                    activity.title = config["title"]
                if config.get("description"):
                    activity.description = config["description"]

                activities.activities.append(activity)

    activities.activities.sort(key=lambda x: x.start_time, reverse=True)

    dump_actitivities(activities, full)


if __name__ == "__main__":
    run()
