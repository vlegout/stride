# /// script
# dependencies = [
#   "fit2gpx",
#   "fitdecode",
#   "gpxpy",
#   "pydantic",
#   "pyyaml",
# ]
# ///


import asyncio
import datetime
import json
import math
import os
import sys
import uuid

from typing import Any, List, Tuple

import fitdecode
import gpxpy
import yaml

from fit2gpx import Converter

from pydantic import BaseModel


class Activity(BaseModel):
    id: uuid.UUID = None

    fit: str
    sport: str = None

    title: str = ""
    description: str = ""

    start_time: datetime.datetime = None
    total_timer_time: float = 0.0
    total_elapsed_time: float = 0.0
    timestamp: datetime.datetime = None

    total_distance: float = 0.0
    total_ascent: float = 0.0

    average_speed: float = 0.0

    total_calories: float = 0.0

    total_training_effect: float = 0.0
    total_anaerobic_training_effect: float = 0.0

    lat: float = 0.0
    lon: float = 0.0

    points: List[Any] = None


class Activities(BaseModel):
    activities: list[Activity]


async def get_lat_lon(points: List[float]) -> Tuple[float, float]:
    x = y = z = 0.0

    if len(points) == 0:
        return 0.0, 0.0

    for point in points:
        lat = math.radians(float(point[1]))
        lon = math.radians(float(point[0]))

        x += math.cos(lat) * math.cos(lon)
        y += math.cos(lat) * math.sin(lon)
        z += math.sin(lat)

    total = len(points)

    x = x / total
    y = y / total
    z = z / total

    lat = math.atan2(y, x)
    lon = math.atan2(z, math.sqrt(x * x + y * y))

    return map(math.degrees, (lat, lon))


async def get_activity_from_fit(fit_file: str) -> Activity:
    activity = Activity(id=uuid.uuid4(), fit=fit_file)

    with fitdecode.FitReader(fit_file) as fit:
        for frame in fit:
            if frame.frame_type == fitdecode.FIT_FRAME_DATA and frame.name == "session":
                for field in frame.fields:
                    if field.name == "sport":
                        activity.sport = field.value
                    if field.name == "start_time":
                        activity.start_time = field.value
                    if field.name == "total_distance":
                        activity.total_distance = field.value
                    if field.name == "total_ascent":
                        activity.total_ascent = field.value
                    if field.name == "total_timer_time":
                        activity.total_timer_time = field.value
                    if field.name == "total_elapsed_time":
                        activity.total_elapsed_time = field.value
                    elif field.name == "enhanced_avg_speed" and field.value:
                        activity.average_speed = field.value * 60 * 60 / 1000
                    if field.name == "total_calories":
                        activity.total_calories = field.value
                    if field.name == "total_training_effect":
                        activity.total_training_effect = field.value
                    if field.name == "total_anaerobic_training_effect":
                        activity.total_anaerobic_training_effect = field.value
                    if field.name == "timestamp":
                        activity.timestamp = field.value

    conv = Converter()
    gpx = conv.fit_to_gpx(f_in=fit_file, f_out="file.gpx")

    points = []

    with open("file.gpx") as gpxfile:
        gpx = gpxpy.parse(gpxfile)

        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append((point.latitude, point.longitude))

    activity.points = points
    activity.lat, activity.lon = await get_lat_lon(points)

    return activity


async def dump_actitivities(activities: List[Activities], full: bool):
    for activity in activities.activities:
        if not activity.title:
            if activity.sport == "running":
                activity.title = "Run"
            elif activity.sport == "cycling":
                activity.title = "Ride"
            else:
                activity.title = "Activity"

        data = activity.model_dump()

        if full and activity.fit.startswith("data/files"):
            with open("./legacy/" + str(activity.id) + ".json", "w") as file:
                json.dump(data, file, default=str)

        with open("./public/activities/" + str(activity.id) + ".json", "w") as file:
            json.dump(data, file, default=str)

    with open("./public/activities.json", "w") as file:
        json.dump(
            activities.model_dump(exclude={"activities": {"__all__": {"points"}}}),
            file,
            default=str,
        )

    activities.activities = activities.activities[:10]

    with open("./public/last.json", "w") as file:
        json.dump(activities.model_dump(), file, default=str)


async def run(argv: List[str]):
    full = False
    if len(argv) > 1 and argv[1] == "true":
        full = True

    print("Full import:", full)

    activities = Activities(activities=[])

    for root, _, files in os.walk("data/files" if full else "legacy"):
        for data_file in files:
            if full:
                activity = await get_activity_from_fit(os.path.join(root, data_file))
            else:
                activity = Activity.parse_file(os.path.join(root, data_file))

            activities.activities.append(activity)

    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue

            with open(os.path.join(root, yaml_file), "r") as file:
                config = yaml.safe_load(file)
                activity = await get_activity_from_fit("data/fit/" + config["fit"])

                if config.get("title"):
                    activity.title = config["title"]
                if config.get("description"):
                    activity.description = config["description"]

                activities.activities.append(activity)

    activities.activities.sort(key=lambda x: x.start_time, reverse=True)

    await dump_actitivities(activities, full)


loop = asyncio.get_event_loop()
loop.run_until_complete(run(sys.argv))
