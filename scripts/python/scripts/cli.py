import concurrent.futures
import datetime
import json
import math
import multiprocessing
import os
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

MAX_DATA_POINTS = 500
NB_CPUS = multiprocessing.cpu_count()

app = typer.Typer()


class ActivityCreate(ActivityBase):
    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int) -> float:
        return value / 10.0

    @field_validator("avg_speed", mode="before")
    @classmethod
    def avg_speed_validator(cls, value: float) -> float:
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
    fit = scripts.get_fit(fit_file)

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

    activity_create, laps_create, tracepoints_create = get_activity_from_fit(
        locations,
        "./data/fit/" + config["fit"],
        config.get("title", ""),
        config.get("description", ""),
        config.get("race", False),
    )

    activity = Activity(**activity_create.model_dump())

    laps = [Lap(**lap.model_dump()) for lap in laps_create]
    tracepoints = [Tracepoint(**point.model_dump()) for point in tracepoints_create]

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


def process_file(locations: List[Any], input_file: str) -> None:
    activity, laps, tracepoints = get_activity_from_yaml(
        locations,
        input_file,
    )

    performances = get_best_performances(activity.id, tracepoints)

    while len(tracepoints) > MAX_DATA_POINTS:
        tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

    session = Session(engine)
    session.add(activity)

    for lap in laps:
        session.add(lap)

    for tracepoint in tracepoints:
        session.add(tracepoint)

    for performance in performances:
        session.add(performance)

    session.commit()


@app.command()
def create_db():
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

    locations = json.load(open("./data/locations.json")).get("locations")

    input_files = []
    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue
            input_files.append(os.path.join(root, yaml_file))

    with concurrent.futures.ProcessPoolExecutor(max_workers=NB_CPUS) as executor:
        future_activities = {
            executor.submit(process_file, locations, input_file): input_file
            for input_file in input_files
        }
        for future in concurrent.futures.as_completed(future_activities):
            input_file = future_activities[future]
            try:
                future.result()
            except Exception as e:
                print(f"Error processing {input_file}: {e}")


if __name__ == "__main__":
    app()
