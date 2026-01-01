import math
import os
import uuid

from pydantic import field_validator, ValidationInfo
from sqlmodel import Session

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
    get_activity_location,
    METERS_PER_DEGREE,
)

import api.api

SPEED_MS_TO_KMH = 3.6
SPEED_CONVERSION_DIVISOR = 1000.0
ALTITUDE_CONVERSION_DIVISOR = 5.0
ALTITUDE_CONVERSION_OFFSET = 500.0
TOTAL_TRAINING_EFFECT_DIVISOR = 10.0

SPEED_SMOOTHING_WINDOW_SIZE = 10


class ActivityCreate(ActivityBase):
    @field_validator("total_training_effect", mode="before")
    @classmethod
    def tte(cls, value: int | None) -> float | None:
        if value is None:
            return None
        return value / TOTAL_TRAINING_EFFECT_DIVISOR

    @field_validator("avg_speed", mode="before")
    @classmethod
    def avg_speed_validator(
        cls, value: float | None, info: ValidationInfo
    ) -> float | None:
        if value is None:
            if (
                info.data.get("total_distance", 0) > 0
                and info.data.get("total_timer_time", 0) > 0
            ):
                avg_speed = info.data["total_distance"] / info.data["total_timer_time"]
                return round(avg_speed * SPEED_MS_TO_KMH, 2)
            return None

        if (
            value == 0
            and info.data.get("total_distance", 0) > 0
            and info.data.get("total_timer_time", 0) > 0
        ):
            avg_speed = info.data["total_distance"] / info.data["total_timer_time"]
            return round(avg_speed * SPEED_MS_TO_KMH, 2)

        return round(value * SPEED_MS_TO_KMH / SPEED_CONVERSION_DIVISOR, 2)


class LapCreate(LapBase):
    pass


class TracepointCreate(TracepointBase):
    @field_validator("speed", mode="before")
    @classmethod
    def speed_ms(cls, value: int) -> float:
        return value * SPEED_MS_TO_KMH / SPEED_CONVERSION_DIVISOR

    @field_validator("altitude", mode="before")
    @classmethod
    def altitude_m(cls, value: int) -> float:
        return value / ALTITUDE_CONVERSION_DIVISOR - ALTITUDE_CONVERSION_OFFSET


def get_activity_from_fit(
    session: Session,
    fit_file: str,
    title: str = "Activity",
    description: str = "",
    race: bool = False,
    fit_name: str | None = None,
) -> tuple[Activity, list[Lap], list[Tracepoint]]:
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
        LapCreate(id=uuid.uuid4(), activity_id=activity_create.id, **lap)
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
        activity.city, activity.subdivision, activity.country = get_activity_location(
            session, tracepoints[0].lat, tracepoints[0].lon
        )

    values = []
    max_distance = 1.0
    for dp in tracepoints:
        values.append(dp.speed)
        if len(values) >= SPEED_SMOOTHING_WINDOW_SIZE:
            dp.speed = sum(values) / len(values)
            values.pop(0)

        distance = (
            math.sqrt((dp.lat - activity.lat) ** 2 + (dp.lon - activity.lon) ** 2)
            * METERS_PER_DEGREE
        )
        max_distance = max(max_distance, distance)

    activity.delta_lat, activity.delta_lon = get_delta_lat_lon(
        activity.lat, max_distance
    )

    return activity, laps, tracepoints
