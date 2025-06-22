import json
import os
import unittest
import uuid
from unittest.mock import Mock

from api.cli import get_data
from api.model import Location


class TestFit(unittest.TestCase):
    def test_fit(self):
        # Create mock session
        mock_session = Mock()

        # Create mock location
        mock_location = Location(
            id=uuid.uuid4(),
            lat=47.21133481711149,
            lon=-1.541355550289154,
            city="Nantes",
            subdivision=None,
            country="France",
        )

        # Mock the session.exec().first() call
        mock_session.exec.return_value.first.return_value = mock_location

        test_dir = os.path.dirname(os.path.abspath(__file__))

        for sport in ["run", "ride"]:
            fit_path = os.path.join(test_dir, "data", f"{sport}.fit")
            json_path = os.path.join(test_dir, "data", f"{sport}.json")

            activity, _, _, _ = get_data(
                mock_session,
                fit_path,
            )

            with open(json_path, "r") as f:
                data = json.load(f)

            self.maxDiff = None
            self.assertEqual(activity.model_dump(mode="json"), data)


if __name__ == "__main__":
    unittest.main()
