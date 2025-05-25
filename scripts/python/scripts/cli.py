import json
import math
import uuid

from typing import Any, List

import typer
import yaml

from sqlmodel import Session, SQLModel

from db import engine
from model import Activity, ActivityCreate, Lap, Tracepoint
from utils import get_best_performances, get_lat_lon, get_uuid, get_delta_lat_lon, get_distance

import scripts

app = typer.Typer()


def get_activity_from_fit(
    locations: List[Any], fit_file: str, title: str, description: str, race: bool
) -> Activity:
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
        Lap(id=uuid.uuid4(), activity_id=activity.id, **lap)
        for lap in fit.get("laps", [])
    ]
    tracepoints = [
        Tracepoint(id=uuid.uuid4(), activity_id=activity.id, **point)
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

    performances = []  # get_best_performances(activity.id, tracepoints)

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
