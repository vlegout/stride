import unittest
import uuid

from data import TracePoint
from utils import get_lat_lon, get_delta_lat_lon, get_uuid


class TestUtils(unittest.TestCase):
    def test_get_lat_lon(self):
        points = [
            TracePoint(lat=52.5200, lon=13.4050),
            TracePoint(lat=48.8566, lon=2.3522),
            TracePoint(lat=51.5074, lon=-0.1278),
        ]
        lat, lon = get_lat_lon(points)
        self.assertIsInstance(lat, float)
        self.assertIsInstance(lon, float)
        self.assertAlmostEqual(lat, 50.948, delta=0.001)
        self.assertAlmostEqual(lon, 5.205, delta=0.001)

        lat, lon = get_lat_lon([])
        self.assertEqual(lat, 0.0)
        self.assertEqual(lon, 0.0)

    def test_get_delta_lat_lon(self):
        lat = 52.5200
        max_distance = 1000
        delta_lat, delta_lon = get_delta_lat_lon(lat, max_distance)

        self.assertIsInstance(delta_lat, float)
        self.assertIsInstance(delta_lon, float)
        self.assertAlmostEqual(delta_lat, 0.00899, delta=0.00001)
        self.assertAlmostEqual(delta_lon, 0.01477, delta=0.00001)

    def test_get_uuid(self):
        filename = "example.txt"
        result = get_uuid(filename)
        self.assertIsInstance(result, uuid.UUID)
        self.assertEqual(result, uuid.UUID("23da80fe-4fcb-5ff3-900d-18c37543032d"))


if __name__ == "__main__":
    unittest.main()
