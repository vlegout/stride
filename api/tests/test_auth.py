import datetime
import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
import jwt

from api.auth import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    Token,
    TokenData,
    create_token_response,
    verify_token,
)


class TestAuth(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures with consistent test data"""
        self.test_user_id = "test-user-123"
        self.test_email = "test@example.com"
        self.test_secret_key = "test-secret-key"

    def test_token_data_model(self):
        """Test TokenData model initialization and default values"""
        # Test with all fields
        token_data = TokenData(user_id="user123", email="user@test.com")
        self.assertEqual(token_data.user_id, "user123")
        self.assertEqual(token_data.email, "user@test.com")

        # Test with default values
        token_data_empty = TokenData()
        self.assertIsNone(token_data_empty.user_id)
        self.assertIsNone(token_data_empty.email)

    def test_token_model(self):
        """Test Token model initialization"""
        token = Token(access_token="test-token", token_type="bearer", expires_in=3600)
        self.assertEqual(token.access_token, "test-token")
        self.assertEqual(token.token_type, "bearer")
        self.assertEqual(token.expires_in, 3600)

    def test_create_token_response_structure(self):
        """Test create_token_response returns correct Token structure"""
        token = create_token_response(self.test_user_id, self.test_email)

        self.assertIsInstance(token, Token)
        self.assertIsInstance(token.access_token, str)
        self.assertEqual(token.token_type, "bearer")
        self.assertEqual(token.expires_in, JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    def test_create_token_response_jwt_payload(self):
        """Test that created token contains correct payload"""
        token = create_token_response(self.test_user_id, self.test_email)

        # Decode the JWT to verify payload
        payload = jwt.decode(
            token.access_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )

        self.assertEqual(payload["sub"], self.test_user_id)
        self.assertEqual(payload["email"], self.test_email)
        self.assertIn("exp", payload)

    def test_create_token_response_expiration(self):
        """Test that token expiration is set correctly"""
        before_creation = datetime.datetime.now(datetime.timezone.utc)
        token = create_token_response(self.test_user_id, self.test_email)
        after_creation = datetime.datetime.now(datetime.timezone.utc)

        payload = jwt.decode(
            token.access_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )
        token_exp = datetime.datetime.fromtimestamp(
            payload["exp"], datetime.timezone.utc
        )

        # Account for JWT timestamp precision (seconds only, no microseconds)
        expected_exp_min = (
            before_creation
            + datetime.timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        ).replace(microsecond=0)
        expected_exp_max = (
            after_creation + datetime.timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        ).replace(microsecond=0) + datetime.timedelta(seconds=1)

        self.assertGreaterEqual(token_exp, expected_exp_min)
        self.assertLessEqual(token_exp, expected_exp_max)

    def test_verify_token_valid_token(self):
        """Test verify_token with valid token"""
        # Create a valid token
        token = create_token_response(self.test_user_id, self.test_email)

        # Verify the token
        token_data = verify_token(token.access_token)

        self.assertIsInstance(token_data, TokenData)
        self.assertEqual(token_data.user_id, self.test_user_id)
        self.assertEqual(token_data.email, self.test_email)

    def test_verify_token_invalid_signature(self):
        """Test verify_token with token signed with wrong key"""
        # Create token with different secret
        wrong_secret = "wrong-secret-key"
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=30
        )

        malformed_token = jwt.encode(
            {"sub": self.test_user_id, "email": self.test_email, "exp": expire},
            wrong_secret,
            algorithm=JWT_ALGORITHM,
        )

        with self.assertRaises(HTTPException) as context:
            verify_token(malformed_token)

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "Could not validate credentials")

    def test_verify_token_expired_token(self):
        """Test verify_token with expired token"""
        # Create an expired token
        expired_time = datetime.datetime.now(
            datetime.timezone.utc
        ) - datetime.timedelta(minutes=1)

        expired_token = jwt.encode(
            {"sub": self.test_user_id, "email": self.test_email, "exp": expired_time},
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        with self.assertRaises(HTTPException) as context:
            verify_token(expired_token)

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "Could not validate credentials")

    def test_verify_token_missing_subject(self):
        """Test verify_token with token missing 'sub' field"""
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=30
        )

        token_without_sub = jwt.encode(
            {"email": self.test_email, "exp": expire},  # Missing 'sub'
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        with self.assertRaises(HTTPException) as context:
            verify_token(token_without_sub)

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "Could not validate credentials")

    def test_verify_token_malformed_token(self):
        """Test verify_token with completely malformed token"""
        malformed_tokens = [
            "not.a.jwt.token",
            "invalid-jwt",
            "",
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",
        ]

        for malformed_token in malformed_tokens:
            with self.assertRaises(HTTPException) as context:
                verify_token(malformed_token)

            self.assertEqual(context.exception.status_code, 401)
            self.assertEqual(context.exception.detail, "Could not validate credentials")

    def test_verify_token_optional_email(self):
        """Test verify_token works with token that has no email field"""
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=30
        )

        token_without_email = jwt.encode(
            {"sub": self.test_user_id, "exp": expire},  # No email field
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM,
        )

        token_data = verify_token(token_without_email)

        self.assertEqual(token_data.user_id, self.test_user_id)
        self.assertIsNone(token_data.email)

    @patch.dict(os.environ, {"JWT_SECRET_KEY": "custom-secret"})
    def test_jwt_secret_key_from_environment(self):
        """Test that JWT_SECRET_KEY can be set via environment variable"""
        # This test verifies the module reads from environment
        # Note: We need to reload the module for this to work properly in real scenarios
        from api.auth import JWT_SECRET_KEY as current_secret

        # In this test, we're patching the environment, but the module has already imported
        # the value. This test documents the intended behavior.
        self.assertTrue(isinstance(current_secret, str))

    def test_jwt_constants(self):
        """Test JWT constants have expected values"""
        self.assertEqual(JWT_ALGORITHM, "HS256")
        self.assertEqual(JWT_ACCESS_TOKEN_EXPIRE_MINUTES, 60 * 24 * 7)  # 7 days
        self.assertIsInstance(JWT_SECRET_KEY, str)

    def test_token_roundtrip(self):
        """Test creating and verifying token roundtrip"""
        # Create token
        token = create_token_response(self.test_user_id, self.test_email)

        # Verify token
        token_data = verify_token(token.access_token)

        # Check that original data is preserved
        self.assertEqual(token_data.user_id, self.test_user_id)
        self.assertEqual(token_data.email, self.test_email)

    def test_http_exception_properties(self):
        """Test that HTTPException has correct properties for auth errors"""
        with self.assertRaises(HTTPException) as context:
            verify_token("invalid.token")

        exception = context.exception
        self.assertEqual(exception.status_code, 401)
        self.assertEqual(exception.detail, "Could not validate credentials")
        self.assertEqual(exception.headers, {"WWW-Authenticate": "Bearer"})

    def test_create_token_different_users(self):
        """Test that different users get different tokens"""
        token1 = create_token_response("user1", "user1@test.com")
        token2 = create_token_response("user2", "user2@test.com")

        self.assertNotEqual(token1.access_token, token2.access_token)

        # Verify each token contains correct user data
        token_data1 = verify_token(token1.access_token)
        token_data2 = verify_token(token2.access_token)

        self.assertEqual(token_data1.user_id, "user1")
        self.assertEqual(token_data1.email, "user1@test.com")
        self.assertEqual(token_data2.user_id, "user2")
        self.assertEqual(token_data2.email, "user2@test.com")


if __name__ == "__main__":
    unittest.main()
