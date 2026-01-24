import concurrent.futures
import json
import os

import typer

from sqlmodel import Session, SQLModel, select

from api.cli.formatters import ActivityFormatter
from api.db import engine
from api.model import User
from api.services.bulk_operations import BulkOperationService
from api.services.fit_file import FitFileService
from api.services.heatmap import HeatmapService
from api.services.location import LocationService
from api.services.performance import PerformanceService
from api.services.storage import StorageService
from api.utils import MAX_TRACEPOINTS_FOR_RESPONSE, calculate_activity_zone_data

NB_CPUS = 2

app = typer.Typer(add_completion=False)


def process_file(input_file: str) -> None:
    session = Session(engine)
    fit_file_service = FitFileService(session)
    performance_service = PerformanceService()

    activity, laps, tracepoints = fit_file_service.read_fit_file(input_file)

    performances = performance_service.calculate_running_performances(
        activity, tracepoints
    )
    performance_powers = performance_service.calculate_cycling_performances(
        activity, tracepoints
    )

    original_tracepoints = tracepoints.copy()

    while len(tracepoints) > MAX_TRACEPOINTS_FOR_RESPONSE:
        tracepoints = [tp for i, tp in enumerate(tracepoints) if i % 2 == 0]

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
    fit_file_service = FitFileService(session)
    performance_service = PerformanceService()
    formatter = ActivityFormatter(session)

    activity, laps, tracepoints = fit_file_service.read_fit_file(fit_file)

    performances = performance_service.calculate_running_performances(
        activity, tracepoints
    )
    performance_powers = performance_service.calculate_cycling_performances(
        activity, tracepoints
    )

    original_tracepoints = tracepoints.copy()

    while len(tracepoints) > MAX_TRACEPOINTS_FOR_RESPONSE:
        tracepoints = [tp for i, tp in enumerate(tracepoints) if i % 2 == 0]

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

    print(formatter.format_activity(activity))
    print()
    print(formatter.format_laps(laps))
    print()
    print(formatter.format_tracepoints(tracepoints))
    print()
    print(formatter.format_running_performances(performances))
    print()
    print(formatter.format_cycling_performances(performance_powers))

    if user:
        print()
        print(formatter.format_zone_analysis(user.id, activity, original_tracepoints))


@app.command()
def update_locations():
    """Update location fields for all activities using their lat/lon coordinates."""
    session = Session(engine)
    location_service = LocationService(session)

    print("Updating locations for all activities...")
    updated_count, total_count = location_service.update_all_locations()

    print(f"Updated {updated_count} of {total_count} activities with location data")


@app.command()
def update_performance_power():
    """Update power performances for all cycling activities."""
    session = Session(engine)
    bulk_service = BulkOperationService(session)

    print("Updating power performances for cycling activities...")
    result = bulk_service.update_performance_powers()

    print(f"Processed {result.processed_count} cycling activities")
    print(f"Skipped {result.skipped_count} activities")


@app.command()
def update_zones():
    """Update training zones for all users based on their existing activities."""
    session = Session(engine)
    bulk_service = BulkOperationService(session)

    print("Updating zones for all users...")
    result = bulk_service.update_zones()

    print(f"Updated zones for {result.processed_count} users")
    print(f"Skipped {result.skipped_count} users with no activities")


@app.command()
def update_ftp():
    """Update FTP values for all cycling activities."""
    session = Session(engine)
    bulk_service = BulkOperationService(session)

    print("Updating FTP values for cycling activities...")
    result = bulk_service.update_ftps()

    print(f"Processed {result.processed_count} FTP records")
    print(f"Skipped {result.skipped_count} dates")


@app.command()
def update_activity_zones(
    fit_dir: str = typer.Option(
        "./data/fit", "--fit-dir", "-d", help="Directory containing FIT files"
    ),
):
    """Update zone data for all activities by recalculating time spent in zones using FIT files."""
    session = Session(engine)
    bulk_service = BulkOperationService(session)

    print("Updating activity zones...")
    result = bulk_service.update_activity_zones(fit_dir)

    print("Zone update completed:")
    print(f"  Processed: {result.processed_count} activities")
    print(f"  Skipped: {result.skipped_count} activities")
    print(f"  Errors: {result.error_count} activities")


@app.command()
def recompute_activities(
    fit_dir: str = typer.Option(
        "./data/fit",
        "--fit-dir",
        "-d",
        help="Directory containing FIT files",
    ),
    user_email: str | None = typer.Option(
        None, "--user", "-u", help="Only recompute for specific user"
    ),
    activity_id: str | None = typer.Option(
        None, "--activity-id", "-a", help="Recompute specific activity by ID"
    ),
    start_date: str | None = typer.Option(
        None, "--start-date", "-s", help="Start date (YYYY-MM-DD)"
    ),
    end_date: str | None = typer.Option(
        None, "--end-date", "-e", help="End date (YYYY-MM-DD)"
    ),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without changes"),
    download_from_s3: bool = typer.Option(
        True,
        "--download-s3/--no-download-s3",
        help="Download from object storage if missing",
    ),
    batch_size: int = typer.Option(
        10, "--batch-size", "-b", help="Commit every N activities"
    ),
):
    """Recompute activity data from FIT files while preserving title, description, and race."""
    session = Session(engine)

    try:
        storage_service = None
        if download_from_s3:
            try:
                storage_service = StorageService()
            except Exception as e:
                print(f"Warning: Could not initialize object storage: {e}")
                print("Will only use local FIT files")

        bulk_service = BulkOperationService(session, storage_service)

        if dry_run:
            print("DRY RUN MODE - No changes will be made")

        print("Recomputing activities...")

        if not dry_run:
            result = bulk_service.recompute_activities(
                fit_dir=fit_dir,
                user_email=user_email,
                activity_id=activity_id,
                start_date=start_date,
                end_date=end_date,
                download_from_s3=download_from_s3,
                batch_size=batch_size,
            )

            print("\n" + "=" * 60)
            print("Recompute completed:")
            print(f"  Processed: {result.processed_count} activities")
            print(f"  Skipped:   {result.skipped_count} activities")
            print(f"  Errors:    {result.error_count} activities")
            print("=" * 60)

    finally:
        session.close()


@app.command()
def update_heatmap(
    user_email: str | None = typer.Option(
        None, "--user", "-u", help="Update heatmap for specific user only"
    ),
):
    """Update or create heatmap for users."""
    session = Session(engine)
    heatmap_service = HeatmapService(session)

    if user_email:
        user = session.exec(select(User).where(User.email == user_email)).first()
        if not user:
            print(f"User with email {user_email} not found")
            return
        users = [user]
    else:
        users = list(session.exec(select(User)).all())

    print(f"Updating heatmaps for {len(users)} user(s)...")

    for user in users:
        print(f"  Processing {user.email}...")
        heatmap = heatmap_service.compute_heatmap(user.id)
        print(
            f"    -> {heatmap.activity_count} activities, {heatmap.point_count} points"
        )

    print("Done")


if __name__ == "__main__":
    app()
