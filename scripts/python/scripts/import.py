import concurrent.futures
import datetime
import json
import math
import multiprocessing
import os

from typing import Any, List

import click
import yaml

import scripts


from data import (
    Activity,
    Activities,
    Performance,
    Profile,
    Statistic,
    TracePoint,
    WeeksStatistics,
    YearsStatistics,
)
from utils import (
    get_best_performances,
    get_delta_lat_lon,
    get_distance,
    get_lat_lon,
    get_uuid,
)


NP_CPUS = multiprocessing.cpu_count()

MAX_DATA_POINTS = 500


def get_activity_from_fit(locations: List[Any], fit_file: str) -> Activity:
    session = scripts.get_device_info(fit_file)
    activity = Activity(**session)

    if not activity:
        raise ValueError("Cannot find activity in file " + fit_file)

    for point in activity.data_points:
        activity.trace_points.append(TracePoint(lat=point.lat, lon=point.lon))

    activity.id = get_uuid(fit_file)
    activity.fit = fit_file
    activity.lat, activity.lon = get_lat_lon(activity.trace_points)

    if len(activity.data_points) > 0 and activity.sport == "running":
        activity.performances = get_best_performances(activity.data_points)

    if len(activity.trace_points) > 0:
        lat = activity.trace_points[0].lat
        lon = activity.trace_points[0].lon

        for loc in locations:
            if get_distance(loc.get("lat"), loc.get("lon"), lat, lon) < 500:
                activity.location = loc.get("location")

    while len(activity.data_points) > MAX_DATA_POINTS:
        activity.data_points = [
            dp for idx, dp in enumerate(activity.data_points) if idx % 2 == 0
        ]

    values = []
    max_distance = 1.0
    for dp in activity.data_points:
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

    with open(f"./{output_dir}/races.json", "w") as file:
        races = activities.model_copy()
        races.activities = [
            activity for activity in races.activities if activity.race is True
        ]
        json.dump(
            races.model_dump(
                by_alias=True,
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


def get_activity_from_yaml(locations: List[Any], yaml_file: str) -> Activity:
    with open(yaml_file, "r") as file:
        config = yaml.safe_load(file)
        activity = get_activity_from_fit(locations, "data/fit/" + config["fit"])

        if config.get("title"):
            activity.title = config["title"]
        if config.get("description"):
            activity.description = config["description"]
        if config.get("race"):
            activity.race = config["race"]

    return activity


def get_activity_or_legacy(
    locations: List[Any], data_file: str, full: bool
) -> Activity:
    if full:
        activity = get_activity_from_fit(locations, data_file)
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

    for year in range(2013, datetime.datetime.now().year + 1):
        profile.years.append(
            YearsStatistics(
                year=year,
                statistics=[Statistic(sport=sport) for sport in ["running", "cycling"]],
            )
        )

    start = datetime.datetime(year=2013, month=1, day=7, tzinfo=datetime.timezone.utc)
    while start < datetime.datetime.now(datetime.timezone.utc):
        profile.weeks.append(
            WeeksStatistics(
                start=start,
                week=start.isocalendar().week,
                statistics=[Statistic(sport=sport) for sport in ["running", "cycling"]],
            )
        )
        start += datetime.timedelta(weeks=1)

    for activity in activities.activities:
        for yearStatistic in profile.years:
            if yearStatistic.year == activity.start_time.year:
                for stat in yearStatistic.statistics:
                    if stat.sport == activity.sport:
                        stat.n_activities += 1
                        stat.total_distance += activity.total_distance
        for weekStatistic in profile.weeks:
            if (
                activity.start_time >= weekStatistic.start
                and activity.start_time
                < weekStatistic.start + datetime.timedelta(weeks=1)
            ):
                for stat in weekStatistic.statistics:
                    if stat.sport == activity.sport:
                        stat.n_activities += 1
                        stat.total_distance += activity.total_distance

    profile.weeks = profile.weeks[-20:]

    profile.running_performances = [
        Performance(distance=distance)
        for distance in [1000, 1609.344, 5000, 10000, 21097.5, 42195]
    ]

    for activity in activities.activities:
        if not activity.sport == "running":
            continue

        for performance in activity.performances:
            for perf in profile.running_performances:
                if perf.distance == performance.distance and (
                    not perf.time
                    or not performance.time
                    or performance.time < perf.time
                ):
                    perf.time = performance.time
                    break

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

    locations = json.load(open("data/locations.json")).get("locations")

    activities = Activities(activities=[])

    data_files = []
    input_files = []
    for root, _, files in os.walk("data/files" if full else "legacy"):
        for data_file in files:
            data_files.append(os.path.join(root, data_file))

            if full and partial:
                if len(data_files) >= 20:
                    break
    for root, _, files in os.walk("./data/"):
        for yaml_file in files:
            if not yaml_file.endswith(".yaml"):
                continue
            input_files.append(os.path.join(root, yaml_file))

    with concurrent.futures.ProcessPoolExecutor(max_workers=NP_CPUS) as executor:
        future_activities = {
            executor.submit(
                get_activity_or_legacy, locations, data_file, full
            ): data_file
            for data_file in data_files
        }
        for future in concurrent.futures.as_completed(future_activities):
            data_file = future_activities[future]
            try:
                activity = future.result()
                activities.activities.append(activity)
            except Exception as e:
                print(f"Error processing {data_file}: {e}")

        future_activities = {
            executor.submit(get_activity_from_yaml, locations, input_file): input_file
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
