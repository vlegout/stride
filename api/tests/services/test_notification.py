import datetime
import uuid
from unittest.mock import Mock

import pytest

from api.model import Activity, Performance, PerformancePower
from api.services.notification import NotificationService


class TestNotificationService:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    @pytest.fixture
    def service(self, mock_session):
        return NotificationService(mock_session)

    @pytest.fixture
    def running_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="running",
            user_id="test-user",
            title="Test Run",
            start_time=int(datetime.datetime(2024, 6, 15).timestamp()),
            total_distance=10000,
            total_elapsed_time=3000,
            total_timer_time=3000,
        )

    @pytest.fixture
    def cycling_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="cycling",
            user_id="test-user",
            title="Test Ride",
            start_time=int(datetime.datetime(2024, 6, 15).timestamp()),
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
        )

    def test_detect_achievements_non_running_sport(
        self, service, cycling_activity, mock_session
    ):
        performances = []
        notifications = service.detect_achievements(cycling_activity, performances)

        assert notifications == []
        mock_session.exec.assert_not_called()

    def test_detect_achievements_no_performances(
        self, service, running_activity, mock_session
    ):
        performances = []
        notifications = service.detect_achievements(running_activity, performances)

        assert notifications == []
        mock_session.exec.assert_not_called()

    def test_detect_achievements_first_time_all_distances(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=4),
            ),
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=5000,
                time=datetime.timedelta(minutes=22),
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 2
        assert all(n.type == "best_effort_all_time" for n in notifications)
        assert all(n.activity_id == running_activity.id for n in notifications)
        assert {n.distance for n in notifications} == {1000, 5000}

    def test_detect_achievements_new_all_time_best(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=3, seconds=30),
            ),
        ]

        mock_historical_perf = Mock()
        mock_historical_perf.time = datetime.timedelta(minutes=4)
        mock_historical_perf.distance = 1000

        historical_timestamp = int(datetime.datetime(2023, 6, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [(mock_historical_perf, historical_timestamp)]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 1
        assert notifications[0].type == "best_effort_all_time"
        assert notifications[0].distance == 1000
        assert notifications[0].achievement_year is None

    def test_detect_achievements_new_yearly_best(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=3, seconds=45),
            ),
        ]

        mock_historical_perf = Mock()
        mock_historical_perf.time = datetime.timedelta(minutes=3, seconds=30)
        mock_historical_perf.distance = 1000

        historical_timestamp = int(datetime.datetime(2023, 6, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [(mock_historical_perf, historical_timestamp)]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 1
        assert notifications[0].type == "best_effort_yearly"
        assert notifications[0].distance == 1000
        assert notifications[0].achievement_year == 2024

    def test_detect_achievements_no_improvement(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=4, seconds=30),
            ),
        ]

        mock_historical_perf_same_year = Mock()
        mock_historical_perf_same_year.time = datetime.timedelta(minutes=3, seconds=30)
        mock_historical_perf_same_year.distance = 1000

        current_year_timestamp = int(datetime.datetime(2024, 3, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [
            (mock_historical_perf_same_year, current_year_timestamp)
        ]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 0

    def test_detect_achievements_multiple_distances(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=datetime.timedelta(minutes=3, seconds=30),
            ),
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=5000,
                time=datetime.timedelta(minutes=19),
            ),
        ]

        mock_1km_perf = Mock()
        mock_1km_perf.time = datetime.timedelta(minutes=4)
        mock_1km_perf.distance = 1000

        mock_5km_perf = Mock()
        mock_5km_perf.time = datetime.timedelta(minutes=21)
        mock_5km_perf.distance = 5000

        historical_timestamp = int(datetime.datetime(2023, 6, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [
            (mock_1km_perf, historical_timestamp),
            (mock_5km_perf, historical_timestamp),
        ]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 2
        assert all(n.type == "best_effort_all_time" for n in notifications)
        assert {n.distance for n in notifications} == {1000, 5000}

    def test_detect_achievements_filters_none_times(
        self, service, running_activity, mock_session
    ):
        performances = [
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=1000,
                time=None,
            ),
            Performance(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                distance=5000,
                time=datetime.timedelta(minutes=22),
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_achievements(running_activity, performances)

        assert len(notifications) == 1
        assert notifications[0].distance == 5000

    def test_detect_power_achievements_non_cycling_sport(
        self, service, running_activity, mock_session
    ):
        performance_powers = []
        notifications = service.detect_power_achievements(
            running_activity, performance_powers
        )

        assert notifications == []
        mock_session.exec.assert_not_called()

    def test_detect_power_achievements_no_performances(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = []
        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert notifications == []
        mock_session.exec.assert_not_called()

    def test_detect_power_achievements_first_time(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=5),
                power=800.0,
            ),
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=60),
                power=450.0,
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert len(notifications) == 2
        assert all(n.type == "best_effort_all_time" for n in notifications)
        assert all(n.activity_id == cycling_activity.id for n in notifications)
        assert {n.duration for n in notifications} == {
            datetime.timedelta(seconds=5),
            datetime.timedelta(seconds=60),
        }

    def test_detect_power_achievements_new_all_time_best(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=300),
                power=400.0,
            ),
        ]

        mock_historical_perf = Mock()
        mock_historical_perf.power = 350.0
        mock_historical_perf.time = datetime.timedelta(seconds=300)

        historical_timestamp = int(datetime.datetime(2023, 6, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [(mock_historical_perf, historical_timestamp)]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert len(notifications) == 1
        assert notifications[0].type == "best_effort_all_time"
        assert notifications[0].duration == datetime.timedelta(seconds=300)
        assert notifications[0].achievement_year is None

    def test_detect_power_achievements_new_yearly_best(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=300),
                power=380.0,
            ),
        ]

        mock_historical_perf = Mock()
        mock_historical_perf.power = 400.0
        mock_historical_perf.time = datetime.timedelta(seconds=300)

        historical_timestamp = int(datetime.datetime(2023, 6, 15).timestamp())

        mock_exec = Mock()
        mock_exec.all.return_value = [(mock_historical_perf, historical_timestamp)]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert len(notifications) == 1
        assert notifications[0].type == "best_effort_yearly"
        assert notifications[0].duration == datetime.timedelta(seconds=300)
        assert notifications[0].achievement_year == 2024

    def test_detect_power_achievements_no_improvement(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=300),
                power=350.0,
            ),
        ]

        mock_historical_perf_1 = Mock()
        mock_historical_perf_1.power = 400.0
        mock_historical_perf_1.time = datetime.timedelta(seconds=300)

        mock_historical_perf_2 = Mock()
        mock_historical_perf_2.power = 360.0
        mock_historical_perf_2.time = datetime.timedelta(seconds=300)

        historical_timestamp_old = int(datetime.datetime(2023, 6, 15).timestamp())
        historical_timestamp_current_year = int(
            datetime.datetime(2024, 3, 15).timestamp()
        )

        mock_exec = Mock()
        mock_exec.all.return_value = [
            (mock_historical_perf_1, historical_timestamp_old),
            (mock_historical_perf_2, historical_timestamp_current_year),
        ]
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert len(notifications) == 0

    def test_detect_power_achievements_filters_zero_power(
        self, service, cycling_activity, mock_session
    ):
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=300),
                power=0.0,
            ),
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                time=datetime.timedelta(seconds=1200),
                power=320.0,
            ),
        ]

        mock_exec = Mock()
        mock_exec.all.return_value = []
        mock_session.exec.return_value = mock_exec

        notifications = service.detect_power_achievements(
            cycling_activity, performance_powers
        )

        assert len(notifications) == 1
        assert notifications[0].duration == datetime.timedelta(seconds=1200)
