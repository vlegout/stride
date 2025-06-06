import json
import unittest

from api.cli import get_data


class TestFit(unittest.TestCase):
    def test_run(self):
        locations = [
            {
                "lat": 47.21133481711149,
                "lon": -1.541355550289154,
                "location": "Nantes, France",
            },
        ]

        activity, _, _, _ = get_data(
            locations,
            "./tests/data/run.fit",
        )

        with open("./tests/data/run.json", "r") as f:
            data = json.load(f)

        self.maxDiff = None
        self.assertEqual(activity.model_dump(mode="json"), data)


if __name__ == "__main__":
    unittest.main()
