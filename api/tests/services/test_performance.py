import datetime
import uuid

import pytest

from api.model import Activity, Tracepoint
from api.services.performance import PerformanceService


class TestPerformanceService:
    @pytest.fixture
    def service(self):
        return PerformanceService()

    @pytest.fixture
    def running_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="running",
            user_id="test-user",
            title="Test Run",
            fit="test.fit",
            device="Test",
            race=False,
            timestamp=0,
            start_time=0,
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
            fit="test.fit",
            device="Test",
            race=False,
            timestamp=0,
            start_time=0,
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
        )

    def test_calculate_running_performances_empty_tracepoints(
        self, service, running_activity
    ):
        performances = service.calculate_running_performances(running_activity, [])
        assert performances == []

    def test_calculate_running_performances_non_running_sport(
        self, service, cycling_activity
    ):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            )
        ]
        performances = service.calculate_running_performances(
            cycling_activity, tracepoints
        )
        assert performances == []

    def test_calculate_running_performances_short_run(self, service, running_activity):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(300),
                distance=500,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
        ]
        performances = service.calculate_running_performances(
            running_activity, tracepoints
        )
        assert performances == []

    def test_calculate_running_performances_1km_run(self, service, running_activity):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(240),
                distance=1000,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
        ]
        performances = service.calculate_running_performances(
            running_activity, tracepoints
        )

        assert len(performances) == 1
        assert performances[0].distance == 1000
        assert performances[0].time == datetime.timedelta(seconds=240)
        assert performances[0].activity_id == running_activity.id

    def test_calculate_running_performances_5km_run(self, service, running_activity):
        start_time = datetime.datetime.fromtimestamp(0)
        tracepoints = []
        for i in range(51):
            tracepoints.append(
                Tracepoint(
                    id=uuid.uuid4(),
                    activity_id=running_activity.id,
                    timestamp=start_time + datetime.timedelta(seconds=i * 20),
                    distance=i * 100,
                    lat=0.0,
                    lon=0.0,
                    heart_rate=None,
                    speed=0.0,
                )
            )

        performances = service.calculate_running_performances(
            running_activity, tracepoints
        )

        distances_found = [p.distance for p in performances]
        assert 1000 in distances_found
        assert 1609.344 in distances_found
        assert 5000 in distances_found

    def test_calculate_cycling_performances_empty_tracepoints(
        self, service, cycling_activity
    ):
        performances = service.calculate_cycling_performances(cycling_activity, [])
        assert performances == []

    def test_calculate_cycling_performances_non_cycling_sport(
        self, service, running_activity
    ):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            )
        ]
        performances = service.calculate_cycling_performances(
            running_activity, tracepoints
        )
        assert performances == []

    def test_calculate_cycling_performances_no_power_data(
        self, service, cycling_activity
    ):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                power=None,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.datetime.fromtimestamp(300),
                distance=5000,
                power=None,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
        ]
        performances = service.calculate_cycling_performances(
            cycling_activity, tracepoints
        )

        for perf in performances:
            assert perf.power == 0.0

    def test_calculate_cycling_performances_with_power_data(
        self, service, cycling_activity
    ):
        tracepoints = []
        for i in range(121):
            tracepoints.append(
                Tracepoint(
                    id=uuid.uuid4(),
                    activity_id=cycling_activity.id,
                    timestamp=datetime.datetime.fromtimestamp(i),
                    distance=i * 10,
                    power=200 + i,
                    lat=0.0,
                    lon=0.0,
                    heart_rate=None,
                    speed=0.0,
                )
            )

        performances = service.calculate_cycling_performances(
            cycling_activity, tracepoints
        )

        assert len(performances) > 0
        one_second_perf = next(
            (p for p in performances if p.time.total_seconds() == 1), None
        )
        assert one_second_perf is not None
        assert one_second_perf.power > 0

    def test_calculate_cycling_performances_short_ride(self, service, cycling_activity):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                power=250,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                timestamp=datetime.datetime.fromtimestamp(30),
                distance=500,
                power=260,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
        ]
        performances = service.calculate_cycling_performances(
            cycling_activity, tracepoints
        )

        assert len(performances) == 30
        for i, perf in enumerate(performances):
            assert perf.time.total_seconds() == i + 1
            assert perf.activity_id == cycling_activity.id

    def test_calculate_running_performances_finds_best_effort(
        self, service, running_activity
    ):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(0),
                distance=0,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(300),
                distance=1000,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.datetime.fromtimestamp(550),
                distance=2000,
                lat=0.0,
                lon=0.0,
                heart_rate=None,
                speed=0.0,
            ),
        ]
        performances = service.calculate_running_performances(
            running_activity, tracepoints
        )

        km_perf = next(p for p in performances if p.distance == 1000)
        assert km_perf.time == datetime.timedelta(seconds=250)
