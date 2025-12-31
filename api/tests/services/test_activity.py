import datetime
import uuid
from unittest.mock import Mock, patch

import pytest

from api.model import Activity, Lap, Performance, PerformancePower, Tracepoint
from api.services.activity import ActivityService


class TestActivityService:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    @pytest.fixture
    def mock_storage_service(self):
        return Mock()

    @pytest.fixture
    def mock_zone_service(self):
        return Mock()

    @pytest.fixture
    def mock_notification_service(self):
        service = Mock()
        service.detect_achievements.return_value = []
        return service

    @pytest.fixture
    def service(
        self,
        mock_session,
        mock_storage_service,
        mock_zone_service,
        mock_notification_service,
    ):
        service = ActivityService(
            session=mock_session,
            storage_service=mock_storage_service,
            zone_service=mock_zone_service,
            notification_service=mock_notification_service,
        )
        service.performance.calculate_running_performances = Mock(return_value=[])  # type: ignore
        service.performance.calculate_cycling_performances = Mock(return_value=[])  # type: ignore
        return service

    @pytest.fixture
    def running_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="running",
            user_id=None,
            title="Test Run",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=5000,
            total_elapsed_time=1800,
            total_timer_time=1800,
        )

    @pytest.fixture
    def cycling_activity(self):
        return Activity(
            id=uuid.uuid4(),
            sport="cycling",
            user_id=None,
            title="Test Ride",
            start_time=int(datetime.datetime.now().timestamp()),
            total_distance=20000,
            total_elapsed_time=3600,
            total_timer_time=3600,
        )

    @pytest.fixture
    def sample_laps(self, running_activity):
        return [
            Lap(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                start_time=0,
                timestamp=datetime.timedelta(seconds=600),
                total_elapsed_time=datetime.timedelta(seconds=600),
                total_timer_time=datetime.timedelta(seconds=600),
                total_distance=1000,
            )
        ]

    @pytest.fixture
    def sample_tracepoints(self, running_activity):
        return [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=i * 10),
                distance=i * 100,
            )
            for i in range(10)
        ]

    @patch("api.services.activity.get_activity_from_fit")
    @patch("api.services.activity.update_ftp_for_date")
    def test_create_activity_running_success(
        self,
        mock_update_ftp,
        mock_get_activity,
        service,
        running_activity,
        sample_laps,
        sample_tracepoints,
        mock_session,
        mock_storage_service,
        mock_zone_service,
        mock_notification_service,
    ):
        mock_get_activity.return_value = (
            running_activity,
            sample_laps,
            sample_tracepoints,
        )

        performances = [
            Performance(id=uuid.uuid4(), activity_id=running_activity.id, distance=1000)
        ]
        service.performance.calculate_running_performances.return_value = performances

        notifications = []
        mock_notification_service.detect_achievements.return_value = notifications

        result = service.create_activity(
            user_id="test-user",
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Morning Run",
            race=False,
        )

        assert result == running_activity
        assert result.user_id == "test-user"

        mock_get_activity.assert_called_once_with(
            session=mock_session,
            fit_file="/tmp/test.fit",
            title="Morning Run",
            description="",
            race=False,
            fit_name="test.fit",
        )

        service.performance.calculate_running_performances.assert_called_once()
        service.performance.calculate_cycling_performances.assert_called_once()

        mock_session.add.assert_called()
        mock_session.commit.assert_called()

        mock_storage_service.upload_activity_files.assert_called_once_with(
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Morning Run",
            race=False,
        )

        mock_zone_service.calculate_activity_zones.assert_called_once()
        mock_zone_service.update_user_zones.assert_called_once_with("test-user")

        mock_update_ftp.assert_not_called()

    @patch("api.services.activity.get_activity_from_fit")
    @patch("api.services.activity.update_ftp_for_date")
    def test_create_activity_cycling_updates_ftp(
        self,
        mock_update_ftp,
        mock_get_activity,
        service,
        cycling_activity,
        sample_laps,
        sample_tracepoints,
        mock_session,
    ):
        mock_get_activity.return_value = (
            cycling_activity,
            sample_laps,
            sample_tracepoints,
        )

        result = service.create_activity(
            user_id="test-user",
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Bike Ride",
            race=False,
        )

        assert result.sport == "cycling"

        expected_date = datetime.date.fromtimestamp(cycling_activity.start_time)
        mock_update_ftp.assert_called_once_with(
            mock_session, "test-user", expected_date
        )

    @patch("api.services.activity.get_activity_from_fit")
    def test_create_activity_storage_upload_failure(
        self,
        mock_get_activity,
        service,
        running_activity,
        sample_laps,
        sample_tracepoints,
        mock_storage_service,
    ):
        mock_get_activity.return_value = (
            running_activity,
            sample_laps,
            sample_tracepoints,
        )

        mock_storage_service.upload_activity_files.side_effect = Exception(
            "S3 upload failed"
        )

        with pytest.raises(
            Exception, match="Failed to upload files for activity 'Morning Run'"
        ):
            service.create_activity(
                user_id="test-user",
                fit_file_path="/tmp/test.fit",
                fit_filename="test.fit",
                title="Morning Run",
                race=False,
            )

    @patch("api.services.activity.get_activity_from_fit")
    def test_create_activity_with_notifications(
        self,
        mock_get_activity,
        service,
        running_activity,
        sample_laps,
        sample_tracepoints,
        mock_session,
        mock_notification_service,
    ):
        mock_get_activity.return_value = (
            running_activity,
            sample_laps,
            sample_tracepoints,
        )

        from api.model import Notification

        notifications = [
            Notification(
                activity_id=running_activity.id,
                type="best_effort_all_time",
                distance=5000,
                achievement_year=None,
                message="New personal best!",
            )
        ]
        mock_notification_service.detect_achievements.return_value = notifications

        service.create_activity(
            user_id="test-user",
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Fast Run",
            race=True,
        )

        add_calls = mock_session.add.call_args_list
        added_objects = [call[0][0] for call in add_calls]
        notification_objects = [
            obj for obj in added_objects if isinstance(obj, Notification)
        ]
        assert len(notification_objects) == 1

    @patch("api.services.activity.get_activity_from_fit")
    def test_create_activity_downsamples_large_tracepoint_set(
        self, mock_get_activity, service, running_activity, mock_session
    ):
        from api.utils import MAX_TRACEPOINTS_FOR_RESPONSE

        large_tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=i),
                distance=i * 10,
            )
            for i in range(MAX_TRACEPOINTS_FOR_RESPONSE + 1000)
        ]

        mock_get_activity.return_value = (running_activity, [], large_tracepoints)

        service.create_activity(
            user_id="test-user",
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Long Run",
            race=False,
        )

        add_calls = mock_session.add.call_args_list
        added_tracepoints = [
            call[0][0] for call in add_calls if isinstance(call[0][0], Tracepoint)
        ]

        assert len(added_tracepoints) <= MAX_TRACEPOINTS_FOR_RESPONSE

    @patch("api.services.activity.get_activity_from_fit")
    def test_create_activity_preserves_original_tracepoints_for_zones(
        self, mock_get_activity, service, running_activity, mock_zone_service
    ):
        from api.utils import MAX_TRACEPOINTS_FOR_RESPONSE

        large_tracepoints = [
            Tracepoint(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                timestamp=datetime.timedelta(seconds=i),
                distance=i * 10,
            )
            for i in range(MAX_TRACEPOINTS_FOR_RESPONSE + 1000)
        ]

        mock_get_activity.return_value = (running_activity, [], large_tracepoints)

        service.create_activity(
            user_id="test-user",
            fit_file_path="/tmp/test.fit",
            fit_filename="test.fit",
            title="Long Run",
            race=False,
        )

        call_args = mock_zone_service.calculate_activity_zones.call_args
        passed_tracepoints = call_args[0][1]

        assert len(passed_tracepoints) == MAX_TRACEPOINTS_FOR_RESPONSE + 1000

    def test_persist_activity_data(
        self, service, running_activity, sample_laps, sample_tracepoints, mock_session
    ):
        performances = [
            Performance(id=uuid.uuid4(), activity_id=running_activity.id, distance=1000)
        ]
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(),
                activity_id=running_activity.id,
                time=datetime.timedelta(seconds=60),
                power=200.0,
            )
        ]

        service._persist_activity_data(
            running_activity,
            sample_laps,
            sample_tracepoints,
            performances,
            performance_powers,
        )

        add_calls = mock_session.add.call_args_list

        assert len(add_calls) == (
            1
            + len(sample_laps)
            + len(sample_tracepoints)
            + len(performances)
            + len(performance_powers)
        )

        added_objects = [call[0][0] for call in add_calls]
        assert running_activity in added_objects
        assert all(lap in added_objects for lap in sample_laps)
        assert all(tp in added_objects for tp in sample_tracepoints)
        assert all(perf in added_objects for perf in performances)
        assert all(pp in added_objects for pp in performance_powers)

    def test_persist_activity_data_empty_lists(
        self, service, running_activity, mock_session
    ):
        service._persist_activity_data(running_activity, [], [], [], [])

        mock_session.add.assert_called_once_with(running_activity)
