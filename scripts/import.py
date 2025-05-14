import concurrent.futures
import datetime
import json
import math
import multiprocessing
import os

from typing import Any, Dict, List, Optional

import click
import fitdecode  # type: ignore
import yaml


from data import Activity, Activities, DataPoint, Lap, Pace, Profile, TracePoint
from utils import get_delta_lat_lon, get_lat_lon


NP_CPUS = multiprocessing.cpu_count()

MAX_DATA_POINTS = 500

DEVICE_MAP = {
    "edge_530": "Edge 530",
    "fr10": "FR 10",
    "fr110": "FR 110",
    "fr235": "FR 235",
    "fr745": "FR 745",
    "3121": "Edge 530",
    "3589": "FR 745",
    "4062": "Edge 840",
    "4315": "FR 965",
}


def get_lap(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    for field in list(Lap.model_fields.keys()):
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    if data.get("total_timer_time") and data.get("total_distance"):
        pace = datetime.timedelta(
            seconds=data.get("total_timer_time") * 1000 / data.get("total_distance")  # type: ignore
        )
        data["pace"] = Pace(
            minutes=math.floor(pace.total_seconds() / 60),
            seconds=int(pace.total_seconds() % 60),
        )

    return data


def get_session(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    for field in list(Activity.model_fields.keys())[4:]:
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    return data


def get_record(frame: fitdecode.records.FitDataMessage) -> Optional[Dict[str, Any]]:
    data: Dict[str, Any] = {}

    if not frame.has_field("position_lat") or not frame.get_value("position_lat"):
        return None
    elif not frame.has_field("position_long") or not frame.get_value("position_long"):
        return None

    data["lat"] = frame.get_value("position_lat")
    data["lon"] = frame.get_value("position_long")

    for field in list(DataPoint.model_fields.keys())[2:]:
        if frame.has_field(field) and frame.get_value(field):
            data[field] = frame.get_value(field)

    return data


class DataProcessor(fitdecode.DefaultDataProcessor):
    """
    A `DefaultDataProcessor` that also:

    * Converts all ``speed`` and ``*_speeds`` fields (by name) to ``km/h``
      (standard's default is ``m/s``)
    * Converts GPS coordinates (i.e. FIT's semicircles type) to ``deg``

    From https://github.com/polyvertex/fitdecode/blob/master/fitdecode/processors.py
    """

    def __init__(self):
        super().__init__()

    def on_process_field(self, reader, field_data):
        """
        Convert all ``*_speed`` fields using `process_field_speed`.

        All other units will use the default method.
        """
        if field_data.name and field_data.name.endswith("_speed"):
            self.process_field_speed(reader, field_data)
        else:
            super().on_process_field(reader, field_data)

    def process_field_speed(self, reader, field_data):
        if field_data.value is not None:
            factor = 60.0 * 60.0 / 1000.0

            # record.enhanced_speed field can be a tuple...
            # see https://github.com/dtcooper/python-fitparse/issues/62
            if isinstance(field_data.value, (tuple, list)):
                field_data.value = tuple(x * factor for x in field_data.value)
            else:
                field_data.value *= factor

        field_data.units = "km/h"

    def process_units_semicircles(self, reader, field_data):
        if field_data.value is not None:
            field_data.value *= 180.0 / (2**31)
        field_data.units = "deg"


def get_activity_from_fit(fit_file: str) -> Activity:
    activity: Optional[Activity] = None
    device: str = ""
    index: int = 0
    laps: List[Lap] = []
    data_points: List[DataPoint] = []
    trace_points: List[TracePoint] = []

    with fitdecode.FitReader(fit_file, processor=DataProcessor()) as fit:
        for frame in fit:
            if not isinstance(frame, fitdecode.records.FitDataMessage):
                continue

            if frame.name == "session":
                if session := get_session(frame):
                    activity = Activity(**session, fit=fit_file)
            elif frame.name == "lap":
                if lap := get_lap(frame):
                    laps.append(Lap(**lap))
                    index += 1
                    laps[-1].index = index
            elif frame.name == "record":
                if point := get_record(frame):
                    data_point = DataPoint(**point)
                    data_points.append(data_point)
                    trace_points.append(
                        TracePoint(lat=data_point.lat, lon=data_point.lon)
                    )

            elif frame.name == "device_info":
                if frame.has_field("garmin_product") and frame.get_value(
                    "garmin_product"
                ):
                    value = str(frame.get_value("garmin_product"))
                    if value in DEVICE_MAP:
                        device = DEVICE_MAP[value]

    if not activity:
        raise ValueError("Cannot find activity in file " + fit_file)

    activity.device = device
    activity.laps = laps
    activity.data_points = data_points
    activity.trace_points = trace_points
    activity.lat, activity.lon = get_lat_lon(activity.trace_points)

    while len(activity.data_points) > MAX_DATA_POINTS:
        activity.data_points = [
            dp for idx, dp in enumerate(activity.data_points) if idx % 2 == 0
        ]

    values = []
    max_distance = 1.0
    for dp in data_points:
        values.append(dp.enhanced_speed)
        if len(values) >= 10:
            dp.enhanced_speed = sum(values) / len(values)
            values.pop(0)

        distance = (
            math.sqrt((dp.lat - activity.lat) ** 2 + (dp.lon - activity.lon) ** 2)
            * 111139
        )
        max_distance = max(max_distance, distance)

    activity.delta_lat, activity.delta_lon = get_delta_lat_lon(
        activity.lat, max_distance
    )

    return activity


def dump_actitivities(
    profile: Profile, activities: Activities, full: bool, output_dir: str
):
    for activity in activities.activities:
        data = activity.model_dump(by_alias=True)

        if full and activity.fit.startswith("data/files"):
            with open("./legacy/" + str(activity.id) + ".json", "w") as file:
                json.dump(data, file, default=str)

        with open(
            f"./{output_dir}/activities/" + str(activity.id) + ".json", "w"
        ) as file:
            json.dump(data, file, default=str)

    with open(f"./{output_dir}/activities.json", "w") as file:
        json.dump(
            activities.model_dump(
                by_alias=True,
                exclude={
                    "activities": {"__all__": {"laps", "data_points", "trace_points"}}
                },
            ),
            file,
            default=str,
        )

    with open(f"./{output_dir}/profile.json", "w") as file:
        json.dump(
            profile.model_dump(),
            file,
            default=str,
        )

    activities.activities = activities.activities[:10]

    with open(f"./{output_dir}/last.json", "w") as file:
        json.dump(activities.model_dump(by_alias=True), file, default=str)


def get_activity_from_yaml(yaml_file: str) -> Activity:
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)
        activity = get_activity_from_fit("data/fit/" + config["fit"])

        if config.get("title"):
            activity.title = config["title"]
        if config.get("description"):
            activity.description = config["description"]

    return activity


def get_activity_or_legacy(data_file: str, full: bool) -> Activity:
    if full:
        activity = get_activity_from_fit(data_file)
    else:
        with open(data_file, "r") as file:
            activity = Activity.model_validate_json(file.read())

    return activity


def get_profile(activities: Activities) -> Profile:
    profile = Profile()

    profile.n_activities = len(activities.activities)
    profile.run_n_activities = len(
        [activity for activity in activities.activities if activity.sport == "running"]
    )
    profile.run_total_distance = sum(
        [
            activity.total_distance
            for activity in activities.activities
            if activity.sport == "running"
        ]
    )
    profile.cycling_n_activities = len(
        [activity for activity in activities.activities if activity.sport == "cycling"]
    )
    profile.cycling_total_distance = sum(
        [
            activity.total_distance
            for activity in activities.activities
            if activity.sport == "cycling"
        ]
    )

    return profile


@click.command()
@click.option("--full", is_flag=True, help="Full import of all activities.")
@click.option("--partial", is_flag=True, help="Partial import of activities.")
@click.option(
    "--output-dir", default="public", help="Target directory to dump JSON files."
)
def run(full, partial, output_dir):
    print("CPU:", NP_CPUS)
    print("Full import:", full)
    print("Partial import:", partial)

    activities = Activities(activities=[])

    data_files = []
    for root, _, files in os.walk("data/files" if full else "legacy"):
        for data_file in files:
            data_files.append(os.path.join(root, data_file))

            if full and partial:
                if len(data_files) >= 20:
                    break

    with concurrent.futures.ProcessPoolExecutor(max_workers=NP_CPUS) as executor:
        future_activities = {
            executor.submit(get_activity_or_legacy, data_file, full): data_file
            for data_file in data_files
        }
        for future in concurrent.futures.as_completed(future_activities):
            yaml_file = future_activities[future]
            try:
                activity = future.result()
                activities.activities.append(activity)
            except Exception as e:
                print(f"Error processing {yaml_file}: {e}")

    input_files = []
    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue
            input_files.append(os.path.join(root, yaml_file))

    with concurrent.futures.ProcessPoolExecutor(max_workers=NP_CPUS) as executor:
        future_activities = {
            executor.submit(get_activity_from_yaml, input_file): input_file
            for input_file in input_files
        }
        for future in concurrent.futures.as_completed(future_activities):
            yaml_file = future_activities[future]
            try:
                activity = future.result()
                activities.activities.append(activity)
            except Exception as e:
                print(f"Error processing {yaml_file}: {e}")

    activities.activities.sort(key=lambda x: x.start_time, reverse=True)

    profile = get_profile(activities)

    dump_actitivities(profile, activities, full, output_dir)


if __name__ == "__main__":
    run()
