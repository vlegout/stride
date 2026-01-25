import datetime
import uuid
from unittest.mock import Mock

import pytest

from api.model import Activity, Heatmap, Tracepoint
from api.services.heatmap import HeatmapService


class TestHeatmapService:
    @pytest.fixture
    def mock_session(self):
        session = Mock()
        session.exec = Mock()
        session.add = Mock()
        session.commit = Mock()
        session.refresh = Mock()
        return session

    @pytest.fixture
    def service(self, mock_session):
        return HeatmapService(session=mock_session)

    @pytest.fixture
    def sample_user_id(self):
        return "test-user-123"

    @pytest.fixture
    def sample_activity(self, sample_user_id):
        return Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="running",
            title="Test Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            lat=48.8566,
            lon=2.3522,
            status="created",
            fit="test.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

    @pytest.fixture
    def sample_tracepoints(self, sample_activity):
        base_lat, base_lon = 48.8566, 2.3522
        return [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=sample_activity.id,
                lat=base_lat + i * 0.001,
                lon=base_lon + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(10)
        ]

    def test_get_heatmap_returns_none_when_not_found(
        self, service, mock_session, sample_user_id
    ):
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        result = service.get_heatmap(sample_user_id)

        assert result is None
        mock_session.exec.assert_called_once()

    def test_get_heatmap_returns_heatmap_public(
        self, service, mock_session, sample_user_id
    ):
        now = datetime.datetime.now(datetime.timezone.utc)
        heatmap = Heatmap(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            polylines=[
                {
                    "coordinates": [[48.8566, 2.3522], [48.8576, 2.3532]],
                    "sport": "running",
                },
                {
                    "coordinates": [[48.8600, 2.3600], [48.8610, 2.3610]],
                    "sport": "cycling",
                },
            ],
            activity_count=2,
            point_count=4,
            created_at=now,
            updated_at=now,
        )

        mock_result = Mock()
        mock_result.first.return_value = heatmap
        mock_session.exec.return_value = mock_result

        result = service.get_heatmap(sample_user_id)

        assert result is not None
        assert result.activity_count == 2
        assert result.point_count == 4
        assert len(result.polylines) == 2
        assert result.polylines[0].sport == "running"
        assert result.polylines[1].sport == "cycling"

    def test_compute_heatmap_no_activities(self, service, mock_session, sample_user_id):
        mock_activities_result = Mock()
        mock_activities_result.all.return_value = []

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = []

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = None

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 0
        assert result.point_count == 0
        assert len(result.polylines) == 0
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_compute_heatmap_filters_swimming(
        self, service, mock_session, sample_user_id
    ):
        running_activity = Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="running",
            title="Test Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            lat=48.8566,
            lon=2.3522,
            status="created",
            fit="test.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                lat=48.8566 + i * 0.001,
                lon=2.3522 + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(5)
        ]

        mock_activities_result = Mock()
        mock_activities_result.all.return_value = [running_activity]

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = tracepoints

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = None

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 1
        assert len(result.polylines) == 1
        assert result.polylines[0].sport == "running"

    def test_compute_heatmap_creates_new_heatmap(
        self, service, mock_session, sample_user_id, sample_activity, sample_tracepoints
    ):
        mock_activities_result = Mock()
        mock_activities_result.all.return_value = [sample_activity]

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = sample_tracepoints

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = None

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 1
        assert result.point_count > 0
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_compute_heatmap_updates_existing_heatmap(
        self, service, mock_session, sample_user_id, sample_activity, sample_tracepoints
    ):
        now = datetime.datetime.now(datetime.timezone.utc)
        existing_heatmap = Heatmap(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            polylines=[],
            activity_count=0,
            point_count=0,
            created_at=now - datetime.timedelta(days=1),
            updated_at=now - datetime.timedelta(days=1),
        )

        mock_activities_result = Mock()
        mock_activities_result.all.return_value = [sample_activity]

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = sample_tracepoints

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = existing_heatmap

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 1
        assert existing_heatmap.activity_count == 1
        assert existing_heatmap.updated_at > now - datetime.timedelta(days=1)
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_compute_heatmap_skips_activities_without_tracepoints(
        self, service, mock_session, sample_user_id
    ):
        activity1 = Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="running",
            title="Run with GPS",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            lat=48.8566,
            lon=2.3522,
            status="created",
            fit="test1.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )
        activity2 = Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="running",
            title="Indoor Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=3000,
            total_elapsed_time=1200,
            total_timer_time=1200,
            lat=48.8566,
            lon=2.3522,
            status="created",
            fit="test2.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

        tracepoints_for_activity1 = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=activity1.id,
                lat=48.8566 + i * 0.001,
                lon=2.3522 + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(5)
        ]

        mock_activities_result = Mock()
        mock_activities_result.all.return_value = [activity1, activity2]

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = tracepoints_for_activity1

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = None

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 2
        assert len(result.polylines) == 1

    def test_simplify_tracepoints_single_point(self, service):
        tracepoint = Tracepoint(
            id=uuid.uuid4(),
            activity_id=uuid.uuid4(),
            lat=48.8566,
            lon=2.3522,
            timestamp=datetime.datetime.now(),
            distance=0,
            heart_rate=150,
            speed=12.0,
        )

        result = service._simplify_tracepoints([tracepoint])

        assert len(result) == 1
        assert result[0] == [48.8566, 2.3522]

    def test_simplify_tracepoints_two_points(self, service):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=48.8566,
                lon=2.3522,
                timestamp=datetime.datetime.now(),
                distance=0,
                heart_rate=150,
                speed=12.0,
            ),
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=48.8576,
                lon=2.3532,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=10),
                distance=100,
                heart_rate=155,
                speed=12.0,
            ),
        ]

        result = service._simplify_tracepoints(tracepoints)

        assert len(result) == 2
        assert result[0] == [48.8566, 2.3522]
        assert result[1] == [48.8576, 2.3532]

    def test_simplify_tracepoints_preserves_endpoints(self, service):
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=48.8566 + i * 0.0001,
                lon=2.3522 + i * 0.0001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 10,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(20)
        ]

        result = service._simplify_tracepoints(tracepoints)

        assert result[0] == [48.8566, 2.3522]
        last_tp = tracepoints[-1]
        assert result[-1] == [last_tp.lat, last_tp.lon]

    def test_simplify_tracepoints_reduces_point_count(self, service):
        base_lat, base_lon = 48.8566, 2.3522
        tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=uuid.uuid4(),
                lat=base_lat + i * 0.00001,
                lon=base_lon + i * 0.00001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i),
                distance=i * 1,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(100)
        ]

        result = service._simplify_tracepoints(tracepoints)

        assert len(result) < len(tracepoints)

    def test_compute_heatmap_multiple_sports(
        self, service, mock_session, sample_user_id
    ):
        running_activity = Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="running",
            title="Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
            lat=48.8566,
            lon=2.3522,
            status="created",
            fit="run.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )
        cycling_activity = Activity(
            id=uuid.uuid4(),
            user_id=sample_user_id,
            sport="cycling",
            title="Ride",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
            lat=48.9000,
            lon=2.4000,
            status="created",
            fit="ride.fit",
            device="test",
            race=False,
            timestamp=int(datetime.datetime.now().timestamp()),
        )

        running_tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                lat=48.8566 + i * 0.001,
                lon=2.3522 + i * 0.001,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 10),
                distance=i * 100,
                heart_rate=150,
                speed=12.0,
            )
            for i in range(5)
        ]
        cycling_tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=cycling_activity.id,
                lat=48.9000 + i * 0.002,
                lon=2.4000 + i * 0.002,
                timestamp=datetime.datetime.now() + datetime.timedelta(seconds=i * 5),
                distance=i * 200,
                heart_rate=140,
                speed=30.0,
            )
            for i in range(5)
        ]

        mock_activities_result = Mock()
        mock_activities_result.all.return_value = [running_activity, cycling_activity]

        mock_tracepoints_result = Mock()
        mock_tracepoints_result.all.return_value = (
            running_tracepoints + cycling_tracepoints
        )

        mock_heatmap_result = Mock()
        mock_heatmap_result.first.return_value = None

        mock_session.exec.side_effect = [
            mock_activities_result,
            mock_tracepoints_result,
            mock_heatmap_result,
        ]

        result = service.compute_heatmap(sample_user_id)

        assert result.activity_count == 2
        assert len(result.polylines) == 2
        sports = {p.sport for p in result.polylines}
        assert sports == {"running", "cycling"}
