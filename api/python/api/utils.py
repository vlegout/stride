import datetime
import math
import os
import random
import string
import uuid

import boto3
from sqlmodel import Session, select
from botocore.exceptions import ClientError
from fastapi import HTTPException

from api.model import (
    Activity,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Location,
    Notification,
    Performance,
    PerformancePower,
    Tracepoint,
    Zone,
)

# Training zone percentages - Heart Rate
HR_ZONE_1_MAX_PCT = 0.60  # Recovery zone
HR_ZONE_2_MAX_PCT = 0.70  # Aerobic base zone
HR_ZONE_3_MAX_PCT = 0.80  # Aerobic zone
HR_ZONE_4_MAX_PCT = 0.90  # Lactate threshold zone
HR_ZONE_5_MAX_PCT = 1.00  # VO2 max zone

# Training zone multipliers - Pace (relative to threshold pace)
PACE_ZONE_1_MULTIPLIER = 1.30  # Easy/Recovery (30% slower)
PACE_ZONE_2_MULTIPLIER = 1.20  # Aerobic (20% slower)
PACE_ZONE_3_MULTIPLIER = 1.10  # Marathon (10% slower)
PACE_ZONE_4_MULTIPLIER = 1.00  # Threshold (baseline)
PACE_ZONE_5_MULTIPLIER = 0.90  # VO2 max (10% faster)

# Training zone percentages - Power (relative to FTP)
POWER_ZONE_1_MAX_PCT = 0.55  # Recovery
POWER_ZONE_2_MAX_PCT = 0.75  # Endurance
POWER_ZONE_3_MAX_PCT = 0.90  # Tempo
POWER_ZONE_4_MAX_PCT = 1.05  # Lactate threshold
POWER_ZONE_5_MAX_PCT = 1.20  # VO2 max

# Default zone values for new users
DEFAULT_HR_ZONE_1_MAX = 114.0  # Recovery
DEFAULT_HR_ZONE_2_MAX = 133.0  # Aerobic base
DEFAULT_HR_ZONE_3_MAX = 152.0  # Aerobic
DEFAULT_HR_ZONE_4_MAX = 171.0  # Lactate threshold
DEFAULT_HR_ZONE_5_MAX = 190.0  # VO2 max

DEFAULT_PACE_ZONE_1_MAX = 390.0  # Recovery pace (sec/km)
DEFAULT_PACE_ZONE_2_MAX = 360.0  # Easy pace (sec/km)
DEFAULT_PACE_ZONE_3_MAX = 330.0  # Marathon pace (sec/km)
DEFAULT_PACE_ZONE_4_MAX = 300.0  # Lactate threshold (sec/km)
DEFAULT_PACE_ZONE_5_MAX = 270.0  # VO2 max pace (sec/km)

DEFAULT_POWER_ZONE_1_MAX = 138.0  # Recovery (watts)
DEFAULT_POWER_ZONE_2_MAX = 184.0  # Endurance (watts)
DEFAULT_POWER_ZONE_3_MAX = 230.0  # Tempo (watts)
DEFAULT_POWER_ZONE_4_MAX = 264.0  # Lactate threshold (watts)
DEFAULT_POWER_ZONE_5_MAX = 310.0  # VO2 max (watts)

# Estimation constants
FTP_FROM_MAX_POWER_MULTIPLIER = 0.85  # Estimate FTP as 85% of max power
MAX_HR_SAFETY_CAP = 200  # Cap estimated max HR at 200 bpm
HR_PERCENTILE_95_INDEX = 0.05  # Use 95th percentile (top 5%)
PACE_CONSERVATIVENESS_FACTOR = 1.15  # Add 15% when estimating from short runs
LONG_RUN_MIN_DISTANCE_METERS = 5000  # Minimum distance for "long run" (5km)
THRESHOLD_RUN_MIN_DISTANCE_METERS = 5000  # Min distance for threshold pace (5km)
THRESHOLD_RUN_MAX_DISTANCE_METERS = 15000  # Max distance for threshold pace (15km)
FASTEST_RUNS_PERCENTILE = 0.20  # Use fastest 20% for threshold estimation

# Time periods
ONE_YEAR_IN_DAYS = 365
SECONDS_PER_KM_CONVERSION = 3600

# Geolocation constants
EARTH_RADIUS_METERS = 6371000
METERS_PER_DEGREE = 111139
LOCATION_SEARCH_LAT_DELTA = 0.0045
LOCATION_SEARCH_LON_DELTA_BASE = 0.0045

# Performance tracking distances (meters)
DISTANCE_1KM = 1000
DISTANCE_1MILE = 1609.344
DISTANCE_5KM = 5000
DISTANCE_10KM = 10000
DISTANCE_HALF_MARATHON = 21097.5
DISTANCE_FULL_MARATHON = 42195

# Time zone calculation tolerance
POWER_TIME_TOLERANCE_SECONDS = 1

# API response limits
MAX_TRACEPOINTS_FOR_RESPONSE = 500


def get_lat_lon(points: list[Tracepoint]) -> tuple[float, float]:
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


def get_delta_lat_lon(lat: float, max_distance: float) -> tuple[float, float]:
    delta_lat = max_distance / EARTH_RADIUS_METERS * (180 / math.pi)
    delta_lon = (
        max_distance
        / (EARTH_RADIUS_METERS * math.cos(math.radians(lat)))
        * (180 / math.pi)
    )

    return (delta_lat, delta_lon)


def get_uuid(filename: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, os.path.basename(filename))


def get_best_performances(
    activity: Activity, tracepoints: list[Tracepoint]
) -> list[Performance]:
    if not tracepoints:
        return []

    if activity.sport != "running":
        return []

    distances = [
        DISTANCE_1KM,
        DISTANCE_1MILE,
        DISTANCE_5KM,
        DISTANCE_10KM,
        DISTANCE_HALF_MARATHON,
        DISTANCE_FULL_MARATHON,
    ]
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
    activity: Activity, tracepoints: list[Tracepoint]
) -> list[PerformancePower]:
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
                if time_diff >= target_seconds - POWER_TIME_TOLERANCE_SECONDS:
                    avg_power = power_sum / power_count
                    max_power = max(max_power, avg_power)

        best_powers[period_idx] = max_power

    for perf, best_power in zip(performance_powers, best_powers):
        perf.power = best_power

    return performance_powers


def detect_best_effort_achievements(
    session: Session, activity: Activity, performances: list[Performance]
) -> list[Notification]:
    """Detect if this activity achieved best efforts for year or all-time."""

    if activity.sport != "running":
        return []

    distances = [
        DISTANCE_1KM,
        DISTANCE_1MILE,
        DISTANCE_5KM,
        DISTANCE_10KM,
        DISTANCE_HALF_MARATHON,
        DISTANCE_FULL_MARATHON,
    ]
    current_year = datetime.date.fromtimestamp(activity.start_time).year

    current_perfs = {
        p.distance: p for p in performances if p.distance in distances and p.time
    }

    if not current_perfs:
        return []

    stmt = (
        select(Performance, Activity.start_time)
        .join(Activity)
        .where(
            Activity.user_id == activity.user_id,
            Activity.sport == "running",
            Activity.status == "created",
            Activity.id != activity.id,
            Performance.distance.in_(list(current_perfs.keys())),  # type: ignore
            Performance.time != None,  # noqa: E711
        )
    )
    historical_results = session.exec(stmt).all()

    historical_by_distance: dict[float, list[tuple[datetime.timedelta, int]]] = {}
    for perf, start_time in historical_results:
        if perf.time is None:
            continue
        if perf.distance not in historical_by_distance:
            historical_by_distance[perf.distance] = []
        perf_year = datetime.date.fromtimestamp(start_time).year
        historical_by_distance[perf.distance].append((perf.time, perf_year))

    notifications = []

    for target_distance, current_perf in current_perfs.items():
        if current_perf.time is None:
            continue

        historical_data = historical_by_distance.get(target_distance, [])

        if not historical_data:
            notifications.append(
                Notification(
                    activity_id=activity.id,
                    type="best_effort_all_time",
                    distance=target_distance,
                    achievement_year=None,
                    message="",
                )
            )
            continue

        all_times = [time for time, _ in historical_data]
        yearly_times = [time for time, year in historical_data if year == current_year]

        all_time_best = min(all_times)

        if current_perf.time < all_time_best:
            notifications.append(
                Notification(
                    activity_id=activity.id,
                    type="best_effort_all_time",
                    distance=target_distance,
                    achievement_year=None,
                    message="",
                )
            )
        elif not yearly_times or current_perf.time < min(yearly_times):
            notifications.append(
                Notification(
                    activity_id=activity.id,
                    type="best_effort_yearly",
                    distance=target_distance,
                    achievement_year=current_year,
                    message="",
                )
            )

    return notifications


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
) -> tuple[str | None, str | None, str | None]:
    lat_delta = LOCATION_SEARCH_LAT_DELTA
    lon_delta = LOCATION_SEARCH_LON_DELTA_BASE / math.cos(math.radians(lat))

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
    one_year_ago = datetime.datetime.now() - datetime.timedelta(days=ONE_YEAR_IN_DAYS)
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
        percentile_95_index = max(0, int(len(sorted_hrs) * HR_PERCENTILE_95_INDEX))
        estimated_max_hr = sorted_hrs[percentile_95_index]

        # Additional safety: ensure the estimated max HR is reasonable
        # If it seems too high, cap it at a more conservative value
        if estimated_max_hr > MAX_HR_SAFETY_CAP:
            estimated_max_hr = min(estimated_max_hr, MAX_HR_SAFETY_CAP)

        # Using standard 5-zone heart rate model based on estimated max HR
        # These percentages represent the upper limit of each zone
        hr_zones = [
            {
                "index": 1,
                "max_value": estimated_max_hr * HR_ZONE_1_MAX_PCT,
            },
            {
                "index": 2,
                "max_value": estimated_max_hr * HR_ZONE_2_MAX_PCT,
            },
            {
                "index": 3,
                "max_value": estimated_max_hr * HR_ZONE_3_MAX_PCT,
            },
            {
                "index": 4,
                "max_value": estimated_max_hr * HR_ZONE_4_MAX_PCT,
            },
            {
                "index": 5,
                "max_value": estimated_max_hr * HR_ZONE_5_MAX_PCT,
            },
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
            a
            for a in running_activities
            if a.total_distance >= LONG_RUN_MIN_DISTANCE_METERS
        ]

        if longer_runs:
            # Use activities between 5-15km as they're more likely to be at sustainable paces
            threshold_candidates = [
                a
                for a in longer_runs
                if THRESHOLD_RUN_MIN_DISTANCE_METERS
                <= a.total_distance
                <= THRESHOLD_RUN_MAX_DISTANCE_METERS
            ]

            if not threshold_candidates:
                # If no 5-15km runs, use all longer runs
                threshold_candidates = longer_runs

            # Take the fastest 20% of these longer runs to estimate threshold pace
            num_candidates = max(
                1, int(len(threshold_candidates) * FASTEST_RUNS_PERCENTILE)
            )
            fastest_longer_runs = sorted(
                threshold_candidates, key=lambda x: x.avg_speed or 0, reverse=True
            )[:num_candidates]

            # Calculate threshold pace from these more realistic activities
            # avg_speed is in km/h, so convert to pace (seconds per km)
            avg_threshold_speed_kmh = sum(
                a.avg_speed for a in fastest_longer_runs if a.avg_speed is not None
            ) / len(fastest_longer_runs)
            threshold_pace = SECONDS_PER_KM_CONVERSION / avg_threshold_speed_kmh
        else:
            # Fallback: if no long runs, use all running activities but be more conservative
            # Take only the middle 50% of speeds to avoid extremes
            speeds = sorted(
                [a.avg_speed for a in running_activities if a.avg_speed is not None]
            )
            start_idx = len(speeds) // 4
            end_idx = start_idx + len(speeds) // 2
            middle_speeds = speeds[start_idx:end_idx] if end_idx > start_idx else speeds
            avg_speed_kmh = sum(middle_speeds) / len(middle_speeds)
            threshold_pace = (
                SECONDS_PER_KM_CONVERSION / avg_speed_kmh
            ) * PACE_CONSERVATIVENESS_FACTOR

        # Using standard 5-zone pace model based on threshold pace
        # Note: Higher pace values = slower, so multipliers work differently
        pace_zones = [
            {
                "index": 1,
                "max_value": threshold_pace * PACE_ZONE_1_MULTIPLIER,
            },
            {
                "index": 2,
                "max_value": threshold_pace * PACE_ZONE_2_MULTIPLIER,
            },
            {
                "index": 3,
                "max_value": threshold_pace * PACE_ZONE_3_MULTIPLIER,
            },
            {
                "index": 4,
                "max_value": threshold_pace * PACE_ZONE_4_MULTIPLIER,
            },
            {
                "index": 5,
                "max_value": threshold_pace * PACE_ZONE_5_MULTIPLIER,
            },
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
        estimated_ftp = max(max_powers) * FTP_FROM_MAX_POWER_MULTIPLIER

        # Using standard 5-zone power model based on FTP
        power_zones = [
            {
                "index": 1,
                "max_value": estimated_ftp * POWER_ZONE_1_MAX_PCT,
            },
            {
                "index": 2,
                "max_value": estimated_ftp * POWER_ZONE_2_MAX_PCT,
            },
            {
                "index": 3,
                "max_value": estimated_ftp * POWER_ZONE_3_MAX_PCT,
            },
            {
                "index": 4,
                "max_value": estimated_ftp * POWER_ZONE_4_MAX_PCT,
            },
            {
                "index": 5,
                "max_value": estimated_ftp * POWER_ZONE_5_MAX_PCT,
            },
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
        {
            "type": "heart_rate",
            "index": 1,
            "max_value": DEFAULT_HR_ZONE_1_MAX,
        },
        {
            "type": "heart_rate",
            "index": 2,
            "max_value": DEFAULT_HR_ZONE_2_MAX,
        },
        {
            "type": "heart_rate",
            "index": 3,
            "max_value": DEFAULT_HR_ZONE_3_MAX,
        },
        {
            "type": "heart_rate",
            "index": 4,
            "max_value": DEFAULT_HR_ZONE_4_MAX,
        },
        {
            "type": "heart_rate",
            "index": 5,
            "max_value": DEFAULT_HR_ZONE_5_MAX,
        },
        # Pace zones (in seconds per km - typical marathon runner)
        {
            "type": "pace",
            "index": 1,
            "max_value": DEFAULT_PACE_ZONE_1_MAX,
        },
        {"type": "pace", "index": 2, "max_value": DEFAULT_PACE_ZONE_2_MAX},
        {
            "type": "pace",
            "index": 3,
            "max_value": DEFAULT_PACE_ZONE_3_MAX,
        },
        {
            "type": "pace",
            "index": 4,
            "max_value": DEFAULT_PACE_ZONE_4_MAX,
        },
        {
            "type": "pace",
            "index": 5,
            "max_value": DEFAULT_PACE_ZONE_5_MAX,
        },
        # Power zones (in watts - typical recreational cyclist)
        {
            "type": "power",
            "index": 1,
            "max_value": DEFAULT_POWER_ZONE_1_MAX,
        },
        {
            "type": "power",
            "index": 2,
            "max_value": DEFAULT_POWER_ZONE_2_MAX,
        },
        {"type": "power", "index": 3, "max_value": DEFAULT_POWER_ZONE_3_MAX},
        {
            "type": "power",
            "index": 4,
            "max_value": DEFAULT_POWER_ZONE_4_MAX,
        },
        {"type": "power", "index": 5, "max_value": DEFAULT_POWER_ZONE_5_MAX},
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
    session: Session, activity: Activity, tracepoints: list[Tracepoint]
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
    zones: list[Zone], tracepoints: list[Tracepoint]
) -> dict[uuid.UUID, float]:
    """Calculate time spent in each heart rate zone"""
    zone_data: dict[uuid.UUID, float] = {}

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


def _calculate_pace_zones(
    zones: list[Zone], tracepoints: list[Tracepoint]
) -> dict[uuid.UUID, float]:
    """Calculate time spent in each pace zone"""
    zone_data: dict[uuid.UUID, float] = {}

    zones_by_index = sorted(zones, key=lambda z: z.index)

    for i in range(len(tracepoints) - 1):
        current_tp = tracepoints[i]
        next_tp = tracepoints[i + 1]

        if current_tp.speed <= 0:
            continue

        # Calculate pace in seconds per km
        speed_kmh = current_tp.speed  # Treat as km/h directly
        if speed_kmh > 0:
            pace = SECONDS_PER_KM_CONVERSION / speed_kmh
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
    zones: list[Zone], tracepoints: list[Tracepoint]
) -> dict[uuid.UUID, float]:
    """Calculate time spent in each power zone"""
    zone_data: dict[uuid.UUID, float] = {}

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
