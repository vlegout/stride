import datetime
import json
import math
import uuid

from typing import Any, List

import typer
import yaml

from pydantic import field_validator, ValidationInfo
from sqlmodel import Session, SQLModel

from db import engine
from model import Activity, ActivityBase, Lap, LapBase, Tracepoint, TracepointBase
from utils import (
    get_best_performances,
    get_lat_lon,
    get_uuid,
    get_delta_lat_lon,
    get_distance,
)

import scripts

app = typer.Typer()


class ActivityCreate(ActivityBase):
    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int) -> float:
        return value / 10.0

    @field_validator("avg_speed", mode="before")
    @classmethod
    def avg_speed(cls, value: int) -> float:
        return value * 3.6 / 1000


class LapCreate(LapBase):
    @field_validator("minutes", mode="before")
    @classmethod
    def minutes_validator(cls, value: int, info: ValidationInfo) -> int:
        if info.data["total_distance"] == 0:
            return 0

        pace = datetime.timedelta(
            seconds=info.data["total_timer_time"] * 1000 / info.data["total_distance"]
        )
        return math.floor(pace.total_seconds() / 60)

    @field_validator("seconds", mode="before")
    @classmethod
    def seconds_validator(cls, value: int, info: ValidationInfo) -> int:
        if info.data["total_distance"] == 0:
            return 0

        pace = datetime.timedelta(
            seconds=info.data["total_timer_time"] * 1000 / info.data["total_distance"]
        )
        return int(pace.total_seconds() % 60)


class TracepointCreate(TracepointBase):
    @field_validator("speed", mode="before")
    @classmethod
    def speed_ms(cls, value: int) -> float:
        return value * 60.0 * 60.0 / 1000.0 / 1000.0

    @field_validator("altitude", mode="before")
    @classmethod
    def altitude_m(cls, value: int) -> float:
        return value / 5 - 500.0


def get_activity_from_fit(
    locations: List[Any], fit_file: str, title: str, description: str, race: bool
) -> tuple[ActivityCreate, List[LapCreate], List[TracepointCreate]]:
    fit = scripts.get_fit("../" + fit_file)

    activity = ActivityCreate(
        id=get_uuid(fit_file),
        fit=fit_file,
        title=title,
        description=description,
        race=race,
        **fit.get("activity", {}),
    )

    laps = [
        LapCreate(id=uuid.uuid4(), activity_id=activity.id, minutes=0, seconds=0, **lap)
        for lap in fit.get("laps", [])
    ]
    tracepoints = [
        TracepointCreate(id=uuid.uuid4(), activity_id=activity.id, **point)
        for point in fit.get("data_points", [])
    ]

    return activity, laps, tracepoints


def get_activity_from_yaml(locations: List[Any], yaml_file: str):
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)

    activity, laps, tracepoints = get_activity_from_fit(
        locations,
        "data/fit/" + config["fit"],
        config.get("title", ""),
        config.get("description", ""),
        config.get("race", False),
    )

    activity = Activity(**activity.model_dump())

    laps = [Lap(**lap.model_dump()) for lap in laps]
    tracepoints = [Tracepoint(**point.model_dump()) for point in tracepoints]

    activity.lat, activity.lon = get_lat_lon(tracepoints)

    if len(tracepoints) > 0:
        lat = tracepoints[0].lat
        lon = tracepoints[0].lon

        for loc in locations:
            if get_distance(loc.get("lat"), loc.get("lon"), lat, lon) < 500:
                activity.location = loc.get("location")
                break

    values = []
    max_distance = 1.0
    for dp in tracepoints:
        values.append(dp.speed)
        if len(values) >= 10:
            dp.speed = sum(values) / len(values)
            values.pop(0)

        distance = (
            math.sqrt((dp.lat - activity.lat) ** 2 + (dp.lon - activity.lon) ** 2)
            * 111139
        )
        max_distance = max(max_distance, distance)

    activity.delta_lat, activity.delta_lon = get_delta_lat_lon(
        activity.lat, max_distance
    )

    return activity, laps, tracepoints


@app.command()
def create_db():
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

    session = Session(engine)

    locations = json.load(open("../data/locations.json")).get("locations")

    activity, laps, tracepoints = get_activity_from_yaml(
        locations,
        "../data/2025/05/24.yaml",
    )

    performances = get_best_performances(activity.id, tracepoints)

    session.add(activity)

    for lap in laps:
        session.add(lap)

    for tracepoint in tracepoints:
        session.add(tracepoint)

    for performance in performances:
        session.add(performance)

    session.commit()


if __name__ == "__main__":
    app()
