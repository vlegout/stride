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
    Lap,
    Location,
    PerformancePower,
    Tracepoint,
    User,
    Zone,
    Ftp,
)
from api.utils import (
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
) -> tuple[Activity, List[Lap], List[Tracepoint], list, list]:
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

    while len(tracepoints) > MAX_DATA_POINTS:
        tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

    return activity, laps, tracepoints, performances, performance_powers


def process_file(input_file: str) -> None:
    session = Session(engine)
    activity, laps, tracepoints, performances, performance_powers = get_data(
        session, input_file
    )
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
    out_file: str = typer.Option(None),
):
    """Read a .fit file and parse activity, laps, and tracepoints."""
    session = Session(engine)
    activity, laps, tracepoints, performances, performance_powers = get_data(
        session,
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
    print("\nRunning Performances:")
    for performance in performances:
        print(f"  {performance.distance}m: {performance.time}")
    print("\nCycling Power Performances:")
    for performance_power in performance_powers:
        print(f"  {performance_power.time}: {performance_power.power}W")


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
                .order_by(Tracepoint.timestamp)
            ).first()

            if first_tracepoint is None:
                continue

            city, subdivision, country = get_activity_location(
                session, first_tracepoint.lat, first_tracepoint.lon
            )

            if city is None and subdivision is None and country is None:
                try:
                    current_time = time.time()
                    if current_time - last_api_call < 1.0:
                        time.sleep(1.0 - (current_time - last_api_call))

                    url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={first_tracepoint.lat}&longitude={first_tracepoint.lon}&localityLanguage=en"
                    response = httpx.get(url, timeout=10.0, follow_redirects=True)
                    response.raise_for_status()
                    data = response.json()
                    last_api_call = time.time()

                    city = data.get("city") or data.get("locality")
                    subdivision = data.get("principalSubdivision")
                    country = data.get("countryName")

                    if city or subdivision or country:
                        location = Location(
                            id=uuid.uuid4(),
                            lat=first_tracepoint.lat,
                            lon=first_tracepoint.lon,
                            city=city,
                            subdivision=subdivision,
                            country=country,
                        )
                        session.add(location)

                        activity.city = city
                        activity.subdivision = subdivision
                        activity.country = country
                        updated_count += 1
                        print(
                            f"Added location and updated activity {activity.id}: {city}, {subdivision}, {country}"
                        )

                except Exception as e:
                    print(f"Error fetching location for activity {activity.id}: {e}")
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

    # Get all users
    users = session.exec(select(User)).all()

    print(f"Found {len(users)} users to process...")

    updated_count = 0
    skipped_count = 0

    for user in users:
        # Check if user has any activities
        activities = session.exec(
            select(Activity).where(
                Activity.user_id == user.id, Activity.status == "created"
            )
        ).all()

        if not activities:
            print(f"Skipping user {user.id} ({user.email}) - no activities found")
            skipped_count += 1
            continue

        # Check if user has zones
        existing_zones = session.exec(select(Zone).where(Zone.user_id == user.id)).all()

        if not existing_zones:
            print(f"Creating default zones for user {user.id} ({user.email}) first...")
            create_default_zones(session, user.id)
            session.commit()

        # Update zones based on activities
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
        .order_by(Activity.start_time)
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


if __name__ == "__main__":
    app()
