import datetime
import math
import unittest
import uuid

from api.model import Activity, Performance, Tracepoint
from api.utils import (
    get_lat_lon,
    get_delta_lat_lon,
    get_distance,
    get_uuid,
    get_best_performances,
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
            speed=5.0
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
                speed=5.0
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=47.2200,
                lon=-1.5500,
                timestamp=datetime.datetime.now(),
                distance=100.0,
                heart_rate=155,
                speed=5.2
            )
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

    def test_get_distance_same_point(self):
        """Test get_distance with same coordinates returns 0"""
        lat, lon = 47.2183, -1.5536
        distance = get_distance(lat, lon, lat, lon)
        self.assertAlmostEqual(distance, 0.0, places=1)

    def test_get_distance_known_points(self):
        """Test get_distance with known coordinates"""
        # Approximately 1km apart
        lat1, lon1 = 47.2183, -1.5536
        lat2, lon2 = 47.2273, -1.5536  # About 1km north
        
        distance = get_distance(lat1, lon1, lat2, lon2)
        
        # Should be approximately 1000 meters
        self.assertAlmostEqual(distance, 1000, delta=50)

    def test_get_distance_symmetry(self):
        """Test get_distance is symmetric"""
        lat1, lon1 = 47.2183, -1.5536
        lat2, lon2 = 47.2273, -1.5636
        
        distance1 = get_distance(lat1, lon1, lat2, lon2)
        distance2 = get_distance(lat2, lon2, lat1, lon1)
        
        self.assertAlmostEqual(distance1, distance2, places=5)

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
            avg_speed=2.78
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
            avg_speed=8.33
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
                speed=5.0
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
            avg_speed=5.56
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
                    timestamp=base_time + datetime.timedelta(seconds=i * 300),  # 5 min per km
                    distance=distance,
                    heart_rate=150 + i,
                    speed=5.0
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
            avg_speed=1.67
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
                speed=1.67
            )
        ]
        
        performances = get_best_performances(activity, tracepoints)
        # Should be empty since activity is shorter than 1km
        self.assertEqual(performances, [])


if __name__ == "__main__":
    unittest.main()