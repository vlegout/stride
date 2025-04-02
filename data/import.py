# /// script
# dependencies = [
#   "fitdecode",
#   "pydantic",
#   "pyyaml",
# ]
# ///


import json
import uuid

from typing import Optional

import fitdecode
import yaml

from pydantic import BaseModel


class Activity(BaseModel):
    fit: str
    sport: Optional[str] = ""


def run():
    with open("2025/04/01.yaml", "r") as file:
        config = yaml.safe_load(file)

    with fitdecode.FitReader("2025/04/" + config["fit"]) as fit:
        activity = Activity(fit=config["fit"])

        for frame in fit:
            if frame.frame_type == fitdecode.FIT_FRAME_DATA:
                    if frame.name == "sport":
                        for field in frame.fields:
                            if field.name == "sport":
                                activity.sport = field.value
        print(activity)

        with open("../src/data.json", "w") as file:
            json.dump(activity.model_dump(), file, indent=4)


if __name__ == "__main__":
    run()