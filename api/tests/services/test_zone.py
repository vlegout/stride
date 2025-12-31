import datetime
import uuid
from unittest.mock import Mock

import pytest

from api.model import Activity, Tracepoint, Zone
from api.services.zone import ZoneService


class TestZoneService:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    @pytest.fixture
    def service(self, mock_session):
        return ZoneService(mock_session)

    @pytest.fixture
    def running_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="running",
            user_id="test-user",
            title="Test Run",
            start_time=0,
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )

    @pytest.fixture
    def cycling_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="cycling",
            user_id="test-user",
            title="Test Ride",
            start_time=0,
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
        )

    def test_calculate_activity_zones_no_tracepoints(
        self, service, running_activity, mock_session
    ):
        service.calculate_activity_zones(running_activity, [])
        mock_session.exec.assert_not_called()

    def test_calculate_activity_zones_no_user_id(self, service, mock_session):
        activity = Activity(
            id=uuid.uuid4(),
            sport="running",
            user_id=None,
            title="Test Run",
            start_time=0,
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=activity.id,
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
            )
        ]

        service.calculate_activity_zones(activity, tracepoints)
        mock_session.exec.assert_not_called()

    def test_calculate_activity_zones_no_zones_for_user(
        self, service, running_activity, mock_session
    ):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
            )
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        service.calculate_activity_zones(running_activity, tracepoints)

        mock_session.add.assert_not_called()

    def test_calculate_activity_zones_heart_rate(
        self, service, running_activity, mock_session
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
        ]

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                heart_rate=110,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=60),
                distance=200,
                heart_rate=130,
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = zones
        mock_session.exec.return_value = mock_exec

        service.calculate_activity_zones(running_activity, tracepoints)

        assert mock_session.add.call_count > 0

    def test_calculate_activity_zones_pace(
        self, service, running_activity, mock_session
    ):
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
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                speed=10.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=60),
                distance=200,
                speed=12.0,
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = zones
        mock_session.exec.return_value = mock_exec

        service.calculate_activity_zones(running_activity, tracepoints)

        assert mock_session.add.call_count > 0

    def test_calculate_activity_zones_power(
        self, service, cycling_activity, mock_session
    ):
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
                activity_id=cycling_activity.id,
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                power=120.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.timedelta(seconds=60),
                distance=500,
                power=140.0,
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = zones
        mock_session.exec.return_value = mock_exec

        service.calculate_activity_zones(cycling_activity, tracepoints)

        assert mock_session.add.call_count > 0

    def test_update_user_zones_no_activities(self, service, mock_session):
        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        service.update_user_zones("test-user")

        mock_session.commit.assert_not_called()

    def test_update_user_zones_updates_heart_rate(self, service, mock_session):
        activities = [
            Activity(
                id=uuid.uuid4(),
                sport="running",
                user_id="test-user",
                title="Run 1",
                start_time=int(datetime.datetime.now().timestamp()),
                total_distance=5000,
                total_elapsed_time=1800,
                total_timer_time=1800,
                max_heart_rate=180,
                avg_speed=10.0,
            ),
            Activity(
                id=uuid.uuid4(),
                sport="running",
                user_id="test-user",
                title="Run 2",
                start_time=int(datetime.datetime.now().timestamp()),
                total_distance=5000,
                total_elapsed_time=1800,
                total_timer_time=1800,
                max_heart_rate=185,
                avg_speed=10.5,
            ),
        ]

        hr_zone = Zone(
            id=uuid.uuid4(),
            user_id="test-user",
            type="heart_rate",
            index=1,
            max_value=100.0,
        )

        mock_exec_activities = Mock()
        mock_exec_activities.all.return_value = activities

        mock_exec_zone = Mock()
        mock_exec_zone.first.return_value = hr_zone

        mock_session.exec.side_effect = [mock_exec_activities] + [mock_exec_zone] * 20

        service.update_user_zones("test-user")

        mock_session.add.assert_called()

    def test_update_user_zones_updates_pace(self, service, mock_session):
        activities = [
            Activity(
                id=uuid.uuid4(),
                sport="running",
                user_id="test-user",
                title="Run 1",
                start_time=int(datetime.datetime.now().timestamp()),
                total_distance=10000,
                total_elapsed_time=3000,
                total_timer_time=3000,
                avg_speed=12.0,
            ),
        ]

        pace_zone = Zone(
            id=uuid.uuid4(),
            user_id="test-user",
            type="pace",
            index=1,
            max_value=360.0,
        )

        mock_exec_activities = Mock()
        mock_exec_activities.all.return_value = activities

        mock_exec_zone = Mock()
        mock_exec_zone.first.return_value = pace_zone

        mock_session.exec.side_effect = [mock_exec_activities] + [mock_exec_zone] * 10

        service.update_user_zones("test-user")

        mock_session.add.assert_called()

    def test_update_user_zones_updates_power(self, service, mock_session):
        activities = [
            Activity(
                id=uuid.uuid4(),
                sport="cycling",
                user_id="test-user",
                title="Ride 1",
                start_time=int(datetime.datetime.now().timestamp()),
                total_distance=30000,
                total_elapsed_time=3600,
                total_timer_time=3600,
                max_power=300.0,
            ),
        ]

        power_zone = Zone(
            id=uuid.uuid4(),
            user_id="test-user",
            type="power",
            index=1,
            max_value=150.0,
        )

        mock_exec_activities = Mock()
        mock_exec_activities.all.return_value = activities

        mock_exec_zone = Mock()
        mock_exec_zone.first.return_value = power_zone

        mock_session.exec.side_effect = [mock_exec_activities] + [mock_exec_zone] * 5

        service.update_user_zones("test-user")

        mock_session.add.assert_called()

    def test_create_default_zones(self, service, mock_session):
        service.create_default_zones("test-user")

        assert mock_session.add.call_count == 15
        add_calls = mock_session.add.call_args_list

        zone_types = [call[0][0].type for call in add_calls]
        assert zone_types.count("heart_rate") == 5
        assert zone_types.count("pace") == 5
        assert zone_types.count("power") == 5

    def test_calculate_heart_rate_zones_filters_none_values(
        self, service, mock_session
    ):
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
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                heart_rate=None,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                timestamp=datetime.timedelta(seconds=60),
                distance=200,
                heart_rate=110,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                timestamp=datetime.timedelta(seconds=120),
                distance=400,
                heart_rate=None,
            ),
        ]

        result = service._calculate_heart_rate_zones(zones, tracepoints)

        assert len(result) <= 1

    def test_calculate_pace_zones_filters_zero_speed(self, service, mock_session):
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
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                speed=0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                timestamp=datetime.timedelta(seconds=60),
                distance=200,
                speed=10.0,
            ),
        ]

        result = service._calculate_pace_zones(zones, tracepoints)

        assert len(result) <= 1

    def test_calculate_power_zones_filters_none_values(self, service, mock_session):
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
                timestamp=datetime.timedelta(seconds=0),
                distance=0,
                power=None,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                timestamp=datetime.timedelta(seconds=60),
                distance=500,
                power=120.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                timestamp=datetime.timedelta(seconds=120),
                distance=1000,
                power=None,
            ),
        ]

        result = service._calculate_power_zones(zones, tracepoints)

        assert len(result) <= 1
