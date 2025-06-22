import unittest
import uuid

from api.model import ActivityPublic, ActivityPublicWithoutTracepoints


class TestActivityModel(unittest.TestCase):
    """Test cases for Activity model computed properties."""

    def setUp(self):
        """Set up common test data."""
        self.base_activity_data = {
            "id": uuid.uuid4(),
            "fit": "test.fit",
            "title": "Test Activity",
            "description": "Test description",
            "sport": "running",
            "device": "test device",
            "race": False,
            "start_time": 1640995200,
            "timestamp": 1640995200,
            "total_timer_time": 1800.0,
            "total_elapsed_time": 1800.0,
            "total_distance": 5000.0,
            "total_ascent": 50.0,
            "avg_speed": 2.78,
        }

    def test_location_property_all_fields(self):
        """Test location property with all fields set."""
        activity = ActivityPublic(
            **self.base_activity_data,
            city="Paris",
            subdivision="Île-de-France",
            country="France",
        )
        self.assertEqual(activity.location, "Paris, Île-de-France, France")

    def test_location_property_city_and_country(self):
        """Test location property with only city and country."""
        activity = ActivityPublic(
            **self.base_activity_data, city="London", subdivision=None, country="UK"
        )
        self.assertEqual(activity.location, "London, UK")

    def test_location_property_city_and_subdivision(self):
        """Test location property with only city and subdivision."""
        activity = ActivityPublic(
            **self.base_activity_data, city="Austin", subdivision="Texas", country=None
        )
        self.assertEqual(activity.location, "Austin, Texas")

    def test_location_property_only_city(self):
        """Test location property with only city."""
        activity = ActivityPublic(
            **self.base_activity_data, city="Barcelona", subdivision=None, country=None
        )
        self.assertEqual(activity.location, "Barcelona")

    def test_location_property_only_country(self):
        """Test location property with only country."""
        activity = ActivityPublic(
            **self.base_activity_data,
            city=None,
            subdivision=None,
            country="Switzerland",
        )
        self.assertEqual(activity.location, "Switzerland")

    def test_location_property_subdivision_and_country(self):
        """Test location property with only subdivision and country."""
        activity = ActivityPublic(
            **self.base_activity_data,
            city=None,
            subdivision="California",
            country="USA",
        )
        self.assertEqual(activity.location, "California, USA")

    def test_location_property_empty_all_fields(self):
        """Test location property with all fields empty."""
        activity = ActivityPublic(
            **self.base_activity_data, city=None, subdivision=None, country=None
        )
        self.assertIsNone(activity.location)

    def test_location_property_empty_strings(self):
        """Test location property with empty strings (should be treated as None)."""
        activity = ActivityPublic(
            **self.base_activity_data, city="", subdivision="", country=""
        )
        # Empty strings should not be included in the location
        self.assertIsNone(activity.location)

    def test_location_property_mixed_empty_and_valid(self):
        """Test location property with mix of empty strings and valid values."""
        activity = ActivityPublic(
            **self.base_activity_data, city="Madrid", subdivision="", country="Spain"
        )
        # Empty subdivision should be ignored
        self.assertEqual(activity.location, "Madrid, Spain")

    def test_location_property_whitespace_handling(self):
        """Test location property handles whitespace correctly."""
        activity = ActivityPublic(
            **self.base_activity_data,
            city=" Rome ",
            subdivision=None,
            country=" Italy ",
        )
        # Should preserve whitespace as-is (the computed field doesn't strip)
        self.assertEqual(activity.location, " Rome ,  Italy ")

    def test_activity_public_without_tracepoints_location(self):
        """Test location property works the same for ActivityPublicWithoutTracepoints."""
        activity = ActivityPublicWithoutTracepoints(
            **self.base_activity_data,
            city="Tokyo",
            subdivision="Tokyo",
            country="Japan",
        )
        self.assertEqual(activity.location, "Tokyo, Tokyo, Japan")

    def test_activity_public_without_tracepoints_empty_location(self):
        """Test location property returns None for ActivityPublicWithoutTracepoints when empty."""
        activity = ActivityPublicWithoutTracepoints(
            **self.base_activity_data, city=None, subdivision=None, country=None
        )
        self.assertIsNone(activity.location)


if __name__ == "__main__":
    unittest.main()
