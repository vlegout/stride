import datetime
import math
import os
import random
import string
import uuid

from typing import List, Tuple, Optional, Dict

import boto3
from sqlmodel import Session, select
from sqlalchemy import func, desc, asc
from botocore.exceptions import ClientError
from fastapi import HTTPException

from api.model import (
    Activity,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Location,
    Performance,
    PerformancePower,
    PerformanceRecord,
    Tracepoint,
    Zone,
)


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

    time_periods = []

    # Every second up to 2 minutes (120 seconds)
    for s in range(1, 121):
        time_periods.append(datetime.timedelta(seconds=s))

    # Every 10 seconds from 130s to 3600s (60 minutes)
    for s in range(130, 3601, 10):
        time_periods.append(datetime.timedelta(seconds=s))

    # Every minute after 60 minutes
    for m in range(61, 241):  # up to 4 hours
        time_periods.append(datetime.timedelta(minutes=m))

    max_time = tracepoints[-1].timestamp - tracepoints[0].timestamp
    performance_powers = [
        PerformancePower(id=uuid.uuid4(), activity_id=activity.id, time=t)
        for t in time_periods
        if max_time >= t
    ]
    if not performance_powers:
        return []

    # Convert time periods to seconds for faster comparison
    period_seconds = [int(p.time.total_seconds()) for p in performance_powers]
    best_powers = [0.0] * len(performance_powers)
    n = len(tracepoints)

    # Pre-filter tracepoints with valid power data
    valid_tracepoints = [
        (i, tp) for i, tp in enumerate(tracepoints) if tp.power is not None
    ]

    if not valid_tracepoints:
        return performance_powers

    # For each time period, use efficient sliding window
    for period_idx, target_seconds in enumerate(period_seconds):
        if target_seconds == 0:
            continue

        max_power = 0.0

        # Use two pointers for sliding window
        left = 0
        power_sum = 0.0
        power_count = 0

        for right in range(n):
            # Add current point to window if it has power
            right_power = tracepoints[right].power
            if right_power is not None:
                power_sum += right_power
                power_count += 1

            # Shrink window from left while it's too large
            while left <= right:
                time_diff = (
                    tracepoints[right].timestamp - tracepoints[left].timestamp
                ).total_seconds()
                if time_diff < target_seconds:
                    break

                # Remove left point from window if it has power
                left_power = tracepoints[left].power
                if left_power is not None:
                    power_sum -= left_power
                    power_count -= 1
                left += 1

            # Update max power if window is valid
            if power_count > 0:
                time_diff = (
                    tracepoints[right].timestamp - tracepoints[left].timestamp
                ).total_seconds()
                if time_diff >= target_seconds - 1:  # Allow 1 second tolerance
                    avg_power = power_sum / power_count
                    max_power = max(max_power, avg_power)

        best_powers[period_idx] = max_power

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


def update_user_zones_from_activities(session: Session, user_id: str) -> None:
    """Update user's training zones based on their existing activities from the last year"""

    # Calculate timestamp for one year ago
    one_year_ago = datetime.datetime.now() - datetime.timedelta(days=365)
    one_year_ago_timestamp = int(one_year_ago.timestamp())

    # Get user activities from the last year only
    activities = session.exec(
        select(Activity).where(
            Activity.user_id == user_id,
            Activity.status == "created",
            Activity.start_time >= one_year_ago_timestamp,
        )
    ).all()

    if not activities:
        return

    # Calculate heart rate zones (based on max HR from activities)
    heart_rates = [a.max_heart_rate for a in activities if a.max_heart_rate is not None]
    if heart_rates:
        # Use 95th percentile of max heart rates to avoid outliers, but ensure it's realistic
        sorted_hrs = sorted(heart_rates, reverse=True)
        percentile_95_index = max(0, int(len(sorted_hrs) * 0.05))
        estimated_max_hr = sorted_hrs[percentile_95_index]

        # Additional safety: ensure the estimated max HR is reasonable
        # If it seems too high, cap it at a more conservative value
        if estimated_max_hr > 200:
            estimated_max_hr = min(estimated_max_hr, 200)

        # Using standard 5-zone heart rate model based on estimated max HR
        # These percentages represent the upper limit of each zone
        hr_zones = [
            {
                "index": 1,
                "max_value": estimated_max_hr * 0.60,
            },  # Zone 1: Recovery (50-60% max HR)
            {
                "index": 2,
                "max_value": estimated_max_hr * 0.70,
            },  # Zone 2: Aerobic base (60-70% max HR)
            {
                "index": 3,
                "max_value": estimated_max_hr * 0.80,
            },  # Zone 3: Aerobic (70-80% max HR)
            {
                "index": 4,
                "max_value": estimated_max_hr * 0.90,
            },  # Zone 4: Lactate threshold (80-90% max HR)
            {
                "index": 5,
                "max_value": estimated_max_hr * 1.00,
            },  # Zone 5: VO2 max (90-100% max HR)
        ]

        # Update heart rate zones
        for zone_data in hr_zones:
            zone = session.exec(
                select(Zone).where(
                    Zone.user_id == user_id,
                    Zone.type == "heart_rate",
                    Zone.index == zone_data["index"],
                )
            ).first()
            if zone:
                zone.max_value = zone_data["max_value"]
                session.add(zone)

    # Calculate pace zones (based on longer running activities)
    running_activities = [a for a in activities if a.sport == "running"]
    if running_activities:
        # Filter for longer runs (>= 5km) to get more realistic threshold pace estimates
        # Shorter runs tend to be much faster and not representative of threshold pace
        longer_runs = [
            a for a in running_activities if a.total_distance >= 5000
        ]  # >= 5km

        if longer_runs:
            # Use activities between 5-15km as they're more likely to be at sustainable paces
            threshold_candidates = [
                a for a in longer_runs if 5000 <= a.total_distance <= 15000
            ]

            if not threshold_candidates:
                # If no 5-15km runs, use all longer runs
                threshold_candidates = longer_runs

            # Take the fastest 20% of these longer runs to estimate threshold pace
            num_candidates = max(1, len(threshold_candidates) // 5)
            fastest_longer_runs = sorted(
                threshold_candidates, key=lambda x: x.avg_speed, reverse=True
            )[:num_candidates]

            # Calculate threshold pace from these more realistic activities
            # avg_speed is in km/h, so convert to pace (seconds per km)
            avg_threshold_speed_kmh = sum(
                a.avg_speed for a in fastest_longer_runs
            ) / len(fastest_longer_runs)
            threshold_pace = (
                3600 / avg_threshold_speed_kmh
            )  # seconds per km (3600 sec/hr ÷ km/h)
        else:
            # Fallback: if no long runs, use all running activities but be more conservative
            # Take only the middle 50% of speeds to avoid extremes
            speeds = sorted([a.avg_speed for a in running_activities])
            start_idx = len(speeds) // 4
            end_idx = start_idx + len(speeds) // 2
            middle_speeds = speeds[start_idx:end_idx] if end_idx > start_idx else speeds
            avg_speed_kmh = sum(middle_speeds) / len(middle_speeds)
            threshold_pace = (
                3600 / avg_speed_kmh
            ) * 1.15  # Add 15% to make it more conservative

        # Using standard 5-zone pace model based on threshold pace
        # Note: Higher pace values = slower, so multipliers work differently
        pace_zones = [
            {
                "index": 1,
                "max_value": threshold_pace * 1.30,
            },  # Easy/Recovery (30% slower)
            {"index": 2, "max_value": threshold_pace * 1.20},  # Aerobic (20% slower)
            {"index": 3, "max_value": threshold_pace * 1.10},  # Marathon (10% slower)
            {"index": 4, "max_value": threshold_pace * 1.00},  # Threshold (baseline)
            {"index": 5, "max_value": threshold_pace * 0.90},  # VO2 max (10% faster)
        ]

        # Update pace zones
        for zone_data in pace_zones:
            zone = session.exec(
                select(Zone).where(
                    Zone.user_id == user_id,
                    Zone.type == "pace",
                    Zone.index == zone_data["index"],
                )
            ).first()
            if zone:
                zone.max_value = zone_data["max_value"]
                session.add(zone)

    # Calculate power zones (based on max power from cycling activities)
    cycling_activities = [
        a for a in activities if a.sport == "cycling" and a.max_power is not None
    ]
    if cycling_activities:
        # Use the highest max power as functional threshold power (FTP) estimate
        # This is simplified - in reality FTP should be based on 20min or 1hr power
        max_powers = [
            a.max_power for a in cycling_activities if a.max_power is not None
        ]
        estimated_ftp = max(max_powers) * 0.85  # Rough estimate: max power * 0.85

        # Using standard 5-zone power model based on FTP
        power_zones = [
            {"index": 1, "max_value": estimated_ftp * 0.55},  # Recovery (< 55% FTP)
            {"index": 2, "max_value": estimated_ftp * 0.75},  # Endurance (55-75% FTP)
            {"index": 3, "max_value": estimated_ftp * 0.90},  # Tempo (75-90% FTP)
            {
                "index": 4,
                "max_value": estimated_ftp * 1.05,
            },  # Lactate threshold (90-105% FTP)
            {"index": 5, "max_value": estimated_ftp * 1.20},  # VO2 max (105-120% FTP)
        ]

        # Update power zones
        for zone_data in power_zones:
            zone = session.exec(
                select(Zone).where(
                    Zone.user_id == user_id,
                    Zone.type == "power",
                    Zone.index == zone_data["index"],
                )
            ).first()
            if zone:
                zone.max_value = zone_data["max_value"]
                session.add(zone)

    # Commit all zone updates
    session.commit()


def create_default_zones(session: Session, user_id: str):
    """Create default zones for a new user"""
    default_zones = [
        # Heart rate zones (typical zones based on max HR)
        {"type": "heart_rate", "index": 1, "max_value": 114.0},  # Recovery
        {"type": "heart_rate", "index": 2, "max_value": 133.0},  # Aerobic base
        {"type": "heart_rate", "index": 3, "max_value": 152.0},  # Aerobic
        {"type": "heart_rate", "index": 4, "max_value": 171.0},  # Lactate threshold
        {"type": "heart_rate", "index": 5, "max_value": 190.0},  # VO2 max
        # Pace zones (in seconds per km - typical marathon runner)
        {"type": "pace", "index": 1, "max_value": 390.0},  # Recovery pace
        {"type": "pace", "index": 2, "max_value": 360.0},  # Easy pace
        {"type": "pace", "index": 3, "max_value": 330.0},  # Marathon pace
        {"type": "pace", "index": 4, "max_value": 300.0},  # Lactate threshold
        {"type": "pace", "index": 5, "max_value": 270.0},  # VO2 max pace
        # Power zones (in watts - typical recreational cyclist)
        {"type": "power", "index": 1, "max_value": 138.0},  # Recovery
        {"type": "power", "index": 2, "max_value": 184.0},  # Endurance
        {"type": "power", "index": 3, "max_value": 230.0},  # Tempo
        {"type": "power", "index": 4, "max_value": 264.0},  # Lactate threshold
        {"type": "power", "index": 5, "max_value": 310.0},  # VO2 max
    ]

    for zone_data in default_zones:
        zone = Zone(
            user_id=user_id,
            index=zone_data["index"],
            type=zone_data["type"],
            max_value=zone_data["max_value"],
        )
        session.add(zone)


def calculate_activity_zone_data(
    session: Session, activity: Activity, tracepoints: List[Tracepoint]
) -> None:
    """Calculate and save time spent in each zone for an activity"""
    if not tracepoints or not activity.user_id:
        return

    # Get user's zones
    user_zones = session.exec(
        select(Zone).where(Zone.user_id == activity.user_id)
    ).all()

    if not user_zones:
        return

    # Group zones by type
    heart_rate_zones = [z for z in user_zones if z.type == "heart_rate"]
    pace_zones = [z for z in user_zones if z.type == "pace"]
    power_zones = [z for z in user_zones if z.type == "power"]

    # Calculate heart rate zone data
    if heart_rate_zones and any(tp.heart_rate for tp in tracepoints):
        zone_data = _calculate_heart_rate_zones(heart_rate_zones, tracepoints)
        for zone_id, time_in_zone in zone_data.items():
            if time_in_zone > 0:
                activity_zone_hr = ActivityZoneHeartRate(
                    activity_id=activity.id,
                    zone_id=zone_id,
                    time_in_zone=time_in_zone,
                )
                session.add(activity_zone_hr)

    # Calculate pace zone data for running
    if pace_zones and activity.sport == "running":
        zone_data = _calculate_pace_zones(pace_zones, tracepoints)
        for zone_id, time_in_zone in zone_data.items():
            if time_in_zone > 0:
                activity_zone_pace = ActivityZonePace(
                    activity_id=activity.id,
                    zone_id=zone_id,
                    time_in_zone=time_in_zone,
                )
                session.add(activity_zone_pace)

    # Calculate power zone data for cycling
    if (
        power_zones
        and activity.sport == "cycling"
        and any(tp.power for tp in tracepoints)
    ):
        zone_data = _calculate_power_zones(power_zones, tracepoints)
        for zone_id, time_in_zone in zone_data.items():
            if time_in_zone > 0:
                activity_zone_power = ActivityZonePower(
                    activity_id=activity.id,
                    zone_id=zone_id,
                    time_in_zone=time_in_zone,
                )
                session.add(activity_zone_power)


def _calculate_heart_rate_zones(
    zones: List[Zone], tracepoints: List[Tracepoint]
) -> Dict[uuid.UUID, float]:
    """Calculate time spent in each heart rate zone"""
    zone_data: Dict[uuid.UUID, float] = {}

    # Sort zones by max_value for proper zone assignment
    sorted_zones = sorted(zones, key=lambda z: z.max_value)

    for i in range(len(tracepoints) - 1):
        current_tp = tracepoints[i]
        next_tp = tracepoints[i + 1]

        if current_tp.heart_rate is None:
            continue

        # Calculate time spent at this heart rate
        time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

        # Find which zone this heart rate belongs to
        zone_id = None
        for zone in sorted_zones:
            if current_tp.heart_rate <= zone.max_value:
                zone_id = zone.id
                break

        if zone_id:
            zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

    return zone_data


def create_performance_records(
    session: Session,
    activity: Activity,
    performances: List[Performance],
    performance_powers: List[PerformancePower],
) -> List[PerformanceRecord]:
    records = []
    current_year = datetime.datetime.fromtimestamp(activity.start_time).year

    for performance in performances:
        metric_type = f"{int(performance.distance)}m_time"
        if performance.time is None:
            continue

        value = performance.time.total_seconds()

        for scope in ["year", "all_time"]:
            query = (
                select(Performance)
                .join(Activity)
                .where(
                    Activity.user_id == activity.user_id,
                    Activity.sport == activity.sport,
                    Performance.distance == performance.distance,
                    Performance.time is not None,
                )
            )

            if scope == "year":
                query = query.where(
                    func.extract("year", func.to_timestamp(Activity.start_time))
                    == current_year
                )

            existing_perfs = session.exec(
                query.order_by(asc(Performance.time)).limit(5)  # type: ignore[arg-type]
            ).all()

            rank = None
            for i, existing_perf in enumerate(existing_perfs):
                if existing_perf.time and value < existing_perf.time.total_seconds():
                    rank = i + 1
                    break

            if rank is None and len(existing_perfs) < 5:
                rank = len(existing_perfs) + 1

            if rank and rank <= 5:
                record = PerformanceRecord(
                    id=uuid.uuid4(),
                    activity_id=activity.id,
                    performance_id=performance.id,
                    metric_type=metric_type,
                    value=value,
                    rank=rank,
                    scope=scope,
                    sport=activity.sport,
                    year=current_year,
                )
                records.append(record)

    for performance_power in performance_powers:
        metric_type = f"{int(performance_power.time.total_seconds())}s_power"
        value = performance_power.power

        for scope in ["year", "all_time"]:
            power_query = (
                select(PerformancePower)
                .join(Activity)
                .where(
                    Activity.user_id == activity.user_id,
                    Activity.sport == activity.sport,
                    PerformancePower.time == performance_power.time,
                )
            )

            if scope == "year":
                power_query = power_query.where(
                    func.extract("year", func.to_timestamp(Activity.start_time))
                    == current_year
                )

            existing_power_perfs = session.exec(
                power_query.order_by(desc(PerformancePower.power)).limit(5)  # type: ignore[arg-type]
            ).all()

            rank = None
            for i, existing_perf in enumerate(existing_power_perfs):  # type: ignore[assignment]
                if value > existing_perf.power:  # type: ignore[attr-defined]
                    rank = i + 1
                    break

            if rank is None and len(existing_power_perfs) < 5:
                rank = len(existing_power_perfs) + 1

            if rank and rank <= 5:
                record = PerformanceRecord(
                    id=uuid.uuid4(),
                    activity_id=activity.id,
                    performance_power_id=performance_power.id,
                    metric_type=metric_type,
                    value=value,
                    rank=rank,
                    scope=scope,
                    sport=activity.sport,
                    year=current_year,
                )
                records.append(record)

    return records


def _calculate_pace_zones(
    zones: List[Zone], tracepoints: List[Tracepoint]
) -> Dict[uuid.UUID, float]:
    """Calculate time spent in each pace zone"""
    zone_data: Dict[uuid.UUID, float] = {}

    zones_by_index = sorted(zones, key=lambda z: z.index)

    for i in range(len(tracepoints) - 1):
        current_tp = tracepoints[i]
        next_tp = tracepoints[i + 1]

        if current_tp.speed <= 0:
            continue

        # Calculate pace in seconds per km
        speed_kmh = current_tp.speed  # Treat as km/h directly
        if speed_kmh > 0:
            pace = 3600 / speed_kmh  # sec/km
        else:
            continue  # Skip points with zero speed

        # Calculate time spent at this pace
        time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

        # Find which zone this pace belongs to
        zone_id = None

        # Check from fastest to slowest zone to find the most appropriate zone
        for zone in reversed(zones_by_index):
            if pace <= zone.max_value:
                zone_id = zone.id
                break

        # If no zone found (pace is slower than all zones), assign to slowest zone
        if zone_id is None:
            zone_id = zones_by_index[0].id  # Zone 1 (slowest)

        zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

    return zone_data


def _calculate_power_zones(
    zones: List[Zone], tracepoints: List[Tracepoint]
) -> Dict[uuid.UUID, float]:
    """Calculate time spent in each power zone"""
    zone_data: Dict[uuid.UUID, float] = {}

    # Sort zones by max_value for proper zone assignment
    sorted_zones = sorted(zones, key=lambda z: z.max_value)

    for i in range(len(tracepoints) - 1):
        current_tp = tracepoints[i]
        next_tp = tracepoints[i + 1]

        if current_tp.power is None:
            continue

        # Calculate time spent at this power
        time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

        # Find which zone this power belongs to
        zone_id = None
        for zone in sorted_zones:
            if current_tp.power <= zone.max_value:
                zone_id = zone.id
                break

        if zone_id:
            zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

    return zone_data
