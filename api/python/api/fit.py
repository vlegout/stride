import datetime
import math
import os
import uuid

from typing import Any, List

from pydantic import field_validator, ValidationInfo

from api.model import (
    Activity,
    ActivityBase,
    Lap,
    LapBase,
    Tracepoint,
    TracepointBase,
)
from api.utils import (
    get_lat_lon,
    get_uuid,
    get_delta_lat_lon,
    get_distance,
)

import api.api


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
