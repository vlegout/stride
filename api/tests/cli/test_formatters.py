import datetime
import uuid
from unittest.mock import Mock

import pytest

from api.cli.formatters import ActivityFormatter
from api.model import Activity, Lap, Tracepoint, Performance, PerformancePower, Zone


class TestActivityFormatter:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    @pytest.fixture
    def formatter(self, mock_session):
        return ActivityFormatter(mock_session)

    @pytest.fixture
    def sample_activity(self):
        return Activity(
            id=uuid.uuid4(),
            user_id="test-user",
            sport="running",
            title="Morning Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            status="created",
            fit="test.fit",
            device="Garmin",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

    @pytest.fixture
    def sample_laps(self, sample_activity):
        return [
            Lap(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                index=i,
                start_time=int(datetime.datetime.now().timestamp()) + i * 300,
                total_elapsed_time=300.0,
                total_timer_time=295.0,
                total_distance=1000.0,
            )
            for i in range(5)
        ]

    @pytest.fixture
    def sample_tracepoints(self, sample_activity):
        return [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                lat=48.8566 + i * 0.001,
                lon=2.3522 + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=150 + i,
                speed=12.0,
            )
            for i in range(15)
        ]

    @pytest.fixture
    def sample_performances(self, sample_activity):
        return [
            Performance(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=4, seconds=30),
            ),
            Performance(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                distance=5000,
                time=datetime.timedelta(minutes=23, seconds=15),
            ),
        ]

    @pytest.fixture
    def sample_performance_powers(self, sample_activity):
        return [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                time=datetime.timedelta(seconds=5),
                power=350.0,
            ),
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                time=datetime.timedelta(minutes=20),
                power=250.0,
            ),
        ]

    def test_format_activity(self, formatter, sample_activity):
        result = formatter.format_activity(sample_activity)
        assert "Activity:" in result
        assert str(sample_activity) in result

    def test_format_laps_empty(self, formatter):
        result = formatter.format_laps([])
        assert result == "No laps found"

    def test_format_laps_with_data(self, formatter, sample_laps):
        result = formatter.format_laps(sample_laps)
        assert "Laps:" in result
        assert str(sample_laps[0]) in result

    def test_format_laps_with_limit(self, formatter, sample_laps):
        result = formatter.format_laps(sample_laps, limit=2)
        assert "Laps:" in result
        assert "... (3 more laps)" in result

    def test_format_laps_default_limit(self, formatter, sample_laps):
        many_laps = sample_laps + sample_laps + sample_laps  # 15 laps
        result = formatter.format_laps(many_laps)
        assert "... (5 more laps)" in result

    def test_format_tracepoints_empty(self, formatter):
        result = formatter.format_tracepoints([])
        assert result == "No tracepoints found"

    def test_format_tracepoints_with_data(self, formatter, sample_tracepoints):
        result = formatter.format_tracepoints(sample_tracepoints)
        assert "Tracepoints:" in result

    def test_format_tracepoints_with_limit(self, formatter, sample_tracepoints):
        result = formatter.format_tracepoints(sample_tracepoints, limit=3)
        assert "Tracepoints:" in result
        assert "... (12 more tracepoints)" in result

    def test_format_running_performances_empty(self, formatter):
        result = formatter.format_running_performances([])
        assert result == "No running performances found"

    def test_format_running_performances_with_data(
        self, formatter, sample_performances
    ):
        result = formatter.format_running_performances(sample_performances)
        assert "Running Performances:" in result
        assert "1000m:" in result
        assert "5000m:" in result

    def test_format_cycling_performances_empty(self, formatter):
        result = formatter.format_cycling_performances([])
        assert result == "No cycling power performances found"

    def test_format_cycling_performances_with_data(
        self, formatter, sample_performance_powers
    ):
        result = formatter.format_cycling_performances(sample_performance_powers)
        assert "Cycling Power Performances:" in result
        assert "350.0W" in result
        assert "250.0W" in result

    def test_format_zone_analysis_no_zones(
        self, formatter, mock_session, sample_activity, sample_tracepoints
    ):
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        result = formatter.format_zone_analysis(
            "test-user", sample_activity, sample_tracepoints
        )

        assert "Zone Analysis:" in result
        assert "No zones found for user" in result

    def test_format_zone_analysis_with_heart_rate_zones(
        self, formatter, mock_session, sample_activity, sample_tracepoints
    ):
        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=1,
                max_value=120.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=2,
                max_value=140.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=3,
                max_value=160.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=4,
                max_value=180.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=5,
                max_value=200.0,
            ),
        ]

        mock_result = Mock()
        mock_result.all.return_value = zones
        mock_session.exec.return_value = mock_result

        result = formatter.format_zone_analysis(
            "test-user", sample_activity, sample_tracepoints
        )

        assert "Zone Analysis:" in result
        assert "Time in zones:" in result
        assert "HR Zone" in result

    def test_format_zone_analysis_with_pace_zones_running(
        self, formatter, mock_session, sample_tracepoints
    ):
        running_activity = Activity(
            id=uuid.uuid4(),
            user_id="test-user",
            sport="running",
            title="Morning Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            status="created",
            fit="test.fit",
            device="Garmin",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=1,
                max_value=420.0,  # 7:00 min/km
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=2,
                max_value=360.0,  # 6:00 min/km
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=3,
                max_value=330.0,  # 5:30 min/km
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=4,
                max_value=300.0,  # 5:00 min/km
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="pace",
                index=5,
                max_value=270.0,  # 4:30 min/km
            ),
        ]

        mock_result = Mock()
        mock_result.all.return_value = zones
        mock_session.exec.return_value = mock_result

        result = formatter.format_zone_analysis(
            "test-user", running_activity, sample_tracepoints
        )

        assert "Zone Analysis:" in result
        assert "Pace Zone" in result

    def test_format_zone_analysis_with_power_zones_cycling(
        self, formatter, mock_session
    ):
        cycling_activity = Activity(
            id=uuid.uuid4(),
            user_id="test-user",
            sport="cycling",
            title="Morning Ride",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=30000,
            total_elapsed_time=3600,
            total_timer_time=3600,
            status="created",
            fit="test.fit",
            device="Garmin",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

        power_tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                lat=48.8566 + i * 0.001,
                lon=2.3522 + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=140,
                speed=30.0,
                power=200 + i * 10,
            )
            for i in range(10)
        ]

        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=1,
                max_value=150.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=2,
                max_value=200.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=3,
                max_value=250.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=4,
                max_value=300.0,
            ),
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="power",
                index=5,
                max_value=400.0,
            ),
        ]

        mock_result = Mock()
        mock_result.all.return_value = zones
        mock_session.exec.return_value = mock_result

        result = formatter.format_zone_analysis(
            "test-user", cycling_activity, power_tracepoints
        )

        assert "Zone Analysis:" in result
        assert "Power Zone" in result

    def test_format_zone_analysis_no_sensor_data(
        self, formatter, mock_session, sample_activity
    ):
        tracepoints_no_hr = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                lat=48.8566,
                lon=2.3522,
                timestamp=datetime.datetime.now(),
                distance=0,
                heart_rate=None,
                speed=12.0,
            )
        ]

        zones = [
            Zone(
                id=uuid.uuid4(),
                user_id="test-user",
                type="heart_rate",
                index=1,
                max_value=120.0,
            ),
        ]

        mock_result = Mock()
        mock_result.all.return_value = zones
        mock_session.exec.return_value = mock_result

        result = formatter.format_zone_analysis(
            "test-user", sample_activity, tracepoints_no_hr
        )

        assert "No zone data calculated" in result
