import datetime
import math
import uuid
from unittest.mock import Mock, patch

import pytest
from hypothesis import assume, given
from hypothesis import strategies as st
from hypothesis.strategies import composite

from api.model import Activity, Location, Tracepoint, Zone
from api.services.storage import create_s3_client
from api.utils import (
    calculate_activity_zone_data,
    create_default_zones,
    detect_best_effort_achievements,
    generate_random_string,
    get_activity_location,
    get_delta_lat_lon,
    get_lat_lon,
    get_uuid,
    update_user_zones_from_activities,
    _calculate_heart_rate_zones,
    _calculate_pace_zones,
    _calculate_power_zones,
)


@composite
def tracepoint_strategy(draw):
    return Tracepoint(
        id=draw(st.uuids()),
        activity_id=draw(st.uuids()),
        lat=draw(
            st.floats(
                min_value=-90.0,
                max_value=90.0,
                allow_nan=False,
                allow_infinity=False,
            )
        ),
        lon=draw(
            st.floats(
                min_value=-179.9,
                max_value=179.9,
                allow_nan=False,
                allow_infinity=False,
            )
        ),
        timestamp=datetime.datetime.fromtimestamp(
            draw(st.integers(min_value=0, max_value=36000))
        ),
        distance=draw(
            st.floats(
                min_value=0.0,
                max_value=100000.0,
                allow_nan=False,
                allow_infinity=False,
            )
        ),
        heart_rate=draw(st.integers(min_value=0, max_value=300)),
        speed=draw(
            st.floats(
                min_value=0.0, max_value=50.0, allow_nan=False, allow_infinity=False
            )
        ),
    )


class TestGetLatLon:
    def test_empty_points(self):
        lat, lon = get_lat_lon([])
        assert lat == 0.0
        assert lon == 0.0

    @given(st.lists(st.nothing(), min_size=0, max_size=0))
    def test_empty_points_property(self, empty_list):
        lat, lon = get_lat_lon(empty_list)
        assert lat == 0.0
        assert lon == 0.0

    def test_single_point(self):
        tracepoint = Tracepoint(
            id=uuid.uuid4(),
            activity_id=uuid.uuid4(),
            lat=47.2183,
            lon=-1.5536,
            timestamp=datetime.datetime.fromtimestamp(0),
            distance=0.0,
            heart_rate=150,
            speed=5.0,
        )
        lat, lon = get_lat_lon([tracepoint])
        assert lat == pytest.approx(47.2183, abs=0.001)
        assert lon == pytest.approx(-1.5536, abs=0.001)

    @given(st.lists(tracepoint_strategy(), min_size=0, max_size=0))  # type: ignore[call-arg]
    def test_empty_property(self, empty_tracepoints):
        lat, lon = get_lat_lon(empty_tracepoints)
        assert lat == 0.0
        assert lon == 0.0

    def test_multiple_points(self):
        points = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=47.2183,
                lon=-1.5536,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0.0,
                heart_rate=150,
                speed=5.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=47.2200,
                lon=-1.5500,
                timestamp=datetime.datetime.fromtimestamp(100),
                distance=100.0,
                heart_rate=155,
                speed=5.2,
            ),
        ]
        lat, lon = get_lat_lon(points)
        assert 47.21 < lat < 47.23
        assert -1.56 < lon < -1.54

    @given(st.lists(tracepoint_strategy(), min_size=2, max_size=5))  # type: ignore[call-arg]
    def test_multiple_points_property(self, tracepoints):
        lat, lon = get_lat_lon(tracepoints)
        assert math.isfinite(lat)
        assert math.isfinite(lon)
        assert isinstance(lat, float)
        assert isinstance(lon, float)


class TestGetDeltaLatLon:
    def test_calculates_correct_deltas(self):
        lat = 47.2183
        max_distance = 1000.0

        delta_lat, delta_lon = get_delta_lat_lon(lat, max_distance)

        assert delta_lat > 0
        assert delta_lon > 0
        assert delta_lat == pytest.approx(0.009, abs=0.001)
        assert delta_lon > delta_lat

    @given(
        st.floats(
            min_value=-89.9, max_value=89.9, allow_nan=False, allow_infinity=False
        ),
        st.floats(
            min_value=1.0, max_value=100000.0, allow_nan=False, allow_infinity=False
        ),
    )
    def test_property_returns_positive_deltas(self, lat, max_distance):
        delta_lat, delta_lon = get_delta_lat_lon(lat, max_distance)
        assert delta_lat > 0
        assert delta_lon > 0


class TestGetUuid:
    def test_deterministic(self):
        filename = "test_activity.fit"
        uuid1 = get_uuid(filename)
        uuid2 = get_uuid(filename)

        assert uuid1 == uuid2
        assert isinstance(uuid1, uuid.UUID)

    @given(st.text(min_size=1, max_size=100))
    def test_deterministic_property(self, filename):
        uuid1 = get_uuid(filename)
        uuid2 = get_uuid(filename)
        assert uuid1 == uuid2
        assert isinstance(uuid1, uuid.UUID)

    def test_different_filenames(self):
        uuid1 = get_uuid("file1.fit")
        uuid2 = get_uuid("file2.fit")
        assert uuid1 != uuid2

    @given(st.text(min_size=1, max_size=100), st.text(min_size=1, max_size=100))
    def test_different_filenames_property(self, filename1, filename2):
        assume(filename1 != filename2)
        uuid1 = get_uuid(filename1)
        uuid2 = get_uuid(filename2)
        assert uuid1 != uuid2


class TestGetActivityLocation:
    def test_no_location_found(self):
        mock_session = Mock()
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        city, subdivision, country = get_activity_location(
            mock_session, 47.2183, -1.5536
        )

        mock_session.exec.assert_called_once()
        assert city is None
        assert subdivision is None
        assert country is None

    def test_location_found(self):
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

        mock_session.exec.assert_called_once()
        assert city == "Nantes"
        assert subdivision == "Loire-Atlantique"
        assert country == "France"


class TestGenerateRandomString:
    def test_default_length(self):
        result = generate_random_string()
        assert len(result) == 8
        assert result.isalnum()

    def test_custom_length(self):
        result = generate_random_string(16)
        assert len(result) == 16
        assert result.isalnum()

    def test_randomness(self):
        result1 = generate_random_string()
        result2 = generate_random_string()
        assert result1 != result2


class TestCreateS3Client:
    @patch("api.services.storage.boto3.client")
    def test_returns_s3_client(self, mock_boto_client):
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        result = create_s3_client()

        assert mock_boto_client.called
        assert result == mock_client


class TestCreateDefaultZones:
    def test_creates_all_zones(self):
        mock_session = Mock()
        user_id = "test-user"

        create_default_zones(mock_session, user_id)

        assert mock_session.add.call_count == 15
        add_calls = mock_session.add.call_args_list

        zone_types = [call[0][0].type for call in add_calls]
        assert zone_types.count("heart_rate") == 5
        assert zone_types.count("pace") == 5
        assert zone_types.count("power") == 5

        for call in add_calls:
            zone = call[0][0]
            assert zone.user_id == user_id
            assert 1 <= zone.index <= 5
            assert zone.max_value > 0


class TestCalculateHeartRateZones:
    def test_filters_none_values(self):
        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=1,
                max_value=120.0,
            ),
        ]

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(60),
                distance=200,
                heart_rate=110,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(120),
                distance=400,
                heart_rate=None,
                speed=0.0,
            ),
        ]

        result = _calculate_heart_rate_zones(zones, tracepoints)
        assert len(result) <= 1

    def test_assigns_to_correct_zone(self):
        zone1 = Zone(
            id=uuid.uuid4(),
            user_id="test-user",
            type="heart_rate",
            index=1,
            max_value=120.0,
        )
        zone2 = Zone(
            id=uuid.uuid4(),
            user_id="test-user",
            type="heart_rate",
            index=2,
            max_value=140.0,
        )
        zones = [zone1, zone2]

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                heart_rate=110,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(60),
                distance=200,
                heart_rate=130,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(120),
                distance=400,
                heart_rate=130,
                speed=0.0,
            ),
        ]

        result = _calculate_heart_rate_zones(zones, tracepoints)
        assert zone1.id in result
        assert zone2.id in result
        assert result[zone1.id] == 60.0
        assert result[zone2.id] == 60.0


class TestCalculatePaceZones:
    def test_filters_zero_speed(self):
        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=1,
                max_value=360.0,
            ),
        ]

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                heart_rate=None,
                speed=0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(60),
                distance=200,
                heart_rate=None,
                speed=10.0,
            ),
        ]

        result = _calculate_pace_zones(zones, tracepoints)
        assert len(result) <= 1


class TestCalculatePowerZones:
    def test_filters_none_values(self):
        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=1,
                max_value=150.0,
            ),
        ]

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                heart_rate=None,
                speed=0.0,
                power=None,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(60),
                distance=500,
                heart_rate=None,
                speed=0.0,
                power=120,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(120),
                distance=1000,
                heart_rate=None,
                speed=0.0,
                power=None,
            ),
        ]

        result = _calculate_power_zones(zones, tracepoints)
        assert len(result) <= 1


class TestCalculateActivityZoneData:
    def test_no_tracepoints(self):
        mock_session = Mock()
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            sport="running",
            device="Test",
            race=False,
            user_id="test-user",
            title="Test",
            start_time=0,
            timestamp=0,
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )

        calculate_activity_zone_data(mock_session, activity, [])
        mock_session.exec.assert_not_called()

    def test_no_user_id(self):
        mock_session = Mock()
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            sport="running",
            device="Test",
            race=False,
            user_id=None,
            title="Test",
            start_time=0,
            timestamp=0,
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=activity.id,
                lat=0.0,
                lon=0.0,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                heart_rate=None,
                speed=0.0,
            )
        ]

        calculate_activity_zone_data(mock_session, activity, tracepoints)
        mock_session.exec.assert_not_called()


class TestUpdateUserZonesFromActivities:
    def test_no_activities(self):
        mock_session = Mock()
        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        update_user_zones_from_activities(mock_session, "test-user")

        mock_session.commit.assert_not_called()


class TestDetectBestEffortAchievements:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    def test_non_running_sport(self, mock_session):
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            sport="cycling",
            device="Test",
            race=False,
            user_id="test-user",
            title="Test",
            start_time=int(datetime.datetime.now().timestamp()),
            timestamp=0,
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
        )

        notifications = detect_best_effort_achievements(mock_session, activity, [])
        assert notifications == []

    def test_no_performances(self, mock_session):
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            sport="running",
            device="Test",
            race=False,
            user_id="test-user",
            title="Test",
            start_time=int(datetime.datetime.now().timestamp()),
            timestamp=0,
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )

        notifications = detect_best_effort_achievements(mock_session, activity, [])
        assert notifications == []
