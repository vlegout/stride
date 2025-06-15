import concurrent.futures
import datetime
import json
import math
import os
import uuid

from typing import Any, List

import typer
import yaml

from pydantic import field_validator, ValidationInfo
from sqlmodel import Session, SQLModel

from api.db import engine
from api.model import (
    Activity,
    ActivityBase,
    Lap,
    LapBase,
    Tracepoint,
    TracepointBase,
)
from api.utils import (
    get_best_performances,
    get_lat_lon,
    get_uuid,
    get_delta_lat_lon,
    get_distance,
)

import api.api

MAX_DATA_POINTS = 500
NB_CPUS = 2

app = typer.Typer()


class ActivityCreate(ActivityBase):
    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int) -> float:
        return value / 10.0

    @field_validator("avg_speed", mode="before")
    @classmethod
    def avg_speed_validator(cls, value: float, info: ValidationInfo) -> float:
        if (
            value == 0
            and info.data.get("total_distance", 0) > 0
            and info.data.get("total_timer_time", 0) > 0
        ):
            avg_speed = info.data["total_distance"] / info.data["total_timer_time"]
            return round(avg_speed * 3.6, 2)

        return round(value * 3.6 / 1000, 2)


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
    locations: List[Any],
    fit_file: str,
    title: str = "Activity",
    description: str = "",
    race: bool = False,
    fit_name: str | None = None,
) -> tuple[Activity, List[Lap], List[Tracepoint]]:
    fit = api.api.get_fit(fit_file)

    activity_create = ActivityCreate(
        id=get_uuid(fit_file),
        fit=fit_name if fit_name is not None else os.path.basename(fit_file),
        title=title,
        description=description,
        race=race,
        **fit.get("activity", {}),
    )

    laps_create = [
        LapCreate(
            id=uuid.uuid4(), activity_id=activity_create.id, minutes=0, seconds=0, **lap
        )
        for lap in fit.get("laps", [])
    ]
    tracepoints_create = [
        TracepointCreate(id=uuid.uuid4(), activity_id=activity_create.id, **point)
        for point in fit.get("data_points", [])
    ]

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


def get_activity_from_yaml(
    locations: List[Any], yaml_file: str
) -> tuple[Activity, List[Lap], List[Tracepoint]]:
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)

    activity, laps, tracepoints = get_activity_from_fit(
        locations,
        "./data/fit/" + config["fit"],
        config.get("title", ""),
        config.get("description", ""),
        config.get("race", False),
    )

    return activity, laps, tracepoints


def get_data(
    locations: List[Any], input_file: str
) -> tuple[Activity, List[Lap], List[Tracepoint], list]:
    if input_file.endswith(".yaml"):
        activity, laps, tracepoints = get_activity_from_yaml(
            locations,
            input_file,
        )
    else:
        activity, laps, tracepoints = get_activity_from_fit(
            locations,
            input_file,
        )

    performances = get_best_performances(activity, tracepoints)

    while len(tracepoints) > MAX_DATA_POINTS:
        tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

    return activity, laps, tracepoints, performances


def process_file(locations: List[Any], input_file: str) -> None:
    activity, laps, tracepoints, performances = get_data(locations, input_file)

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
def add_activity(
    yaml: str = typer.Argument(),
):
    """Add a new activity from a YAML file."""
    locations = json.load(open("./data/locations.json")).get("locations")

    process_file(locations, yaml)


@app.command()
def create_db():
    """Create tables and add initial data."""
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

    locations = json.load(open("./data/locations.json")).get("locations")

    input_files = []
    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue
            input_files.append(os.path.join(root, yaml_file))
    for root, _, files in os.walk("./data/files"):
        for fit_file in files:
            if not fit_file.endswith(".fit"):
                continue
            input_files.append(os.path.join(root, fit_file))

    print(f"Found {len(input_files)} files to process")

    with concurrent.futures.ProcessPoolExecutor(max_workers=2) as executor:
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

    print("Done")


@app.command()
def read_fit(
    fit_file: str = typer.Argument(),
    out_file: str = typer.Option(None),
):
    """Read a .fit file and parse activity, laps, and tracepoints."""
    locations = json.load(open("./data/locations.json")).get("locations")
    activity, laps, tracepoints, performances = get_data(
        locations,
        fit_file,
    )

    if out_file:
        with open(out_file, "w") as f:
            json.dump(
                {
                    "activity": activity.model_dump(),
                },
                f,
                default=str,
            )
        return

    print("Activity:")
    print(activity)
    print("\nLaps:")
    for lap in laps:
        print(lap)
    print("\nTracepoints:")
    for tp in tracepoints[:10]:
        print(tp)
    if len(tracepoints) > 10:
        print(f"... ({len(tracepoints) - 10} more tracepoints)")


if __name__ == "__main__":
    app()
