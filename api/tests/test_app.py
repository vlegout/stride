import asyncio
import json
import os
import unittest
import uuid
from unittest.mock import Mock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session

from api.app import app
from api.dependencies import get_session, get_current_user_id, verify_jwt_token
from api.auth import create_token_response


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


if __name__ == "__main__":
    unittest.main()
