import concurrent.futures
import datetime
import json
import os
import time
import uuid

from typing import List

import httpx
import typer
import yaml

from sqlmodel import Session, SQLModel, select

from api.db import engine
from api.fit import get_activity_from_fit
from api.model import (
    Activity,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Lap,
    Location,
    Performance,
    PerformancePower,
    Tracepoint,
    User,
    Zone,
    Ftp,
)
from api.utils import (
    calculate_activity_zone_data,
    get_best_performances,
    get_best_performance_power,
    get_activity_location,
    update_user_zones_from_activities,
    create_default_zones,
)
from api.fitness import update_ftp_for_date

MAX_DATA_POINTS = 500
NB_CPUS = 2

app = typer.Typer()


def fetch_location(lat: float, lon: float, activity_id: uuid.UUID) -> Location | None:
    url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"

    try:
        response = httpx.get(url, timeout=10.0, follow_redirects=True)
        response.raise_for_status()
        data = response.json()
    except httpx.TimeoutException as e:
        print(f"Timeout fetching location for activity {activity_id}: {e}")
        return None
    except httpx.RequestError as e:
        print(f"Request error fetching location for activity {activity_id}: {e}")
        return None
    except httpx.HTTPStatusError as e:
        print(f"HTTP status error fetching location for activity {activity_id}: {e}")
        return None

    return Location(
        id=uuid.uuid4(),
        lat=lat,
        lon=lon,
        city=data.get("city") or data.get("locality"),
        subdivision=data.get("principalSubdivision"),
        country=data.get("countryName"),
    )


def get_activity_from_yaml(
    session: Session, yaml_file: str
) -> tuple[Activity, List[Lap], List[Tracepoint]]:
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)

    activity, laps, tracepoints = get_activity_from_fit(
        session,
        "./data/fit/" + config["fit"],
        config.get("title", ""),
        config.get("description", ""),
        config.get("race", False),
    )

    return activity, laps, tracepoints


def get_data(
    session: Session, input_file: str
) -> tuple[
    Activity,
    List[Lap],
    List[Tracepoint],
    List[Tracepoint],
    List[Performance],
    List[PerformancePower],
]:
    if input_file.endswith(".yaml"):
        activity, laps, tracepoints = get_activity_from_yaml(
            session,
            input_file,
        )
    else:
        activity, laps, tracepoints = get_activity_from_fit(
            session,
            input_file,
        )

    performances = get_best_performances(activity, tracepoints)
    performance_powers = get_best_performance_power(activity, tracepoints)

    # Store original tracepoints for zone calculation before filtering
    original_tracepoints = tracepoints.copy()

    while len(tracepoints) > MAX_DATA_POINTS:
        tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

    return (
        activity,
        laps,
        tracepoints,
        original_tracepoints,
        performances,
        performance_powers,
    )


def process_file(input_file: str) -> None:
    session = Session(engine)
    (
        activity,
        laps,
        tracepoints,
        original_tracepoints,
        performances,
        performance_powers,
    ) = get_data(session, input_file)
    session.add(activity)

    for lap in laps:
        session.add(lap)

    for tracepoint in tracepoints:
        session.add(tracepoint)

    for performance in performances:
        session.add(performance)

    for performance_power in performance_powers:
        session.add(performance_power)

    session.commit()

    # Calculate and save zone data for this activity using original unfiltered tracepoints
    calculate_activity_zone_data(session, activity, original_tracepoints)
    session.commit()


@app.command()
def add_activity(
    yaml: str = typer.Argument(),
):
    """Add a new activity from a YAML file."""
    process_file(yaml)


@app.command()
def create_db():
    """Create tables and add initial data."""
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

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
            executor.submit(process_file, input_file): input_file
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
    email: str | None = typer.Option(None, help="User email to fetch zones (optional)"),
    out_file: str = typer.Option(None),
):
    """Read a .fit file and parse activity, laps, and tracepoints."""
    session = Session(engine)
    (
        activity,
        laps,
        tracepoints,
        original_tracepoints,
        performances,
        performance_powers,
    ) = get_data(
        session,
        fit_file,
    )

    # Find user by email and set activity user_id for zone calculations (if email provided)
    user = None
    if email:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            print(f"User with email {email} not found")
            return
        activity.user_id = user.id

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

    print("\nRunning Performances:")
    for performance in performances:
        print(f"  {performance.distance}m: {performance.time}")
    print("\nCycling Power Performances:")
    for performance_power in performance_powers:
        print(f"  {performance_power.time}: {performance_power.power}W")

    # Calculate and print zone data (only if user is provided)
    if user:
        print("\nZone Analysis:")
        user_zones = session.exec(select(Zone).where(Zone.user_id == user.id)).all()

        if not user_zones:
            print("  No zones found for user")
        else:
            # Group zones by type
            heart_rate_zones = [z for z in user_zones if z.type == "heart_rate"]
            pace_zones = [z for z in user_zones if z.type == "pace"]
            power_zones = [z for z in user_zones if z.type == "power"]

            hr_zone_data_display = {}
            pace_zone_data_display = {}
            power_zone_data_display = {}

            # Calculate heart rate zones
            if heart_rate_zones and any(tp.heart_rate for tp in original_tracepoints):
                from api.utils import _calculate_heart_rate_zones

                hr_zone_data = _calculate_heart_rate_zones(
                    heart_rate_zones, original_tracepoints
                )
                for zone in heart_rate_zones:
                    if zone.id in hr_zone_data:
                        hr_zone_data_display[
                            f"HR Zone {zone.index} (≤{zone.max_value:.0f} bpm)"
                        ] = hr_zone_data[zone.id]

            # Calculate pace zones for running
            if pace_zones and activity.sport == "running":
                from api.utils import _calculate_pace_zones

                pace_zone_data = _calculate_pace_zones(pace_zones, original_tracepoints)
                for zone in pace_zones:
                    if zone.id in pace_zone_data:
                        pace_min = int(zone.max_value // 60)
                        pace_sec = int(zone.max_value % 60)

                        # Display format depends on zone
                        if zone.index == 5:  # Fastest zone
                            zone_label = f"Pace Zone {zone.index} (≤{pace_min}:{pace_sec:02d} /km)"
                        elif zone.index == 1:  # Slowest zone
                            zone_label = f"Pace Zone {zone.index} (>{pace_min}:{pace_sec:02d} /km)"
                        else:  # Middle zones - show range
                            # Find the next faster zone to show range
                            faster_zone = next(
                                (z for z in pace_zones if z.index == zone.index + 1),
                                None,
                            )
                            if faster_zone:
                                faster_min = int(faster_zone.max_value // 60)
                                faster_sec = int(faster_zone.max_value % 60)
                                zone_label = f"Pace Zone {zone.index} ({faster_min}:{faster_sec:02d}-{pace_min}:{pace_sec:02d} /km)"
                            else:
                                zone_label = f"Pace Zone {zone.index} (≤{pace_min}:{pace_sec:02d} /km)"

                        pace_zone_data_display[zone_label] = pace_zone_data[zone.id]

            # Calculate power zones for cycling
            if (
                power_zones
                and activity.sport == "cycling"
                and any(tp.power for tp in original_tracepoints)
            ):
                from api.utils import _calculate_power_zones

                power_zone_data = _calculate_power_zones(
                    power_zones, original_tracepoints
                )
                for zone in power_zones:
                    if zone.id in power_zone_data:
                        power_zone_data_display[
                            f"Power Zone {zone.index} (≤{zone.max_value:.0f} W)"
                        ] = power_zone_data[zone.id]

            # Display zones with percentages per type
            if (
                hr_zone_data_display
                or pace_zone_data_display
                or power_zone_data_display
            ):
                print("  Time in zones:")

                # Display heart rate zones
                if hr_zone_data_display:
                    hr_total_time = sum(hr_zone_data_display.values())
                    for zone_name, time_seconds in sorted(hr_zone_data_display.items()):
                        time_min = int(time_seconds // 60)
                        time_sec = int(time_seconds % 60)
                        percentage = (
                            (time_seconds / hr_total_time * 100)
                            if hr_total_time > 0
                            else 0
                        )
                        print(
                            f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                        )

                # Display pace zones
                if pace_zone_data_display:
                    pace_total_time = sum(pace_zone_data_display.values())
                    for zone_name, time_seconds in sorted(
                        pace_zone_data_display.items()
                    ):
                        time_min = int(time_seconds // 60)
                        time_sec = int(time_seconds % 60)
                        percentage = (
                            (time_seconds / pace_total_time * 100)
                            if pace_total_time > 0
                            else 0
                        )
                        print(
                            f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                        )

                # Display power zones
                if power_zone_data_display:
                    power_total_time = sum(power_zone_data_display.values())
                    for zone_name, time_seconds in sorted(
                        power_zone_data_display.items()
                    ):
                        time_min = int(time_seconds // 60)
                        time_sec = int(time_seconds % 60)
                        percentage = (
                            (time_seconds / power_total_time * 100)
                            if power_total_time > 0
                            else 0
                        )
                        print(
                            f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                        )
            else:
                print(
                    "  No zone data calculated (missing sensor data or incompatible sport)"
                )


@app.command()
def update_locations():
    """Update location fields for all activities using their lat/lon coordinates."""
    session = Session(engine)

    activities = session.exec(select(Activity)).all()
    updated_count = 0
    last_api_call = 0

    print(f"Found {len(activities)} activities to process...")

    for activity in activities:
        if (
            activity.city is None
            and activity.subdivision is None
            and activity.country is None
        ):
            first_tracepoint = session.exec(
                select(Tracepoint)
                .where(Tracepoint.activity_id == activity.id)
                .order_by(Tracepoint.timestamp)  # type: ignore[arg-type]
            ).first()

            if first_tracepoint is None:
                continue

            city, subdivision, country = get_activity_location(
                session, first_tracepoint.lat, first_tracepoint.lon
            )

            if city is None and subdivision is None and country is None:
                current_time = time.time()
                if current_time - last_api_call < 1.0:
                    time.sleep(1.0 - (current_time - last_api_call))

                location = fetch_location(
                    first_tracepoint.lat, first_tracepoint.lon, activity.id
                )
                if location is None:
                    continue

                last_api_call = time.time()

                session.add(location)

                activity.city = location.city
                activity.subdivision = location.subdivision
                activity.country = location.country
                updated_count += 1
                print(
                    f"Added location and updated activity {activity.id}: {location.city}, {location.subdivision}, {location.country}"
                )

            elif city is not None or subdivision is not None or country is not None:
                activity.city = city
                activity.subdivision = subdivision
                activity.country = country
                updated_count += 1
                print(
                    f"Updated activity {activity.id}: {city}, {subdivision}, {country}"
                )

    session.commit()
    print(f"Updated {updated_count} activities with location data")


@app.command()
def update_performance_power():
    """Update power performances for all cycling activities."""
    session = Session(engine)

    cycling_activities = session.exec(
        select(Activity).where(
            Activity.sport == "cycling", Activity.status == "created"
        )
    ).all()

    print(f"Found {len(cycling_activities)} cycling activities to process...")

    processed_count = 0
    skipped_count = 0

    for activity in cycling_activities:
        existing_power_performances = session.exec(
            select(PerformancePower).where(PerformancePower.activity_id == activity.id)
        ).all()

        if existing_power_performances:
            print(f"Skipping activity {activity.id} - already has power performances")
            continue

        # Check if FIT file exists in data/fit or data/files
        fit_file_paths = [f"./data/fit/{activity.fit}", f"./data/files/{activity.fit}"]
        fit_file_path = None
        for path in fit_file_paths:
            if os.path.exists(path):
                fit_file_path = path
                break

        if fit_file_path is None:
            print(
                f"Skipping activity {activity.id} - FIT file {activity.fit} not found in data/fit or data/files"
            )
            skipped_count += 1
            continue

        try:
            # Read tracepoints directly from FIT file
            _, _, tracepoints = get_activity_from_fit(session, fit_file_path)

            if not tracepoints:
                print(f"Skipping activity {activity.id} - no tracepoints in FIT file")
                continue

            performance_powers = get_best_performance_power(activity, tracepoints)

            if performance_powers:
                for performance_power in performance_powers:
                    session.add(performance_power)
                processed_count += 1
                print(f"Added power performances for activity {activity.id}")
            else:
                print(f"No power performances calculated for activity {activity.id}")

        except Exception as e:
            print(f"Error processing FIT file for activity {activity.id}: {e}")
            skipped_count += 1

    session.commit()
    print(
        f"Processed {processed_count} cycling activities and added power performances"
    )
    print(f"Skipped {skipped_count} activities due to missing FIT files or errors")


@app.command()
def update_zones():
    """Update training zones for all users based on their existing activities."""
    session = Session(engine)

    users = session.exec(select(User)).all()

    print(f"Found {len(users)} users to process...")

    updated_count = 0
    skipped_count = 0

    for user in users:
        activities = session.exec(
            select(Activity).where(
                Activity.user_id == user.id, Activity.status == "created"
            )
        ).all()

        if not activities:
            print(f"Skipping user {user.id} ({user.email}) - no activities found")
            skipped_count += 1
            continue

        existing_zones = session.exec(select(Zone).where(Zone.user_id == user.id)).all()

        if not existing_zones:
            print(f"Creating default zones for user {user.id} ({user.email}) first...")
            create_default_zones(session, user.id)
            session.commit()

        print(
            f"Updating zones for user {user.id} ({user.email}) based on {len(activities)} activities..."
        )
        update_user_zones_from_activities(session, user.id)
        updated_count += 1
        print(f"Updated zones for user {user.id} ({user.email})")

    print(f"Updated zones for {updated_count} users")
    print(f"Skipped {skipped_count} users with no activities")


@app.command()
def update_ftp():
    """Update FTP values for all cycling activities."""
    session = Session(engine)

    # Get all cycling activities
    cycling_activities = session.exec(
        select(Activity)
        .where(Activity.sport == "cycling", Activity.status == "created")
        .order_by(Activity.start_time)  # type: ignore[arg-type]
    ).all()

    print(f"Found {len(cycling_activities)} cycling activities to process...")

    processed_count = 0
    skipped_count = 0
    activities_by_user = {}

    # Group activities by user for better processing
    for activity in cycling_activities:
        if activity.user_id not in activities_by_user:
            activities_by_user[activity.user_id] = []
        activities_by_user[activity.user_id].append(activity)

    print(f"Processing activities for {len(activities_by_user)} users...")

    for user_id, user_activities in activities_by_user.items():
        print(f"Processing {len(user_activities)} activities for user {user_id}...")

        processed_activities = set()

        for activity in user_activities:
            activity_date = datetime.date.fromtimestamp(activity.start_time)

            # Skip if we already processed this date for this user
            date_key = (user_id, activity_date)
            if date_key in processed_activities:
                continue

            # Check if FTP already exists for this date
            existing_ftp = session.exec(
                select(Ftp).where(Ftp.user_id == user_id, Ftp.date == activity_date)
            ).first()

            if existing_ftp:
                print(
                    f"  Skipping {activity_date} - FTP already exists ({existing_ftp.ftp:.1f}W)"
                )
                skipped_count += 1
                processed_activities.add(date_key)
                continue

            # Update FTP for this date
            try:
                update_ftp_for_date(session, user_id, activity_date)

                # Check if FTP was actually created (i.e., calculated FTP > 0)
                new_ftp = session.exec(
                    select(Ftp).where(Ftp.user_id == user_id, Ftp.date == activity_date)
                ).first()

                if new_ftp:
                    print(f"  Created FTP for {activity_date}: {new_ftp.ftp:.1f}W")
                    processed_count += 1
                else:
                    print(
                        f"  No FTP calculated for {activity_date} (insufficient data)"
                    )
                    skipped_count += 1

                processed_activities.add(date_key)

            except Exception as e:
                print(f"  Error processing {activity_date}: {e}")
                skipped_count += 1

    print(f"Processed {processed_count} FTP records")
    print(f"Skipped {skipped_count} dates (existing records or insufficient data)")


@app.command()
def update_activity_zones():
    """Update zone data for all activities by recalculating time spent in zones using FIT files."""
    session = Session(engine)

    # Get all activities with status 'created'
    activities = session.exec(
        select(Activity)
        .where(Activity.status == "created")
        .order_by(Activity.start_time)  # type: ignore[arg-type]
    ).all()

    print(f"Found {len(activities)} activities to process...")

    processed_count = 0
    skipped_count = 0
    error_count = 0

    for activity in activities:
        try:
            print(f"Processing activity {activity.id} ({activity.sport})...")

            if not activity.user_id:
                print(f"  Skipping activity {activity.id} - no user_id")
                skipped_count += 1
                continue

            # Check if FIT file exists in data/fit or data/files
            fit_file_paths = [
                f"./data/fit/{activity.fit}",
                f"./data/files/{activity.fit}",
            ]
            fit_file_path = None
            for path in fit_file_paths:
                if os.path.exists(path):
                    fit_file_path = path
                    break

            if fit_file_path is None:
                print(
                    f"  Skipping activity {activity.id} - FIT file {activity.fit} not found"
                )
                skipped_count += 1
                continue

            # Delete existing zone data for this activity
            existing_pace_zones = session.exec(
                select(ActivityZonePace).where(
                    ActivityZonePace.activity_id == activity.id
                )
            ).all()
            for zone in existing_pace_zones:
                session.delete(zone)

            existing_power_zones = session.exec(
                select(ActivityZonePower).where(
                    ActivityZonePower.activity_id == activity.id
                )
            ).all()
            for zone in existing_power_zones:
                session.delete(zone)

            existing_hr_zones = session.exec(
                select(ActivityZoneHeartRate).where(
                    ActivityZoneHeartRate.activity_id == activity.id
                )
            ).all()
            for zone in existing_hr_zones:
                session.delete(zone)

            # Read tracepoints from FIT file
            try:
                _, _, tracepoints = get_activity_from_fit(session, fit_file_path)
            except Exception as e:
                print(f"  Error reading FIT file for activity {activity.id}: {e}")
                error_count += 1
                continue

            if not tracepoints:
                print(f"  Skipping activity {activity.id} - no tracepoints in FIT file")
                skipped_count += 1
                continue

            # Check if user has zones before calculating
            user_zones = session.exec(
                select(Zone).where(Zone.user_id == activity.user_id)
            ).all()

            if not user_zones:
                print(f"  Creating default zones for user {activity.user_id}")
                create_default_zones(session, activity.user_id)
                session.commit()

            print(
                f"  Found {len(tracepoints)} tracepoints, user has {len(user_zones)} zones"
            )

            # Check what sensor data is available
            has_hr = any(tp.heart_rate for tp in tracepoints)
            has_power = any(tp.power for tp in tracepoints)
            print(
                f"  Sensor data - HR: {has_hr}, Power: {has_power}, Sport: {activity.sport}"
            )

            # Recalculate zone data using tracepoints from FIT file
            calculate_activity_zone_data(session, activity, tracepoints)

            # Count new zone entries to verify calculation worked
            new_pace_zones = session.exec(
                select(ActivityZonePace).where(
                    ActivityZonePace.activity_id == activity.id
                )
            ).all()
            new_power_zones = session.exec(
                select(ActivityZonePower).where(
                    ActivityZonePower.activity_id == activity.id
                )
            ).all()
            new_hr_zones = session.exec(
                select(ActivityZoneHeartRate).where(
                    ActivityZoneHeartRate.activity_id == activity.id
                )
            ).all()

            zone_counts = len(new_pace_zones) + len(new_power_zones) + len(new_hr_zones)
            print(
                f"  Updated activity {activity.id}: {zone_counts} zone entries created (HR: {len(new_hr_zones)}, Pace: {len(new_pace_zones)}, Power: {len(new_power_zones)})"
            )

            processed_count += 1

            # Commit every 10 activities to avoid memory issues
            if processed_count % 10 == 0:
                session.commit()
                print(
                    f"  Committed batch (processed {processed_count} activities so far)"
                )

        except Exception as e:
            print(f"  Error processing activity {activity.id}: {e}")
            error_count += 1
            # Rollback the session to continue with next activity
            session.rollback()

    # Final commit
    session.commit()

    print("Zone update completed:")
    print(f"  Processed: {processed_count} activities")
    print(f"  Skipped: {skipped_count} activities")
    print(f"  Errors: {error_count} activities")


if __name__ == "__main__":
    app()
