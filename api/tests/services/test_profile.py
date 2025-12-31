import datetime
from unittest.mock import Mock

import pytest

from api.model import Profile, Zone, ZonePublic
from api.services.profile import ProfileService


class TestProfileService:
    @pytest.fixture
    def mock_session(self):
        return Mock()

    @pytest.fixture
    def service(self, mock_session):
        return ProfileService(mock_session)

    def test_get_user_profile_success(self, service, mock_session):
        mock_overall_result = Mock()
        mock_overall_result.__getitem__ = Mock(
            side_effect=lambda x: [10, 5, 25000.0, 3, 50000.0, 2, 3000.0][x]
        )

        mock_yearly_result = Mock()
        mock_yearly_result.__getitem__ = Mock(
            side_effect=lambda x: [2024, "running", 5, 25000.0][x]
        )

        mock_zone = Zone(
            user_id="test-user",
            type="heart_rate",
            index=1,
            max_value=120.0,
        )

        mock_exec_overall = Mock()
        mock_exec_overall.one.return_value = mock_overall_result

        mock_exec_yearly = Mock()
        mock_exec_yearly.all.return_value = [mock_yearly_result]

        mock_exec_zones = Mock()
        mock_exec_zones.all.return_value = [mock_zone]

        mock_session.exec.side_effect = [
            mock_exec_overall,
            mock_exec_yearly,
            mock_exec_zones,
        ]

        profile = service.get_user_profile("test-user")

        assert isinstance(profile, Profile)
        assert profile.n_activities == 10
        assert profile.run_n_activities == 5
        assert profile.run_total_distance == 25000.0
        assert profile.cycling_n_activities == 3
        assert profile.cycling_total_distance == 50000.0
        assert profile.swimming_n_activities == 2
        assert profile.swimming_total_distance == 3000.0
        assert len(profile.years) > 0
        assert len(profile.zones) == 1

    def test_get_user_profile_no_activities(self, service, mock_session):
        mock_overall_result = Mock()
        mock_overall_result.__getitem__ = Mock(
            side_effect=lambda x: [0, 0, 0.0, 0, 0.0, 0, 0.0][x]
        )

        mock_exec_overall = Mock()
        mock_exec_overall.one.return_value = mock_overall_result

        mock_exec_yearly = Mock()
        mock_exec_yearly.all.return_value = []

        mock_exec_zones = Mock()
        mock_exec_zones.all.return_value = []

        mock_session.exec.side_effect = [
            mock_exec_overall,
            mock_exec_yearly,
            mock_exec_zones,
        ]

        profile = service.get_user_profile("test-user")

        assert profile.n_activities == 0
        assert profile.run_n_activities == 0
        assert profile.cycling_n_activities == 0
        assert len(profile.zones) == 0

    def test_get_user_profile_multiple_years(self, service, mock_session):
        mock_overall_result = Mock()
        mock_overall_result.__getitem__ = Mock(
            side_effect=lambda x: [20, 10, 50000.0, 8, 100000.0, 2, 5000.0][x]
        )

        mock_yearly_2023 = Mock()
        mock_yearly_2023.__getitem__ = Mock(
            side_effect=lambda x: [2023, "running", 5, 25000.0][x]
        )

        mock_yearly_2024 = Mock()
        mock_yearly_2024.__getitem__ = Mock(
            side_effect=lambda x: [2024, "cycling", 8, 100000.0][x]
        )

        mock_exec_overall = Mock()
        mock_exec_overall.one.return_value = mock_overall_result

        mock_exec_yearly = Mock()
        mock_exec_yearly.all.return_value = [mock_yearly_2023, mock_yearly_2024]

        mock_exec_zones = Mock()
        mock_exec_zones.all.return_value = []

        mock_session.exec.side_effect = [
            mock_exec_overall,
            mock_exec_yearly,
            mock_exec_zones,
        ]

        profile = service.get_user_profile("test-user")

        assert profile.n_activities == 20
        current_year = datetime.datetime.now().year
        assert len(profile.years) == current_year - 2013 + 1

    def test_get_user_profile_with_zones(self, service, mock_session):
        mock_overall_result = Mock()
        mock_overall_result.__getitem__ = Mock(
            side_effect=lambda x: [10, 5, 25000.0, 3, 50000.0, 2, 3000.0][x]
        )

        zones = [
            Zone(user_id="test-user", type="heart_rate", index=1, max_value=120.0),
            Zone(user_id="test-user", type="heart_rate", index=2, max_value=140.0),
            Zone(user_id="test-user", type="pace", index=1, max_value=360.0),
        ]

        mock_exec_overall = Mock()
        mock_exec_overall.one.return_value = mock_overall_result

        mock_exec_yearly = Mock()
        mock_exec_yearly.all.return_value = []

        mock_exec_zones = Mock()
        mock_exec_zones.all.return_value = zones

        mock_session.exec.side_effect = [
            mock_exec_overall,
            mock_exec_yearly,
            mock_exec_zones,
        ]

        profile = service.get_user_profile("test-user")

        assert len(profile.zones) == 3
        assert all(isinstance(z, ZonePublic) for z in profile.zones)
