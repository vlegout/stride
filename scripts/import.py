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

    title: str = None
    description: str = None

    end: datetime.datetime = None
    start_time: datetime.datetime = None
    total_timer_time: datetime.timedelta = None
    total_elapsed_time: datetime.timedelta = None

    total_distance: float = 0.0

    average_speed: float = 0.0

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
                    if field.name == "total_timer_time":
                        activity.total_timer_time = field.value
                    if field.name == "total_elapsed_time":
                        activity.total_elapsed_time = field.value
                    elif field.name == "enhanced_avg_speed" and field.value:
                        activity.average_speed = field.value * 60 * 60 / 1000
                    if field.name == "timestamp":
                        activity.end = field.value

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


async def run():
    activities = Activities(activities=[])

    for root, _, files in os.walk("data/files"):
        for file in files:
            if file.endswith(".fit"):
                activity = await get_activity_from_fit(os.path.join(root, file))

                with open(
                    "./public/activities/" + str(activity.id) + ".json", "w"
                ) as file:
                    json.dump(activity.model_dump(), file, default=str)

                activities.activities.append(activity)

    yaml_files = []
    for root, _, files in os.walk("./data/"):
        for file in files:
            if file.endswith(".yaml"):
                yaml_files.append(os.path.join(root, file))

    for yaml_file in yaml_files:
        with open(yaml_file, "r") as file:
            config = yaml.safe_load(file)

            activity = await get_activity_from_fit("data/fit/" + config["fit"])

            if config.get("title"):
                activity.title = config["title"]
            if config.get("description"):
                activity.description = config["description"]

            with open("./public/activities/" + str(activity.id) + ".json", "w") as file:
                json.dump(activity.model_dump(), file, default=str)

            activities.activities.append(activity)

    activities.activities.sort(key=lambda x: x.start_time, reverse=True)

    with open("./public/activities.json", "w") as file:
        json.dump(
            activities.model_dump(exclude={"activities": {"__all__": {"points"}}}),
            file,
            default=str,
        )

    activities.activities = activities.activities[:10]

    with open("./public/last.json", "w") as file:
        json.dump(activities.model_dump(), file, default=str)


loop = asyncio.get_event_loop()
loop.run_until_complete(run())
