import glob
import json
import os
import unittest
import uuid
from unittest.mock import Mock

from api.model import Location
from api.services.fit_file import FitFileService


class TestFit(unittest.TestCase):
    def test_fit(self):
        mock_session = Mock()

        mock_location = Location(
            id=uuid.uuid4(),
            lat=47.21133481711149,
            lon=-1.541355550289154,
            city="Nantes",
            subdivision=None,
            country="France",
        )

        mock_session.exec.return_value.first.return_value = mock_location

        test_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(test_dir, "data")

        fit_files = glob.glob(os.path.join(data_dir, "*.fit"))

        for fit_path in fit_files:
            json_path = os.path.splitext(fit_path)[0] + ".json"

            fit_service = FitFileService(mock_session)
            activity, _, _ = fit_service.read_fit_file(fit_path)

            with open(json_path, "r") as f:
                data = json.load(f)

            self.maxDiff = None
            activity_data = activity.model_dump(mode="json")
            activity_data.pop("created_at", None)
            activity_data.pop("updated_at", None)
            self.assertEqual(activity_data, data)


if __name__ == "__main__":
    unittest.main()
