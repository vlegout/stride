# /// script
# dependencies = [
#   "fitdecode",
#   "pydantic",
#   "pyyaml",
# ]
# ///


import datetime
import json
import os
import uuid

from typing import Optional

import fitdecode
import yaml

from pydantic import BaseModel


class Activity(BaseModel):
    fit: str
    sport: str = None
    start_time: datetime.datetime = None
    total_distance: float = 0.0

class Activities(BaseModel):
    activities: list[Activity]


def run():
    activities = Activities(activities=[])

    yaml_files = []
    for root, _, files in os.walk("."):
        for file in files:
            if file.endswith(".yaml"):
                yaml_files.append(os.path.join(root, file))

    for yaml_file in yaml_files:
        with open(yaml_file, "r") as file:
            config = yaml.safe_load(file)
   
        with fitdecode.FitReader(config["fit"]) as fit:
            activities.activities.append(Activity(fit=config["fit"]))

            for frame in fit:
                if frame.frame_type == fitdecode.FIT_FRAME_DATA and frame.name == "session":
                    for field in frame.fields:
                        if field.name == "sport":
                            activities.activities[0].sport = field.value
                        if field.name == "start_time":
                            activities.activities[0].start_time = field.value
                        if field.name == "total_distance":
                            activities.activities[0].total_distance = field.value

    with open("../public/data.json", "w") as file:
        json.dump(activities.model_dump(), file, default=str)


if __name__ == "__main__":
    run()