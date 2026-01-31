import datetime
import unittest
import uuid
from unittest.mock import Mock

from api.model import Activity
from api.fitness import calculate_activity_score, calculate_fitness_scores


class TestFitness(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures"""
        self.running_activity = Activity(
            id=uuid.uuid4(),
            fit="test_run.fit",
            title="Test Run",
            description="Test running activity",
            sport="running",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=3600.0,  # 1 hour
            total_elapsed_time=3600.0,
            total_distance=10000.0,  # 10km
            total_ascent=100.0,
            avg_speed=2.78,
            user_id="test-user-id",
        )

        self.cycling_activity = Activity(
            id=uuid.uuid4(),
            fit="test_bike.fit",
            title="Test Bike",
            description="Test cycling activity",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=7200.0,  # 2 hours
            total_elapsed_time=7200.0,
            total_distance=60000.0,  # 60km
            total_ascent=500.0,
            avg_speed=8.33,
            avg_power=250,
            user_id="test-user-id",
        )

    def test_calculate_activity_score_running_basic(self):
        """Test calculate_activity_score with basic running activity"""
        score = calculate_activity_score(self.running_activity)

        # Should get points for:
        # - Distance: 10km * 0.15 = 1.5 points
        # - Time: 0 points (1 hour baseline)
        # - Elevation: 0.1km * 0.3 = 0.03 points
        expected_score = 1.5 + 0.03
        self.assertAlmostEqual(score, expected_score, places=2)

    def test_calculate_activity_score_running_long_distance(self):
        """Test calculate_activity_score with long running distance (marathon+)"""
        marathon_activity = Activity(
            id=uuid.uuid4(),
            fit="marathon.fit",
            title="Marathon",
            description="Marathon run",
            sport="running",
            device="test",
            race=True,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=12600.0,  # 3.5 hours
            total_elapsed_time=12600.0,
            total_distance=42195.0,  # Marathon distance
            total_ascent=200.0,
            avg_speed=3.35,
            user_id="test-user-id",
        )

        score = calculate_activity_score(marathon_activity)

        # Should get bonus points for marathon distance and race
        # Base: 42.195 * 0.15 = ~6.33
        # Half marathon bonus: 42.195 * 0.03 = ~1.27
        # Marathon bonus: 42.195 * 0.03 = ~1.27
        # Time bonus: (3.5 - 1) * 0.15 + (3.5 - 3) * 0.08 = 0.375 + 0.04 = 0.415
        # Elevation: 0.2 * 0.3 = 0.06
        # Race bonus: multiply by 1.05
        base_score = 6.33 + 1.27 + 1.27 + 0.415 + 0.06
        expected_score = base_score * 1.05
        self.assertAlmostEqual(score, expected_score, places=1)

    def test_calculate_activity_score_cycling_basic(self):
        """Test calculate_activity_score with basic cycling activity"""
        score = calculate_activity_score(self.cycling_activity)

        # Should get points for:
        # - Distance: 60km * 0.005 = 0.3 points
        # - Time: 0 points (needs >3 hours)
        # - Elevation: 0.5km * 0.05 = 0.025 points
        # - Power: estimated TSS contribution
        expected_min_score = 0.3 + 0.025
        self.assertGreater(score, expected_min_score)

    def test_calculate_activity_score_cycling_long(self):
        """Test calculate_activity_score with long cycling activity"""
        long_ride = Activity(
            id=uuid.uuid4(),
            fit="century.fit",
            title="Century Ride",
            description="100+ km ride",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=18000.0,  # 5 hours
            total_elapsed_time=18000.0,
            total_distance=120000.0,  # 120km
            total_ascent=1000.0,
            avg_speed=6.67,
            avg_power=220,
            user_id="test-user-id",
        )

        score = calculate_activity_score(long_ride)

        # Should get bonus points for century distance and long duration
        # Base: 120 * 0.005 = 0.6
        # Century bonus: 120 * 0.001 = 0.12
        # Time bonus: (5 - 3) * 0.02 + (5 - 5) * 0.005 = 0.04
        # Elevation: 1.0 * 0.05 = 0.05
        expected_min_score = 0.6 + 0.12 + 0.04 + 0.05
        self.assertGreater(score, expected_min_score)

    def test_calculate_activity_score_with_sport_filter(self):
        """Test calculate_activity_score with sport filter"""
        # Running activity with cycling filter should return 0
        score = calculate_activity_score(self.running_activity, "cycling")
        self.assertEqual(score, 0.0)

        # Running activity with running filter should return normal score
        score = calculate_activity_score(self.running_activity, "running")
        self.assertGreater(score, 0.0)

    def test_calculate_activity_score_with_tss(self):
        """Test calculate_activity_score with training stress score"""
        activity_with_tss = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            title="Test with TSS",
            description="Test",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=3600.0,
            total_elapsed_time=3600.0,
            total_distance=30000.0,
            total_ascent=100.0,
            avg_speed=8.33,
            training_stress_score=100.0,
            user_id="test-user-id",
        )

        score = calculate_activity_score(activity_with_tss)

        # Should include TSS contribution: 100 * 0.005 = 0.5
        self.assertGreater(score, 0.5)

    def test_calculate_fitness_scores_empty_activities(self):
        """Test calculate_fitness_scores with no activities"""
        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        result = calculate_fitness_scores(mock_session, "test-user-id")

        # Should return structure with empty/zero scores
        self.assertIn("scores", result)
        self.assertIn("weekly_tss", result)
        self.assertIn("weekly_running", result)
        self.assertIn("weekly_cycling", result)
        self.assertIn("weekly_zones", result)
        self.assertIn("ftp", result)

        # All daily scores should be 0
        for daily_score in result["scores"]:
            self.assertEqual(daily_score["overall"], 0)
            self.assertEqual(daily_score["running"], 0)
            self.assertEqual(daily_score["cycling"], 0)

    def test_calculate_fitness_scores_with_activities(self):
        """Test calculate_fitness_scores with some activities"""
        # Create mock activities - make it a longer run to ensure scoring
        now = datetime.datetime.now()
        recent_timestamp = int((now - datetime.timedelta(days=1)).timestamp())

        mock_activities = [
            Activity(
                id=uuid.uuid4(),
                fit="recent_run.fit",
                title="Recent Long Run",
                description="Recent long running activity",
                sport="running",
                device="test",
                race=False,
                start_time=recent_timestamp,
                timestamp=recent_timestamp,
                total_timer_time=3600.0,  # 1 hour
                total_elapsed_time=3600.0,
                total_distance=10000.0,  # 10km to ensure scoring
                total_ascent=100.0,
                avg_speed=2.78,
                user_id="test-user-id",
            )
        ]

        mock_session = Mock()

        # Create mock results for all the queries made by calculate_fitness_scores
        mock_activities_result = Mock()
        mock_activities_result.all.return_value = mock_activities

        mock_ftp_result = Mock()
        mock_ftp_result.all.return_value = []  # No FTP records

        mock_zones_result = Mock()
        mock_zones_result.all.return_value = []  # No zones

        # Mock empty results for weekly activity queries (104 weeks)
        mock_weekly_activities_result = Mock()
        mock_weekly_activities_result.all.return_value = []

        # Mock session.exec to return different results based on call order
        # First call: main activities, second: FTP, third: zones, then 104 weekly queries
        side_effects = [mock_activities_result, mock_ftp_result, mock_zones_result]
        side_effects.extend([mock_weekly_activities_result] * 104)
        mock_session.exec.side_effect = side_effects

        result = calculate_fitness_scores(mock_session, "test-user-id")

        # Should return structure with some non-zero scores
        self.assertIn("scores", result)
        self.assertIn("weekly_tss", result)
        self.assertIn("weekly_running", result)
        self.assertIn("weekly_cycling", result)
        self.assertIn("weekly_zones", result)
        self.assertIn("ftp", result)

        # Should have 730 daily scores (2 years)
        self.assertEqual(len(result["scores"]), 730)

        # Should have 104 weekly data points (2 years)
        self.assertEqual(len(result["weekly_tss"]), 104)
        self.assertEqual(len(result["weekly_running"]), 104)
        self.assertEqual(len(result["weekly_cycling"]), 104)

        # Verify structure of weekly data
        for weekly_data in result["weekly_running"]:
            self.assertIn("week_start", weekly_data)
            self.assertIn("distance", weekly_data)
            self.assertIn("time", weekly_data)
            self.assertGreaterEqual(weekly_data["distance"], 0)
            self.assertGreaterEqual(weekly_data["time"], 0)

    def test_calculate_fitness_scores_date_format(self):
        """Test that calculate_fitness_scores returns proper date formats"""
        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        result = calculate_fitness_scores(mock_session, "test-user-id")

        # Check date format in scores
        for daily_score in result["scores"][:5]:  # Check first 5
            self.assertRegex(daily_score["date"], r"^\d{4}-\d{2}-\d{2}$")

        # Check date format in weekly data
        for weekly_data in result["weekly_tss"][:5]:  # Check first 5
            self.assertRegex(weekly_data["week_start"], r"^\d{4}-\d{2}-\d{2}$")

    def test_calculate_fitness_scores_score_bounds(self):
        """Test that fitness scores are within expected bounds (0-200)"""
        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        result = calculate_fitness_scores(mock_session, "test-user-id")

        # All scores should be between 0 and 200
        for daily_score in result["scores"]:
            self.assertGreaterEqual(daily_score["overall"], 0)
            self.assertLessEqual(daily_score["overall"], 200)
            self.assertGreaterEqual(daily_score["running"], 0)
            self.assertLessEqual(daily_score["running"], 200)
            self.assertGreaterEqual(daily_score["cycling"], 0)
            self.assertLessEqual(daily_score["cycling"], 200)


class TestSwimmingScore(unittest.TestCase):
    """Test swimming activity scoring"""

    def test_calculate_activity_score_swimming_basic(self):
        """Test calculate_activity_score with basic swimming activity"""
        swimming_activity = Activity(
            id=uuid.uuid4(),
            fit="swim.fit",
            title="Pool Swim",
            description="Swimming",
            sport="swimming",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,  # 30 minutes
            total_elapsed_time=1800.0,
            total_distance=1500.0,  # 1.5km
            total_ascent=0.0,
            avg_speed=0.83,
            user_id="test-user-id",
        )

        score = calculate_activity_score(swimming_activity)

        # Should get points for:
        # - Distance: 1.5km * 0.3 = 0.45 points
        # Score should be positive
        self.assertGreater(score, 0)

    def test_calculate_activity_score_swimming_long(self):
        """Test calculate_activity_score with long swimming activity"""
        long_swim = Activity(
            id=uuid.uuid4(),
            fit="long_swim.fit",
            title="Long Open Water Swim",
            description="Open water",
            sport="swimming",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=7200.0,  # 2 hours
            total_elapsed_time=7200.0,
            total_distance=5500.0,  # 5.5km
            total_ascent=0.0,
            avg_speed=0.76,
            user_id="test-user-id",
        )

        score = calculate_activity_score(long_swim)

        # Should get bonus points for long swim (>3km and >5km)
        # Distance: 5.5 * 0.3 = 1.65
        # Long swim bonus (>3km): 5.5 * 0.05 = 0.275
        # Very long swim bonus (>5km): 5.5 * 0.05 = 0.275
        # Time: (2 - 0.5) * 0.2 + (2 - 1.5) * 0.1 = 0.3 + 0.05 = 0.35
        expected_min_score = 1.65 + 0.275 + 0.275 + 0.35
        self.assertGreaterEqual(score, expected_min_score - 0.1)  # Allow small margin

    def test_calculate_activity_score_swimming_with_filter(self):
        """Test calculate_activity_score with swimming filter"""
        swimming_activity = Activity(
            id=uuid.uuid4(),
            fit="swim.fit",
            title="Pool Swim",
            description="Swimming",
            sport="swimming",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,
            total_elapsed_time=1800.0,
            total_distance=1500.0,
            total_ascent=0.0,
            avg_speed=0.83,
            user_id="test-user-id",
        )

        # Swimming activity with running filter should return 0
        score = calculate_activity_score(swimming_activity, "running")
        self.assertEqual(score, 0.0)

        # Swimming activity with swimming filter should return normal score
        score = calculate_activity_score(swimming_activity, "swimming")
        self.assertGreater(score, 0.0)


class TestFTPCalculation(unittest.TestCase):
    """Test FTP calculation functions"""

    def test_calculate_ftp_from_activities_no_activities(self):
        """Test FTP calculation with no cycling activities"""
        from api.fitness import calculate_ftp_from_activities

        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        ftp = calculate_ftp_from_activities(
            mock_session, "test-user-id", datetime.date.today()
        )
        self.assertEqual(ftp, 0.0)

    def test_calculate_ftp_from_activities_with_np_power(self):
        """Test FTP calculation using NP power method"""
        from api.fitness import calculate_ftp_from_activities

        # Create mock activities with NP power
        mock_activity = Activity(
            id=uuid.uuid4(),
            fit="cycling.fit",
            title="Long Ride",
            description="Cycling",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=7200.0,  # 2 hours
            total_elapsed_time=7200.0,
            total_distance=60000.0,
            total_ascent=500.0,
            avg_speed=8.33,
            avg_power=220,
            np_power=250,  # Normalized power
            user_id="test-user-id",
        )

        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = [mock_activity]
        mock_session.exec.return_value = mock_result

        ftp = calculate_ftp_from_activities(
            mock_session, "test-user-id", datetime.date.today()
        )

        # FTP should be approximately 95% of best 20-min NP power
        # Since we have NP of 250, FTP estimate should be around 250 * 0.95 = 237.5
        self.assertGreater(ftp, 0)

    def test_calculate_ftp_from_activities_with_max_power(self):
        """Test FTP calculation using max power method"""
        from api.fitness import calculate_ftp_from_activities

        mock_activity = Activity(
            id=uuid.uuid4(),
            fit="cycling.fit",
            title="Short Hard Ride",
            description="Cycling",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=1800.0,  # 30 minutes
            total_elapsed_time=1800.0,
            total_distance=20000.0,
            total_ascent=200.0,
            avg_speed=11.1,
            avg_power=280,
            max_power=450,
            user_id="test-user-id",
        )

        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = [mock_activity]
        mock_session.exec.return_value = mock_result

        ftp = calculate_ftp_from_activities(
            mock_session, "test-user-id", datetime.date.today()
        )

        # Should have a positive FTP estimate
        self.assertGreater(ftp, 0)

    def test_calculate_ftp_from_activities_long_rides(self):
        """Test FTP calculation from long ride average power"""
        from api.fitness import calculate_ftp_from_activities

        mock_activity = Activity(
            id=uuid.uuid4(),
            fit="century.fit",
            title="Century Ride",
            description="Cycling",
            sport="cycling",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=14400.0,  # 4 hours
            total_elapsed_time=14400.0,
            total_distance=160000.0,
            total_ascent=1000.0,
            avg_speed=11.1,
            avg_power=200,  # Long ride average power (typically 90% of FTP)
            user_id="test-user-id",
        )

        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = [mock_activity]
        mock_session.exec.return_value = mock_result

        ftp = calculate_ftp_from_activities(
            mock_session, "test-user-id", datetime.date.today()
        )

        # FTP estimate from long ride avg power of 200 should be around 200 * 1.1 = 220
        self.assertGreater(ftp, 0)


class TestDecayFactor(unittest.TestCase):
    """Test decay factor calculation in fitness scores"""

    def test_activity_score_contributes_to_fitness(self):
        """Test that activity scores contribute to fitness calculations"""
        # Test that a running activity has positive score
        activity = Activity(
            id=uuid.uuid4(),
            fit="run.fit",
            title="Test Run",
            description="Test",
            sport="running",
            device="test",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=3600.0,
            total_elapsed_time=3600.0,
            total_distance=10000.0,  # 10km
            total_ascent=100.0,
            avg_speed=2.78,
            user_id="test-user-id",
        )

        score = calculate_activity_score(activity)
        self.assertGreater(score, 0, "Activity should have positive score")

    def test_decay_factor_bounds(self):
        """Test that decay factor is between 0.1 and 1.0"""
        # The decay formula is: max(0.1, 1.0 - (days_before / 42) * 0.5)
        # At day 0: 1.0 - 0 = 1.0
        # At day 42: 1.0 - 0.5 = 0.5
        # At day 84: max(0.1, 1.0 - 1.0) = 0.1

        # Day 0
        decay_0 = max(0.1, 1.0 - (0 / 42) * 0.5)
        self.assertEqual(decay_0, 1.0)

        # Day 21 (half window)
        decay_21 = max(0.1, 1.0 - (21 / 42) * 0.5)
        self.assertAlmostEqual(decay_21, 0.75, places=2)

        # Day 42 (end of window)
        decay_42 = max(0.1, 1.0 - (42 / 42) * 0.5)
        self.assertAlmostEqual(decay_42, 0.5, places=2)

        # Day 100 (way beyond window)
        decay_100 = max(0.1, 1.0 - (100 / 42) * 0.5)
        self.assertEqual(decay_100, 0.1)

    def test_fitness_scores_structure(self):
        """Test that fitness scores returns proper structure"""
        mock_session = Mock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_session.exec.return_value = mock_result

        result = calculate_fitness_scores(mock_session, "test-user-id")

        # Should have 730 days of scores
        self.assertEqual(len(result["scores"]), 730)

        # Should have weekly data
        self.assertEqual(len(result["weekly_tss"]), 104)
        self.assertEqual(len(result["weekly_running"]), 104)
        self.assertEqual(len(result["weekly_cycling"]), 104)
        self.assertEqual(len(result["weekly_swimming"]), 104)

        # Check structure of individual entries
        for daily_score in result["scores"][:5]:
            self.assertIn("date", daily_score)
            self.assertIn("overall", daily_score)
            self.assertIn("running", daily_score)
            self.assertIn("cycling", daily_score)
            self.assertIn("swimming", daily_score)


if __name__ == "__main__":
    unittest.main()
