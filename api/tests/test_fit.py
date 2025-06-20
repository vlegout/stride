import json
import os

import pytest

from api.cli import get_data


@pytest.mark.asyncio
async def test_fit():
    locations = [
        {
            "lat": 47.21133481711149,
            "lon": -1.541355550289154,
            "location": "Nantes, France",
        },
    ]

    test_dir = os.path.dirname(os.path.abspath(__file__))

    for sport in ["run", "ride"]:
        fit_path = os.path.join(test_dir, "data", f"{sport}.fit")
        json_path = os.path.join(test_dir, "data", f"{sport}.json")

        activity, _, _, _ = await get_data(
            locations,
            fit_path,
        )

        with open(json_path, "r") as f:
            data = json.load(f)

        assert activity.model_dump(mode="json") == data
