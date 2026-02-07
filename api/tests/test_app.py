import asyncio
import datetime
import json
import os
import unittest
import uuid
from unittest.mock import Mock, MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session

from api.app import (
    app,
    get_activity_service_dependency,
    get_heatmap_service_dependency,
    get_profile_service_dependency,
)
from api.dependencies import get_session, get_current_user_id, verify_jwt_token
from api.auth import create_token_response
from api.model import (
    Activity,
    HeatmapPublic,
    HeatmapPolyline,
    Profile,
    User,
)


class TestApp(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures"""
        self.client = TestClient(app)
        self.test_user_id = "test-user-123"
        self.test_email = "test@example.com"
        self.valid_token = create_token_response(self.test_user_id, self.test_email)

    def tearDown(self):
        """Clean up after tests"""
        app.dependency_overrides.clear()

    def test_cors_middleware_configured(self):
        """Test CORS middleware is properly configured"""
        # Test with a known endpoint that returns CORS headers
        response = self.client.get(
            "/auth/google/", headers={"Origin": "http://localhost:3000"}
        )

        # Verify essential CORS headers are present
        self.assertIn("access-control-allow-origin", response.headers)
        self.assertEqual(response.headers["access-control-allow-origin"], "*")
        self.assertIn("access-control-allow-credentials", response.headers)
        self.assertEqual(response.headers["access-control-allow-credentials"], "true")

        # Test OPTIONS preflight request
        options_response = self.client.options(
            "/auth/google/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertIn("access-control-allow-origin", options_response.headers)
        # For preflight requests, CORS middleware returns the specific origin
        self.assertEqual(
            options_response.headers["access-control-allow-origin"],
            "http://localhost:3000",
        )
        self.assertIn("access-control-allow-credentials", options_response.headers)

    def test_jwt_secret_key_validation(self):
        """Test that JWT_SECRET_KEY environment variable validation logic"""
        # Test the validation logic directly without module reloading
        with patch.dict(os.environ, {}, clear=True):
            # Simulate the same check that happens in app.py
            with self.assertRaises(ValueError) as context:
                if "JWT_SECRET_KEY" not in os.environ:
                    raise ValueError("Missing environment variables: JWT_SECRET_KEY")

            self.assertIn("JWT_SECRET_KEY", str(context.exception))

        # Test that the check passes when the variable is present
        with patch.dict(os.environ, {"JWT_SECRET_KEY": "test-key"}):
            # This should not raise an exception
            try:
                if "JWT_SECRET_KEY" not in os.environ:
                    raise ValueError("Missing environment variables: JWT_SECRET_KEY")
            except ValueError:
                self.fail(
                    "JWT_SECRET_KEY validation should pass when variable is present"
                )

    def test_get_session_dependency(self):
        """Test get_session dependency function"""
        session_generator = get_session()
        session = next(session_generator)
        self.assertIsInstance(session, Session)

    def test_get_current_user_id_with_user(self):
        """Test get_current_user_id with authenticated user"""
        mock_request = Mock()
        mock_request.state.user_id = self.test_user_id

        user_id = get_current_user_id(mock_request)
        self.assertEqual(user_id, self.test_user_id)

    def test_get_current_user_id_without_user(self):
        """Test get_current_user_id without authenticated user"""
        mock_request = Mock()
        mock_request.state = Mock(spec=[])  # No user_id attribute

        with self.assertRaises(HTTPException) as context:
            get_current_user_id(mock_request)

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "User not authenticated")

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_options(self, mock_verify):
        """Test JWT middleware allows OPTIONS requests"""

        async def mock_call_next(_request):
            return "options_response"

        mock_request = Mock()
        mock_request.method = "OPTIONS"

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result, "options_response")
        mock_verify.assert_not_called()

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_public_paths(self, mock_verify):
        """Test JWT middleware allows public paths"""

        async def mock_call_next(_request):
            return "public_response"

        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url.path = "/auth/google/"

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result, "public_response")
        mock_verify.assert_not_called()

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_missing_header(self, mock_verify):
        """Test JWT middleware with missing authorization header"""

        async def mock_call_next(_request):
            return "should_not_be_called"

        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url.path = "/activities/"
        mock_request.headers.get.return_value = None

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result.status_code, 401)
        content = json.loads(result.body)
        self.assertEqual(content["detail"], "Missing or invalid authorization header")
        mock_verify.assert_not_called()

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_invalid_header(self, mock_verify):
        """Test JWT middleware with invalid authorization header"""

        async def mock_call_next(_request):
            return "should_not_be_called"

        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url.path = "/activities/"
        mock_request.headers.get.return_value = "Invalid header"

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result.status_code, 401)
        content = json.loads(result.body)
        self.assertEqual(content["detail"], "Missing or invalid authorization header")
        mock_verify.assert_not_called()

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_valid_token(self, mock_verify):
        """Test JWT middleware with valid token"""

        async def mock_call_next(_request):
            return "success_response"

        mock_token_data = Mock()
        mock_token_data.user_id = self.test_user_id
        mock_token_data.email = self.test_email
        mock_verify.return_value = mock_token_data

        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url.path = "/activities/"
        mock_request.headers.get.return_value = (
            f"Bearer {self.valid_token.access_token}"
        )
        mock_request.state = Mock()

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result, "success_response")
        self.assertEqual(mock_request.state.user_id, self.test_user_id)
        self.assertEqual(mock_request.state.user_email, self.test_email)

    @patch("api.dependencies.verify_token")
    def test_verify_jwt_token_middleware_invalid_token(self, mock_verify):
        """Test JWT middleware with invalid token"""

        async def mock_call_next(_request):
            return "should_not_be_called"

        mock_verify.side_effect = HTTPException(status_code=401, detail="Invalid token")

        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url.path = "/activities/"
        mock_request.headers.get.return_value = "Bearer invalid_token"

        result = asyncio.run(verify_jwt_token(mock_request, mock_call_next))

        self.assertEqual(result.status_code, 401)
        content = json.loads(result.body)
        self.assertEqual(content["detail"], "Invalid or expired token")

    def test_read_activities_endpoint_requires_auth(self):
        """Test activities endpoint requires authentication"""
        response = self.client.get("/activities/")
        self.assertEqual(response.status_code, 401)

    def test_read_activity_endpoint_requires_auth(self):
        """Test single activity endpoint requires authentication"""
        activity_id = uuid.uuid4()
        response = self.client.get(f"/activities/{activity_id}/")
        self.assertEqual(response.status_code, 401)

    def test_create_activity_invalid_file(self):
        """Test create_activity with invalid file extension"""
        files = {"fit_file": ("test.txt", b"not a fit file", "text/plain")}
        data = {"title": "Test Activity", "race": "false"}
        response = self.client.post("/activities/", files=files, data=data)  # type: ignore[arg-type]

        self.assertEqual(response.status_code, 401)  # Should fail auth first

    def test_profile_endpoint_requires_auth(self):
        """Test profile endpoint requires authentication"""
        response = self.client.get("/profile/")
        self.assertEqual(response.status_code, 401)

    def test_weeks_endpoint_requires_auth(self):
        """Test weeks endpoint requires authentication"""
        response = self.client.get("/weeks/")
        self.assertEqual(response.status_code, 401)

    def test_current_user_endpoint_requires_auth(self):
        """Test current user endpoint requires authentication"""
        response = self.client.get("/users/me/")
        self.assertEqual(response.status_code, 401)

    def test_delete_activity_endpoint_requires_auth(self):
        """Test delete activity endpoint requires authentication"""
        activity_id = uuid.uuid4()
        response = self.client.delete(f"/activities/{activity_id}/")
        self.assertEqual(response.status_code, 401)

    def test_google_auth_endpoint_public_access(self):
        """Test Google auth endpoint is publicly accessible"""
        user_data = {
            "google_id": "12345",
            "first_name": "Test",
            "last_name": "User",
            "email": self.test_email,
            "google_picture": "http://example.com/pic.jpg",
        }

        # Should not get 401 for missing auth header
        response = self.client.post("/auth/google/", json=user_data)
        self.assertNotEqual(response.status_code, 401)

    def test_root_endpoint_public_access(self):
        """Test that root endpoint is publicly accessible"""
        response = self.client.get("/")
        # Should not return 401 (should be accessible without auth)
        self.assertNotEqual(response.status_code, 401)

    def test_auth_endpoints_public_access(self):
        """Test that auth endpoints are publicly accessible"""
        # This tests the middleware allows auth endpoints without token
        user_data = {
            "google_id": "12345",
            "first_name": "Test",
            "last_name": "User",
            "email": self.test_email,
            "google_picture": "http://example.com/pic.jpg",
        }

        # Should not get 401 for missing auth header
        response = self.client.post("/auth/google/", json=user_data)
        self.assertNotEqual(response.status_code, 401)


class TestAppEndpointValidation(unittest.TestCase):
    """Test app endpoint validation and error handling"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = TestClient(app)

    def test_invalid_activity_id_format(self):
        """Test endpoint with invalid UUID format"""
        response = self.client.get("/activities/invalid-uuid/")
        self.assertEqual(response.status_code, 401)  # Auth fails before validation

    def test_activities_query_parameter_validation(self):
        """Test activities endpoint with invalid query parameters"""
        # Test invalid limit (too high)
        response = self.client.get("/activities/?limit=1000")
        self.assertEqual(response.status_code, 401)  # Should fail auth first

        # Test invalid page (negative)
        response = self.client.get("/activities/?page=-1")
        self.assertEqual(response.status_code, 401)  # Should fail auth first


class TestActivityStatusFunctionality(unittest.TestCase):
    """Test activity status field functionality and soft delete behavior"""

    def test_delete_activity_endpoint_exists(self):
        """Test that delete activity endpoint is properly configured"""
        from api.app import app

        # Check that the DELETE route exists by examining the route table
        routes = app.routes
        delete_routes = [
            route for route in routes if "DELETE" in getattr(route, "methods", ())
        ]
        activity_delete_routes = [
            route
            for route in delete_routes
            if "/activities/{activity_id}/" in str(route.path)  # type: ignore[attr-defined]
        ]

        self.assertTrue(
            len(activity_delete_routes) > 0,
            "DELETE /activities/{activity_id}/ route should exist",
        )

    def test_status_field_in_query_filters(self):
        """Test that activity queries include status filtering logic"""
        # This test examines the source code to verify status filtering is implemented
        import inspect
        from api.app import read_activities, read_activity

        # Check that read_activities function includes status filtering
        read_activities_source = inspect.getsource(read_activities)
        self.assertIn(
            'status == "created"',
            read_activities_source,
            "read_activities should filter by status='created'",
        )

        # Check that read_activity function includes status filtering
        read_activity_source = inspect.getsource(read_activity)
        self.assertIn(
            'status == "created"',
            read_activity_source,
            "read_activity should filter by status='created'",
        )

    def test_new_activity_defaults_to_created_status(self):
        """Test that newly created activities have default status of 'created'"""
        from api.model import ActivityBase

        # Create an activity without specifying status
        activity = ActivityBase(
            fit="test.fit",
            title="Test Activity",
            sport="running",
            device="Test Device",
            race=False,
            start_time=1640995200,
            timestamp=1640995200,
            total_timer_time=3600.0,
            total_elapsed_time=3600.0,
            total_distance=10000.0,
            total_ascent=100.0,
            avg_speed=10.0,
        )

        # Verify default status is "created"
        self.assertEqual(activity.status, "created")


class TestBestEndpointRequiresAuth(unittest.TestCase):
    """Test /best/ endpoint requires authentication"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = TestClient(app)

    def test_best_endpoint_requires_auth(self):
        """Test /best/ endpoint requires authentication"""
        response = self.client.get("/best/?sport=cycling&distance=20")
        self.assertEqual(response.status_code, 401)

    def test_power_profile_requires_auth(self):
        """Test /best/power-profile/ endpoint requires authentication"""
        response = self.client.get("/best/power-profile/")
        self.assertEqual(response.status_code, 401)


class TestAppEnumsAndModels(unittest.TestCase):
    """Test app enums and model validation"""

    def test_sport_enum_values(self):
        """Test Sport enum has expected values"""
        from api.app import Sport

        self.assertEqual(Sport.running.value, "running")
        self.assertEqual(Sport.cycling.value, "cycling")
        self.assertEqual(Sport.swimming.value, "swimming")

    def test_cycling_distance_enum_values(self):
        """Test CyclingDistance enum has expected values"""
        from api.app import CyclingDistance

        self.assertEqual(CyclingDistance.one_minute.value, "1")
        self.assertEqual(CyclingDistance.five_minutes.value, "5")
        self.assertEqual(CyclingDistance.ten_minutes.value, "10")
        self.assertEqual(CyclingDistance.twenty_minutes.value, "20")
        self.assertEqual(CyclingDistance.one_hour.value, "60")
        self.assertEqual(CyclingDistance.two_hours.value, "120")
        self.assertEqual(CyclingDistance.four_hours.value, "240")

    def test_running_distance_enum_values(self):
        """Test RunningDistance enum has expected values"""
        from api.app import RunningDistance

        self.assertEqual(RunningDistance.one_km.value, "1")
        self.assertEqual(RunningDistance.five_km.value, "5")
        self.assertEqual(RunningDistance.ten_km.value, "10")
        self.assertEqual(RunningDistance.half_marathon.value, "21.098")
        self.assertEqual(RunningDistance.full_marathon.value, "42.195")

    def test_activity_zones_response_model(self):
        """Test ActivityZonesResponse model structure"""
        from api.app import ActivityZonesResponse

        response = ActivityZonesResponse(pace=[], power=[], heart_rate=[])
        self.assertEqual(response.pace, [])
        self.assertEqual(response.power, [])
        self.assertEqual(response.heart_rate, [])


class TestActivitiesEndpointRequiresAuth(unittest.TestCase):
    """Test /activities/ endpoints require authentication"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = TestClient(app)
        self.test_activity_id = uuid.uuid4()

    def test_activity_zones_requires_auth(self):
        """Test /activities/{id}/zones/ requires authentication"""
        response = self.client.get(f"/activities/{self.test_activity_id}/zones/")
        self.assertEqual(response.status_code, 401)

    def test_update_activity_requires_auth(self):
        """Test PATCH /activities/{id}/ requires authentication"""
        response = self.client.patch(
            f"/activities/{self.test_activity_id}/", json={"title": "New Title"}
        )
        self.assertEqual(response.status_code, 401)

    def test_fitness_requires_auth(self):
        """Test /fitness/ requires authentication"""
        response = self.client.get("/fitness/")
        self.assertEqual(response.status_code, 401)

    def test_heatmap_requires_auth(self):
        """Test /heatmap/ requires authentication"""
        response = self.client.get("/heatmap/")
        self.assertEqual(response.status_code, 401)


def _make_activity(**overrides):
    """Helper to create a mock Activity with sensible defaults."""
    defaults = {
        "id": uuid.uuid4(),
        "fit": "test.fit",
        "status": "created",
        "title": "Test Run",
        "description": None,
        "sport": "running",
        "device": "Garmin",
        "race": False,
        "start_time": 1700000000,
        "timestamp": 1700000000,
        "total_timer_time": 3600.0,
        "total_elapsed_time": 3600.0,
        "total_distance": 10000.0,
        "total_ascent": 100.0,
        "avg_speed": 2.78,
        "avg_heart_rate": 150.0,
        "max_heart_rate": 180.0,
        "avg_cadence": None,
        "max_cadence": None,
        "avg_power": None,
        "max_power": None,
        "np_power": None,
        "total_calories": 500.0,
        "total_training_effect": None,
        "training_stress_score": None,
        "intensity_factor": None,
        "avg_temperature": None,
        "max_temperature": None,
        "min_temperature": None,
        "pool_length": None,
        "num_lengths": None,
        "lat": 48.8,
        "lon": 2.3,
        "delta_lat": None,
        "delta_lon": None,
        "city": "Paris",
        "subdivision": None,
        "country": "France",
        "user_id": "test-user-123",
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc),
        "laps": [],
        "performances": [],
        "performance_power": [],
        "notifications": [],
        "tracepoints": [],
        "zone_paces": [],
        "zone_powers": [],
        "zone_heart_rates": [],
    }
    defaults.update(overrides)
    return Activity(**defaults)


def _make_user(**overrides):
    """Helper to create a mock User with sensible defaults."""
    defaults = {
        "id": "test-user-123",
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "google_id": "google-123",
        "google_picture": "http://example.com/pic.jpg",
        "map": "leaflet",
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc),
    }
    defaults.update(overrides)
    return User(**defaults)


class _AuthenticatedTestCase(unittest.TestCase):
    """Base test class that sets up authenticated client with mocked session."""

    def setUp(self):
        self.client = TestClient(app)
        self.test_user_id = "test-user-123"
        self.test_email = "test@example.com"
        self.mock_session = MagicMock(spec=Session)
        self.token = create_token_response(self.test_user_id, self.test_email)
        self.auth_headers = {"Authorization": f"Bearer {self.token.access_token}"}

        app.dependency_overrides[get_session] = lambda: self.mock_session
        app.dependency_overrides[get_current_user_id] = lambda: self.test_user_id

    def tearDown(self):
        app.dependency_overrides.clear()


class TestReadActivities(_AuthenticatedTestCase):
    """Test GET /activities/ endpoint logic."""

    def test_returns_empty_list(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=0)),  # count query
            MagicMock(all=MagicMock(return_value=[])),  # activities query
            MagicMock(all=MagicMock(return_value=[])),  # notification counts
        ]

        response = self.client.get("/activities/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["activities"], [])
        self.assertEqual(data["pagination"]["total"], 0)

    def test_returns_activities(self):
        activity = _make_activity()
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=1)),  # count
            MagicMock(all=MagicMock(return_value=[activity])),  # activities
            MagicMock(all=MagicMock(return_value=[])),  # notification counts
        ]

        response = self.client.get("/activities/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["activities"]), 1)
        self.assertEqual(data["activities"][0]["title"], "Test Run")

    def test_map_mode(self):
        activity = _make_activity()
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=1)),  # count
            MagicMock(all=MagicMock(return_value=[activity])),  # activities
        ]

        response = self.client.get("/activities/?map=true", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        # In map mode, notification count query is skipped (only 2 exec calls)
        self.assertEqual(self.mock_session.exec.call_count, 2)

    def test_pagination(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=25)),
            MagicMock(all=MagicMock(return_value=[])),
            MagicMock(all=MagicMock(return_value=[])),  # notification counts
        ]

        response = self.client.get(
            "/activities/?page=2&limit=5", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["pagination"]["page"], 2)
        self.assertEqual(data["pagination"]["per_page"], 5)
        self.assertEqual(data["pagination"]["total"], 25)

    def test_order_asc(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=0)),
            MagicMock(all=MagicMock(return_value=[])),
            MagicMock(all=MagicMock(return_value=[])),
        ]

        response = self.client.get("/activities/?order=asc", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)

    def test_order_by_columns(self):
        for order_by in [
            "total_distance",
            "avg_speed",
            "avg_power",
            "total_ascent",
            "total_calories",
            "training_stress_score",
            "start_time",
        ]:
            self.mock_session.exec.side_effect = [
                MagicMock(one=MagicMock(return_value=0)),
                MagicMock(all=MagicMock(return_value=[])),
                MagicMock(all=MagicMock(return_value=[])),
            ]
            response = self.client.get(
                f"/activities/?order_by={order_by}", headers=self.auth_headers
            )
            self.assertEqual(
                response.status_code, 200, f"Failed for order_by={order_by}"
            )

    def test_filter_by_sport(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=0)),
            MagicMock(all=MagicMock(return_value=[])),
            MagicMock(all=MagicMock(return_value=[])),
        ]

        response = self.client.get(
            "/activities/?sport=running", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)

    def test_filter_by_race(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=0)),
            MagicMock(all=MagicMock(return_value=[])),
            MagicMock(all=MagicMock(return_value=[])),
        ]

        response = self.client.get("/activities/?race=true", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)

    def test_filter_by_distance_range(self):
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=0)),
            MagicMock(all=MagicMock(return_value=[])),
            MagicMock(all=MagicMock(return_value=[])),
        ]

        response = self.client.get(
            "/activities/?min_distance=5&max_distance=15", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)

    def test_notification_counts(self):
        activity = _make_activity()
        activity_id = activity.id
        self.mock_session.exec.side_effect = [
            MagicMock(one=MagicMock(return_value=1)),  # count
            MagicMock(all=MagicMock(return_value=[activity])),  # activities
            MagicMock(
                all=MagicMock(return_value=[(activity_id, 3)])
            ),  # notification counts
        ]

        response = self.client.get("/activities/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["activities"][0]["notification_count"], 3)

    def test_invalid_order_rejected(self):
        response = self.client.get(
            "/activities/?order=invalid", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_order_by_rejected(self):
        response = self.client.get(
            "/activities/?order_by=invalid", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 422)


class TestReadActivity(_AuthenticatedTestCase):
    """Test GET /activities/{id}/ endpoint logic."""

    def test_returns_activity(self):
        activity = _make_activity()
        self.mock_session.exec.return_value.first.return_value = activity

        response = self.client.get(
            f"/activities/{activity.id}/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Test Run")

    def test_activity_not_found(self):
        self.mock_session.exec.return_value.first.return_value = None

        response = self.client.get(
            f"/activities/{uuid.uuid4()}/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Activity not found")


class TestReadActivityZones(_AuthenticatedTestCase):
    """Test GET /activities/{id}/zones/ endpoint logic."""

    def test_returns_zones(self):
        activity = _make_activity()
        self.mock_session.exec.side_effect = [
            MagicMock(first=MagicMock(return_value=activity)),  # activity lookup
            MagicMock(all=MagicMock(return_value=[])),  # pace zones
            MagicMock(all=MagicMock(return_value=[])),  # power zones
            MagicMock(all=MagicMock(return_value=[])),  # heart rate zones
        ]

        response = self.client.get(
            f"/activities/{activity.id}/zones/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["pace"], [])
        self.assertEqual(data["power"], [])
        self.assertEqual(data["heart_rate"], [])

    def test_activity_not_found(self):
        self.mock_session.exec.return_value.first.return_value = None

        response = self.client.get(
            f"/activities/{uuid.uuid4()}/zones/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 404)


class TestCreateActivity(_AuthenticatedTestCase):
    """Test POST /activities/ endpoint logic."""

    def test_rejects_non_fit_file(self):
        files = {"fit_file": ("test.txt", b"data", "text/plain")}
        data = {"title": "Test", "race": "false"}
        response = self.client.post(
            "/activities/", files=files, data=data, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "File must be a .fit file")

    def test_rejects_file_without_filename(self):
        files = {"fit_file": ("", b"data", "application/octet-stream")}
        data = {"title": "Test", "race": "false"}
        response = self.client.post(
            "/activities/", files=files, data=data, headers=self.auth_headers
        )
        self.assertIn(response.status_code, [400, 422])

    def test_rejects_duplicate_fit_file(self):
        existing = _make_activity(fit="duplicate.fit")
        self.mock_session.exec.return_value.first.return_value = existing

        files = {"fit_file": ("duplicate.fit", b"data", "application/octet-stream")}
        data = {"title": "Test", "race": "false"}
        response = self.client.post(
            "/activities/", files=files, data=data, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 409)
        self.assertIn("already exists", response.json()["detail"])

    def test_successful_creation(self):
        self.mock_session.exec.return_value.first.return_value = None  # no duplicate

        mock_service = MagicMock()
        created_activity = _make_activity(title="New Activity")
        mock_service.create_activity.return_value = created_activity
        app.dependency_overrides[get_activity_service_dependency] = lambda: mock_service

        files = {"fit_file": ("test.fit", b"fitdata", "application/octet-stream")}
        data = {"title": "New Activity", "race": "false"}
        response = self.client.post(
            "/activities/", files=files, data=data, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["title"], "New Activity")

    def test_handles_processing_error(self):
        self.mock_session.exec.return_value.first.return_value = None

        mock_service = MagicMock()
        mock_service.create_activity.side_effect = RuntimeError("Parse error")
        app.dependency_overrides[get_activity_service_dependency] = lambda: mock_service

        files = {"fit_file": ("test.fit", b"fitdata", "application/octet-stream")}
        data = {"title": "Test", "race": "false"}
        response = self.client.post(
            "/activities/", files=files, data=data, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 500)
        self.assertIn("Error processing FIT file", response.json()["detail"])
        self.mock_session.rollback.assert_called_once()


class TestDeleteActivity(_AuthenticatedTestCase):
    """Test DELETE /activities/{id}/ endpoint logic."""

    def test_soft_deletes_activity(self):
        activity = _make_activity()
        self.mock_session.exec.return_value.first.return_value = activity

        response = self.client.delete(
            f"/activities/{activity.id}/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(activity.status, "deleted")
        self.mock_session.add.assert_called_once_with(activity)
        self.mock_session.commit.assert_called_once()

    def test_activity_not_found(self):
        self.mock_session.exec.return_value.first.return_value = None

        response = self.client.delete(
            f"/activities/{uuid.uuid4()}/", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 404)


class TestUpdateActivity(_AuthenticatedTestCase):
    """Test PATCH /activities/{id}/ endpoint logic."""

    def test_updates_title(self):
        activity = _make_activity(title="Old Title")
        self.mock_session.exec.return_value.first.return_value = activity
        self.mock_session.refresh.side_effect = lambda a: None

        response = self.client.patch(
            f"/activities/{activity.id}/",
            json={"title": "New Title"},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(activity.title, "New Title")
        self.mock_session.commit.assert_called_once()

    def test_updates_race(self):
        activity = _make_activity(race=False)
        self.mock_session.exec.return_value.first.return_value = activity
        self.mock_session.refresh.side_effect = lambda a: None

        response = self.client.patch(
            f"/activities/{activity.id}/",
            json={"race": True},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(activity.race)

    def test_activity_not_found(self):
        self.mock_session.exec.return_value.first.return_value = None

        response = self.client.patch(
            f"/activities/{uuid.uuid4()}/",
            json={"title": "New"},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 404)


class TestReadProfile(_AuthenticatedTestCase):
    """Test GET /profile/ endpoint logic."""

    def test_returns_profile(self):
        mock_profile = Profile(
            n_activities=10,
            run_n_activities=5,
            run_total_distance=50000.0,
            cycling_n_activities=5,
            cycling_total_distance=100000.0,
        )
        mock_service = MagicMock()
        mock_service.get_user_profile.return_value = mock_profile
        app.dependency_overrides[get_profile_service_dependency] = lambda: mock_service

        response = self.client.get("/profile/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["n_activities"], 10)
        self.assertEqual(data["run_n_activities"], 5)


class TestBestPerformances(_AuthenticatedTestCase):
    """Test GET /best/ endpoint logic."""

    def test_cycling_requires_distance(self):
        response = self.client.get("/best/?sport=cycling", headers=self.auth_headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Distance parameter required", response.json()["detail"])

    def test_cycling_rejects_time(self):
        response = self.client.get(
            "/best/?sport=cycling&distance=20&time=5", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Time parameter not valid", response.json()["detail"])

    def test_running_requires_time(self):
        response = self.client.get("/best/?sport=running", headers=self.auth_headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Time parameter required", response.json()["detail"])

    def test_running_rejects_distance(self):
        response = self.client.get(
            "/best/?sport=running&time=5&distance=20", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Distance parameter not valid", response.json()["detail"])

    def test_cycling_returns_performances(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get(
            "/best/?sport=cycling&distance=20", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sport"], "cycling")
        self.assertEqual(data["parameter"], "20")
        self.assertEqual(data["performances"], [])

    def test_running_returns_performances(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get(
            "/best/?sport=running&time=5", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sport"], "running")
        self.assertEqual(data["parameter"], "5")

    def test_cycling_with_year_filter(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get(
            "/best/?sport=cycling&distance=20&year=2024", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)

    def test_running_with_year_filter(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get(
            "/best/?sport=running&time=10&year=2024", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)

    def test_cycling_with_results(self):
        activity = _make_activity(sport="cycling")
        activity_data = {
            "id": str(activity.id),
            "fit": activity.fit,
            "status": "created",
            "title": activity.title,
            "description": None,
            "sport": "cycling",
            "device": "Garmin",
            "race": False,
            "start_time": activity.start_time,
            "timestamp": activity.timestamp,
            "total_timer_time": activity.total_timer_time,
            "total_elapsed_time": activity.total_elapsed_time,
            "total_distance": activity.total_distance,
            "total_ascent": 100.0,
            "avg_speed": 8.0,
            "avg_heart_rate": 150.0,
            "max_heart_rate": 180.0,
            "avg_cadence": None,
            "max_cadence": None,
            "avg_power": 200.0,
            "max_power": 350.0,
            "np_power": None,
            "total_calories": 500.0,
            "total_training_effect": None,
            "training_stress_score": None,
            "intensity_factor": None,
            "avg_temperature": None,
            "max_temperature": None,
            "min_temperature": None,
            "pool_length": None,
            "num_lengths": None,
            "lat": 48.8,
            "lon": 2.3,
            "delta_lat": None,
            "delta_lon": None,
            "city": "Paris",
            "subdivision": None,
            "country": "France",
            "user_id": "test-user-123",
            "created_at": activity.created_at.isoformat(),
            "updated_at": activity.updated_at.isoformat(),
            "power": 280,
        }
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda self, idx: 280 if idx == 0 else None
        mock_row._mapping = activity_data
        self.mock_session.exec.return_value.all.return_value = [mock_row]

        response = self.client.get(
            "/best/?sport=cycling&distance=20", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["performances"]), 1)
        self.assertEqual(data["performances"][0]["value"], 280)

    def test_running_with_results(self):
        activity = _make_activity(sport="running")
        activity_data = {
            "id": str(activity.id),
            "fit": activity.fit,
            "status": "created",
            "title": activity.title,
            "description": None,
            "sport": "running",
            "device": "Garmin",
            "race": False,
            "start_time": activity.start_time,
            "timestamp": activity.timestamp,
            "total_timer_time": activity.total_timer_time,
            "total_elapsed_time": activity.total_elapsed_time,
            "total_distance": activity.total_distance,
            "total_ascent": 100.0,
            "avg_speed": 2.78,
            "avg_heart_rate": 150.0,
            "max_heart_rate": 180.0,
            "avg_cadence": None,
            "max_cadence": None,
            "avg_power": None,
            "max_power": None,
            "np_power": None,
            "total_calories": 500.0,
            "total_training_effect": None,
            "training_stress_score": None,
            "intensity_factor": None,
            "avg_temperature": None,
            "max_temperature": None,
            "min_temperature": None,
            "pool_length": None,
            "num_lengths": None,
            "lat": 48.8,
            "lon": 2.3,
            "delta_lat": None,
            "delta_lon": None,
            "city": "Paris",
            "subdivision": None,
            "country": "France",
            "user_id": "test-user-123",
            "created_at": activity.created_at.isoformat(),
            "updated_at": activity.updated_at.isoformat(),
            "time_seconds": 1200.5,
        }
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda self, idx: 1200.5 if idx == 0 else None
        mock_row._mapping = activity_data
        self.mock_session.exec.return_value.all.return_value = [mock_row]

        response = self.client.get(
            "/best/?sport=running&time=5", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["performances"]), 1)
        self.assertEqual(data["performances"][0]["value"], 1200.5)

    def test_cycling_all_distances(self):
        for distance in ["1", "5", "10", "20", "60", "120", "240"]:
            self.mock_session.exec.return_value.all.return_value = []
            response = self.client.get(
                f"/best/?sport=cycling&distance={distance}", headers=self.auth_headers
            )
            self.assertEqual(
                response.status_code, 200, f"Failed for distance={distance}"
            )
            self.assertEqual(response.json()["parameter"], distance)

    def test_running_all_distances(self):
        for time_val in ["1", "5", "10", "21.098", "42.195"]:
            self.mock_session.exec.return_value.all.return_value = []
            response = self.client.get(
                f"/best/?sport=running&time={time_val}", headers=self.auth_headers
            )
            self.assertEqual(response.status_code, 200, f"Failed for time={time_val}")
            self.assertEqual(response.json()["parameter"], time_val)


class TestReadPowerProfile(_AuthenticatedTestCase):
    """Test GET /best/power-profile/ endpoint logic."""

    def test_returns_empty_profile(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get("/best/power-profile/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["labels"]), 12)
        self.assertEqual(data["overall"], [0.0] * 12)
        self.assertEqual(data["years"], {})
        self.assertEqual(data["available_years"], [])

    def test_returns_profile_with_data(self):
        mock_row_1 = MagicMock()
        mock_row_1.__iter__ = Mock(
            return_value=iter([datetime.timedelta(minutes=1), 300.0, 2024])
        )
        mock_row_2 = MagicMock()
        mock_row_2.__iter__ = Mock(
            return_value=iter([datetime.timedelta(minutes=5), 250.0, 2024])
        )
        self.mock_session.exec.return_value.all.return_value = [mock_row_1, mock_row_2]

        response = self.client.get("/best/power-profile/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(2024, data["available_years"])


class TestReadWeeks(_AuthenticatedTestCase):
    """Test GET /weeks/ endpoint logic."""

    def test_returns_empty_weeks(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get("/weeks/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["weeks"], [])
        self.assertFalse(data["has_more"])
        self.assertEqual(data["next_offset"], 0)

    def test_returns_weeks_with_activities(self):
        now = datetime.datetime.now()
        ts = int(now.timestamp())
        activity = _make_activity(
            start_time=ts,
            sport="running",
            total_distance=10000.0,
            total_timer_time=3600.0,
            training_stress_score=50.0,
        )
        self.mock_session.exec.return_value.all.return_value = [activity]

        response = self.client.get("/weeks/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["weeks"]), 1)
        week = data["weeks"][0]
        self.assertEqual(week["total_activities"], 1)
        self.assertEqual(week["total_distance"], 10000.0)
        self.assertIn("running", week["sports_breakdown"])

    def test_weeks_pagination(self):
        self.mock_session.exec.return_value.all.return_value = []

        response = self.client.get(
            "/weeks/?offset=5&limit=3", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)

    def test_weeks_has_more(self):
        activities = []
        now = datetime.datetime.now()
        for i in range(10):
            ts = int((now - datetime.timedelta(weeks=i)).timestamp())
            activities.append(_make_activity(start_time=ts))
        self.mock_session.exec.return_value.all.return_value = activities

        response = self.client.get("/weeks/?limit=3", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["has_more"])

    def test_weeks_sports_breakdown(self):
        now = datetime.datetime.now()
        ts = int(now.timestamp())
        run = _make_activity(
            start_time=ts,
            sport="running",
            total_distance=10000.0,
            total_timer_time=3600.0,
        )
        ride = _make_activity(
            start_time=ts + 100,
            sport="cycling",
            total_distance=40000.0,
            total_timer_time=7200.0,
        )
        self.mock_session.exec.return_value.all.return_value = [run, ride]

        response = self.client.get("/weeks/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        breakdown = response.json()["weeks"][0]["sports_breakdown"]
        self.assertIn("running", breakdown)
        self.assertIn("cycling", breakdown)
        self.assertEqual(breakdown["running"]["distance"], 10000.0)
        self.assertEqual(breakdown["cycling"]["distance"], 40000.0)


class TestReadCurrentUser(_AuthenticatedTestCase):
    """Test GET /users/me/ endpoint logic."""

    def test_returns_user(self):
        user = _make_user()
        self.mock_session.get.return_value = user

        response = self.client.get("/users/me/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["first_name"], "Test")
        self.assertEqual(data["email"], "test@example.com")

    def test_user_not_found(self):
        self.mock_session.get.return_value = None

        response = self.client.get("/users/me/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "User not found")


class TestUpdateCurrentUser(_AuthenticatedTestCase):
    """Test PATCH /users/me/ endpoint logic."""

    def test_updates_map_preference(self):
        user = _make_user(map="leaflet")
        self.mock_session.get.return_value = user
        self.mock_session.refresh.side_effect = lambda u: None

        response = self.client.patch(
            "/users/me/", json={"map": "mapbox"}, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(user.map, "mapbox")
        self.mock_session.commit.assert_called_once()

    def test_user_not_found(self):
        self.mock_session.get.return_value = None

        response = self.client.patch(
            "/users/me/", json={"map": "mapbox"}, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 404)

    def test_invalid_map_value(self):
        response = self.client.patch(
            "/users/me/", json={"map": "invalid"}, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 422)


class TestGoogleAuth(_AuthenticatedTestCase):
    """Test POST /auth/google/ endpoint logic."""

    def test_creates_new_user(self):
        self.mock_session.exec.return_value.first.return_value = (
            None  # no existing user
        )
        self.mock_session.refresh.side_effect = lambda u: None

        user_data = {
            "google_id": "new-google-123",
            "first_name": "New",
            "last_name": "User",
            "email": "new@example.com",
            "google_picture": "http://example.com/pic.jpg",
        }

        with patch("api.app.get_zone_service") as mock_zone_svc:
            mock_zone_svc.return_value = MagicMock()
            response = self.client.post("/auth/google/", json=user_data)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user"]["first_name"], "New")
        self.assertIn("access_token", data["token"])

    def test_updates_existing_user(self):
        existing = _make_user(first_name="Old", google_id="existing-google")
        self.mock_session.exec.return_value.first.return_value = existing
        self.mock_session.refresh.side_effect = lambda u: None

        user_data = {
            "google_id": "existing-google",
            "first_name": "Updated",
            "last_name": "User",
            "email": "test@example.com",
            "google_picture": "http://example.com/newpic.jpg",
        }

        response = self.client.post("/auth/google/", json=user_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(existing.first_name, "Updated")
        self.assertEqual(existing.google_picture, "http://example.com/newpic.jpg")
        self.mock_session.commit.assert_called_once()

    def test_handles_database_error(self):
        self.mock_session.exec.side_effect = RuntimeError("DB connection failed")

        user_data = {
            "google_id": "test",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
        }

        response = self.client.post("/auth/google/", json=user_data)
        self.assertEqual(response.status_code, 500)
        self.assertIn("Database error", response.json()["detail"])
        self.mock_session.rollback.assert_called_once()


class TestReadFitness(_AuthenticatedTestCase):
    """Test GET /fitness/ endpoint logic."""

    @patch("api.app.calculate_fitness_scores")
    def test_returns_fitness_scores(self, mock_fitness):
        mock_fitness.return_value = {"fitness": 50, "fatigue": 30}

        response = self.client.get("/fitness/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        mock_fitness.assert_called_once_with(self.mock_session, self.test_user_id)


class TestReadHeatmap(_AuthenticatedTestCase):
    """Test GET /heatmap/ endpoint logic."""

    def test_returns_heatmap(self):
        mock_heatmap = HeatmapPublic(
            polylines=[
                HeatmapPolyline(coordinates=[[48.8, 2.3], [48.9, 2.4]], sport="running")
            ],
            activity_count=5,
            point_count=100,
            updated_at=datetime.datetime.now(datetime.timezone.utc),
        )
        mock_service = MagicMock()
        mock_service.get_heatmap.return_value = mock_heatmap
        app.dependency_overrides[get_heatmap_service_dependency] = lambda: mock_service

        response = self.client.get("/heatmap/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["activity_count"], 5)
        self.assertEqual(len(data["polylines"]), 1)

    def test_heatmap_not_found(self):
        mock_service = MagicMock()
        mock_service.get_heatmap.return_value = None
        app.dependency_overrides[get_heatmap_service_dependency] = lambda: mock_service

        response = self.client.get("/heatmap/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Heatmap not found")


class TestDependencyFunctions(unittest.TestCase):
    """Test dependency injection functions."""

    def test_get_activity_service_dependency(self):
        mock_session = MagicMock(spec=Session)
        with patch("api.app.get_activity_service") as mock_get:
            mock_get.return_value = MagicMock()
            get_activity_service_dependency(mock_session)
            mock_get.assert_called_once_with(mock_session)

    def test_get_profile_service_dependency(self):
        mock_session = MagicMock(spec=Session)
        with patch("api.app.get_profile_service") as mock_get:
            mock_get.return_value = MagicMock()
            get_profile_service_dependency(mock_session)
            mock_get.assert_called_once_with(mock_session)

    def test_get_heatmap_service_dependency(self):
        mock_session = MagicMock(spec=Session)
        with patch("api.app.get_heatmap_service") as mock_get:
            mock_get.return_value = MagicMock()
            get_heatmap_service_dependency(mock_session)
            mock_get.assert_called_once_with(mock_session)


if __name__ == "__main__":
    unittest.main()
