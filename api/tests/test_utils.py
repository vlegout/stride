import datetime
import unittest
import uuid
from unittest.mock import Mock

from api.model import Activity, Location, Tracepoint
from api.utils import (
    get_lat_lon,
    get_delta_lat_lon,
    get_uuid,
    get_best_performances,
    get_activity_location,
)


class TestUtils(unittest.TestCase):
    def test_get_lat_lon_empty_points(self):
        """Test get_lat_lon with empty list returns (0.0, 0.0)"""
        lat, lon = get_lat_lon([])
        self.assertEqual(lat, 0.0)
        self.assertEqual(lon, 0.0)

    def test_get_lat_lon_single_point(self):
        """Test get_lat_lon with single point returns that point's coordinates"""
        tracepoint = Tracepoint(
            id=uuid.uuid4(),
            activity_id=uuid.uuid4(),
            lat=47.2183,
            lon=-1.5536,
            timestamp=datetime.datetime.now(),
            distance=0.0,
            heart_rate=150,
            speed=5.0,
        )
        lat, lon = get_lat_lon([tracepoint])
        # Should be approximately the same coordinates (with some floating point precision)
        self.assertAlmostEqual(lat, 47.2183, places=3)
        self.assertAlmostEqual(lon, -1.5536, places=3)

    def test_get_lat_lon_multiple_points(self):
        """Test get_lat_lon with multiple points returns center coordinates"""
        points = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=47.2183,
                lon=-1.5536,
                timestamp=datetime.datetime.now(),
                distance=0.0,
                heart_rate=150,
                speed=5.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=47.2200,
                lon=-1.5500,
                timestamp=datetime.datetime.now(),
                distance=100.0,
                heart_rate=155,
                speed=5.2,
            ),
        ]
        lat, lon = get_lat_lon(points)
        # Should be somewhere between the two points
        self.assertTrue(47.21 < lat < 47.23)
        self.assertTrue(-1.56 < lon < -1.54)

    def test_get_delta_lat_lon(self):
        """Test get_delta_lat_lon calculates correct deltas"""
        lat = 47.2183
        max_distance = 1000.0  # 1km

        delta_lat, delta_lon = get_delta_lat_lon(lat, max_distance)

        # Should be positive values
        self.assertGreater(delta_lat, 0)
        self.assertGreater(delta_lon, 0)

        # Delta lat should be approximately 0.009 degrees for 1km
        self.assertAlmostEqual(delta_lat, 0.009, places=3)

        # Delta lon should be slightly larger due to latitude adjustment
        self.assertGreater(delta_lon, delta_lat)

    def test_get_uuid_deterministic(self):
        """Test get_uuid generates same UUID for same filename"""
        filename = "test_activity.fit"
        uuid1 = get_uuid(filename)
        uuid2 = get_uuid(filename)

        self.assertEqual(uuid1, uuid2)
        self.assertIsInstance(uuid1, uuid.UUID)

    def test_get_uuid_different_filenames(self):
        """Test get_uuid generates different UUIDs for different filenames"""
        uuid1 = get_uuid("file1.fit")
        uuid2 = get_uuid("file2.fit")

        self.assertNotEqual(uuid1, uuid2)

    def test_get_best_performances_empty_tracepoints(self):
        """Test get_best_performances with empty tracepoints returns empty list"""
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            title="Test Run",
            description="Test",
            sport="running",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,
            total_elapsed_time=1800.0,
            total_distance=5000.0,
            total_ascent=50.0,
            avg_speed=2.78,
            user_id=None,
        )

        performances = get_best_performances(activity, [])
        self.assertEqual(performances, [])

    def test_get_best_performances_non_running_activity(self):
        """Test get_best_performances with non-running sport returns empty list"""
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            title="Test Bike",
            description="Test",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,
            total_elapsed_time=1800.0,
            total_distance=15000.0,
            total_ascent=100.0,
            avg_speed=8.33,
            user_id="test-user-id",
        )

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=activity.id,
                lat=47.2183,
                lon=-1.5536,
                timestamp=datetime.datetime.now(),
                distance=5000.0,
                heart_rate=150,
                speed=5.0,
            )
        ]

        performances = get_best_performances(activity, tracepoints)
        self.assertEqual(performances, [])

    def test_get_best_performances_running_activity(self):
        """Test get_best_performances with running activity creates performances"""
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            title="Test Run",
            description="Test",
            sport="running",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,
            total_elapsed_time=1800.0,
            total_distance=10000.0,
            total_ascent=50.0,
            avg_speed=5.56,
            user_id="test-user-id",
        )

        # Create tracepoints for a 10km run
        base_time = datetime.datetime.now()
        tracepoints = []
        for i in range(10):
            distance = i * 1000 + 1000  # 1km, 2km, ..., 10km
            tracepoints.append(
                Tracepoint(
                    id=uuid.uuid4(),
                    activity_id=activity.id,
                    lat=47.2183 + i * 0.001,
                    lon=-1.5536 + i * 0.001,
                    timestamp=base_time
                    + datetime.timedelta(seconds=i * 300),  # 5 min per km
                    distance=distance,
                    heart_rate=150 + i,
                    speed=5.0,
                )
            )

        performances = get_best_performances(activity, tracepoints)

        # Should have performances for 1km, mile, 5km, and 10km
        self.assertGreater(len(performances), 0)

        # Check that all performances have the correct activity_id
        for perf in performances:
            self.assertEqual(perf.activity_id, activity.id)
            self.assertIsNotNone(perf.distance)
            self.assertIsInstance(perf.time, datetime.timedelta)

    def test_get_best_performances_short_activity(self):
        """Test get_best_performances with activity shorter than minimum distance"""
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            title="Short Run",
            description="Test",
            sport="running",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=300.0,
            total_elapsed_time=300.0,
            total_distance=500.0,
            total_ascent=10.0,
            avg_speed=1.67,
            user_id="test-user-id",
        )

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=activity.id,
                lat=47.2183,
                lon=-1.5536,
                timestamp=datetime.datetime.now(),
                distance=500.0,
                heart_rate=150,
                speed=1.67,
            )
        ]

        performances = get_best_performances(activity, tracepoints)
        # Should be empty since activity is shorter than 1km
        self.assertEqual(performances, [])

    def test_get_activity_location_no_location_found(self):
        """Test get_activity_location when no location is found in database"""
        mock_session = Mock()
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        city, subdivision, country = get_activity_location(
            mock_session, 47.2183, -1.5536
        )

        # Session should be called
        mock_session.exec.assert_called_once()

        # Should return None values
        self.assertIsNone(city)
        self.assertIsNone(subdivision)
        self.assertIsNone(country)

    def test_get_activity_location_location_found(self):
        """Test get_activity_location when location is found in database"""
        location = Location(
            id=uuid.uuid4(),
            lat=47.2180,
            lon=-1.5540,
            city="Nantes",
            subdivision="Loire-Atlantique",
            country="France",
        )

        mock_session = Mock()
        mock_result = Mock()
        mock_result.first.return_value = location
        mock_session.exec.return_value = mock_result

        city, subdivision, country = get_activity_location(
            mock_session, 47.2183, -1.5536
        )

        # Session should be called
        mock_session.exec.assert_called_once()

        # Should return location data
        self.assertEqual(city, "Nantes")
        self.assertEqual(subdivision, "Loire-Atlantique")
        self.assertEqual(country, "France")


if __name__ == "__main__":
    unittest.main()
