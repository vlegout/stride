import datetime
import math
import os
import random
import string
import uuid

from typing import List, Tuple, Optional

import boto3
from sqlmodel import Session, select
from botocore.exceptions import ClientError
from fastapi import HTTPException

from api.model import Activity, Location, Performance, PerformancePower, Tracepoint


def get_lat_lon(points: List[Tracepoint]) -> Tuple[float, float]:
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


def get_delta_lat_lon(lat: float, max_distance: float) -> Tuple[float, float]:
    earth_radius = 6371000
    delta_lat = max_distance / earth_radius * (180 / math.pi)
    delta_lon = (
        max_distance / (earth_radius * math.cos(math.radians(lat))) * (180 / math.pi)
    )

    return (delta_lat, delta_lon)


def get_uuid(filename: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, os.path.basename(filename))


def get_best_performances(
    activity: Activity, tracepoints: List[Tracepoint]
) -> List[Performance]:
    if not tracepoints:
        return []

    if activity.sport != "running":
        return []

    distances = [1000, 1609.344, 5000, 10000, 21097.5, 42195]
    max_distance = tracepoints[-1].distance
    performances = [
        Performance(id=uuid.uuid4(), activity_id=activity.id, distance=d)
        for d in distances
        if max_distance >= d
    ]
    if not performances:
        return []

    best_times = [datetime.timedelta.max] * len(performances)
    n = len(tracepoints)

    for i, perf in enumerate(performances):
        start = 0
        end = 0
        while start < n and tracepoints[start].distance <= max_distance - perf.distance:
            while (
                end < n
                and tracepoints[end].distance - tracepoints[start].distance
                < perf.distance
            ):
                end += 1
            if end < n:
                time = tracepoints[end].timestamp - tracepoints[start].timestamp
                if not best_times[i] or time < best_times[i]:
                    best_times[i] = time
            start += 1

    for perf, t in zip(performances, best_times):
        perf.time = t

    return performances


def get_best_performance_power(
    activity: Activity, tracepoints: List[Tracepoint]
) -> List[PerformancePower]:
    if not tracepoints:
        return []

    if activity.sport != "cycling":
        return []

    time_periods = [
        datetime.timedelta(minutes=1),
        datetime.timedelta(minutes=5),
        datetime.timedelta(minutes=10),
        datetime.timedelta(minutes=20),
        datetime.timedelta(hours=1),
        datetime.timedelta(hours=2),
    ]
    max_time = tracepoints[-1].timestamp - tracepoints[0].timestamp
    performance_powers = [
        PerformancePower(id=uuid.uuid4(), activity_id=activity.id, time=t)
        for t in time_periods
        if max_time >= t
    ]
    if not performance_powers:
        return []

    best_powers = [0.0] * len(performance_powers)
    n = len(tracepoints)

    for i, perf in enumerate(performance_powers):
        start = 0
        end = 0
        while start < n:
            while (
                end < n
                and tracepoints[end].timestamp - tracepoints[start].timestamp
                < perf.time
            ):
                end += 1
            if end >= n:
                break

            power_sum = 0.0
            power_count = 0
            for j in range(start, end + 1):
                power = tracepoints[j].power
                if power is not None:
                    power_sum += power
                    power_count += 1

            if power_count > 0:
                avg_power = power_sum / power_count
                if avg_power > best_powers[i]:
                    best_powers[i] = avg_power
            start += 1

    for perf, best_power in zip(performance_powers, best_powers):
        perf.power = best_power

    return performance_powers


def get_s3_client():
    return boto3.client("s3")


def generate_random_string(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def upload_file_to_s3(file_path: str, s3_key: str) -> None:
    bucket = os.environ.get("BUCKET")
    if not bucket:
        raise HTTPException(
            status_code=500, detail="BUCKET environment variable not set"
        )

    try:
        s3_client = get_s3_client()
        s3_client.upload_file(file_path, bucket, s3_key)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload file to S3: {str(e)}"
        )


def upload_content_to_s3(content: str, s3_key: str) -> None:
    bucket = os.environ.get("BUCKET")
    if not bucket:
        raise HTTPException(
            status_code=500, detail="BUCKET environment variable not set"
        )

    try:
        s3_client = get_s3_client()
        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=content.encode("utf-8"),
            ContentType="text/yaml",
        )
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload content to S3: {str(e)}"
        )


def get_activity_location(
    session: Session, lat: float, lon: float
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    lat_delta = 0.0045
    lon_delta = 0.0045 / math.cos(math.radians(lat))

    location = session.exec(
        select(Location).where(
            (Location.lat >= lat - lat_delta) & (Location.lat <= lat + lat_delta),
            (Location.lon >= lon - lon_delta) & (Location.lon <= lon + lon_delta),
        )
    ).first()

    if location:
        return location.city, location.subdivision, location.country

    return None, None, None
