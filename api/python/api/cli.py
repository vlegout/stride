import asyncio
import concurrent.futures
import json
import os

from typing import Any, List

import typer
import yaml

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

from api.db import engine
from api.fit import get_activity_from_fit
from api.model import Activity, Lap, Tracepoint
from api.utils import get_best_performances

MAX_DATA_POINTS = 500
NB_CPUS = 2

app = typer.Typer()


async def get_activity_from_yaml(
    locations: List[Any], yaml_file: str
) -> tuple[Activity, List[Lap], List[Tracepoint]]:
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)

    activity, laps, tracepoints = await get_activity_from_fit(
        locations,
        "./data/fit/" + config["fit"],
        config.get("title", ""),
        config.get("description", ""),
        config.get("race", False),
    )

    return activity, laps, tracepoints


async def get_data(
    locations: List[Any], input_file: str
) -> tuple[Activity, List[Lap], List[Tracepoint], list]:
    if input_file.endswith(".yaml"):
        activity, laps, tracepoints = await get_activity_from_yaml(
            locations,
            input_file,
        )
    else:
        activity, laps, tracepoints = await get_activity_from_fit(
            locations,
            input_file,
        )

    performances = get_best_performances(activity, tracepoints)

    while len(tracepoints) > MAX_DATA_POINTS:
        tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

    return activity, laps, tracepoints, performances


async def process_file(locations: List[Any], input_file: str) -> None:
    activity, laps, tracepoints, performances = await get_data(locations, input_file)

    async with AsyncSession(engine) as session:
        session.add(activity)

        for lap in laps:
            session.add(lap)

        for tracepoint in tracepoints:
            session.add(tracepoint)

        for performance in performances:
            session.add(performance)

        await session.commit()


async def _add_activity_async(yaml: str):
    """Add a new activity from a YAML file."""
    locations = json.load(open("./data/locations.json")).get("locations")
    await process_file(locations, yaml)


@app.command()
def add_activity(
    yaml: str = typer.Argument(),
):
    """Add a new activity from a YAML file."""
    asyncio.run(_add_activity_async(yaml))


@app.command()
def create_db():
    """Create tables and add initial data."""
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

    locations = json.load(open("./data/locations.json")).get("locations")

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
            executor.submit(process_file, locations, input_file): input_file
            for input_file in input_files
        }
        for future in concurrent.futures.as_completed(future_activities):
            input_file = future_activities[future]
            try:
                future.result()
            except Exception as e:
                print(f"Error processing {input_file}: {e}")

    print("Done")


async def _read_fit_async(
    fit_file: str,
    out_file: str | None = None,
):
    """Read a .fit file and parse activity, laps, and tracepoints."""
    locations = json.load(open("./data/locations.json")).get("locations")
    activity, laps, tracepoints, performances = await get_data(
        locations,
        fit_file,
    )

    if out_file:
        with open(out_file, "w") as f:
            json.dump(
                activity.model_dump(mode="json"),
                f,
                ensure_ascii=False,
                indent=2,
            )
    else:
        print(json.dumps(activity.model_dump(mode="json"), indent=2))


@app.command()
def read_fit(
    fit_file: str = typer.Argument(),
    out_file: str = typer.Option(None),
):
    """Read a .fit file and parse activity, laps, and tracepoints."""
    asyncio.run(_read_fit_async(fit_file, out_file))


if __name__ == "__main__":
    app()
