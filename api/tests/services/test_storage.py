from unittest.mock import Mock, patch

import pytest
from botocore.exceptions import ClientError

from api.services.exceptions import StorageServiceError
from api.services.storage import StorageService


class TestStorageService:
    def test_init_uses_bucket_from_config(self):
        service = StorageService()
        assert service.bucket == "test-bucket"

    @patch("api.services.storage.boto3.client")
    def test_client_lazy_initialization(self, mock_boto_client):
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        assert service._client is None

        client = service.client
        assert client == mock_s3
        assert mock_boto_client.called

        client2 = service.client
        assert client2 == mock_s3
        assert mock_boto_client.call_count == 1

    @patch("api.services.storage.boto3.client")
    def test_upload_file_success(self, mock_boto_client):
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        service.upload_file("/tmp/test.fit", "data/fit/test.fit")

        mock_s3.upload_file.assert_called_once_with(
            "/tmp/test.fit", "test-bucket", "data/fit/test.fit"
        )

    @patch("api.services.storage.boto3.client")
    def test_upload_file_client_error(self, mock_boto_client):
        mock_s3 = Mock()
        mock_s3.upload_file.side_effect = ClientError(
            {"Error": {"Code": "500", "Message": "Server Error"}}, "upload_file"
        )
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        with pytest.raises(
            StorageServiceError, match="Failed to upload file to object storage"
        ):
            service.upload_file("/tmp/test.fit", "data/fit/test.fit")

    @patch("api.services.storage.boto3.client")
    def test_upload_content_success(self, mock_boto_client):
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        service.upload_content("test content", "data/test.txt", "text/plain")

        mock_s3.put_object.assert_called_once_with(
            Bucket="test-bucket",
            Key="data/test.txt",
            Body=b"test content",
            ContentType="text/plain",
        )

    @patch("api.services.storage.boto3.client")
    def test_upload_content_default_content_type(self, mock_boto_client):
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        service.upload_content("test", "data/test.txt")

        call_args = mock_s3.put_object.call_args[1]
        assert call_args["ContentType"] == "text/plain"

    @patch("api.services.storage.boto3.client")
    def test_upload_content_client_error(self, mock_boto_client):
        mock_s3 = Mock()
        mock_s3.put_object.side_effect = ClientError(
            {"Error": {"Code": "500", "Message": "Server Error"}}, "put_object"
        )
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        with pytest.raises(
            StorageServiceError, match="Failed to upload content to object storage"
        ):
            service.upload_content("test", "data/test.txt")

    @patch("api.services.storage.boto3.client")
    @patch("api.services.storage.generate_random_string")
    @patch("api.services.storage.datetime")
    def test_upload_activity_files(
        self, mock_datetime, mock_random_string, mock_boto_client
    ):
        mock_now = Mock()
        mock_now.year = 2024
        mock_now.month = 3
        mock_datetime.datetime.now.return_value = mock_now

        mock_random_string.return_value = "abc12345"

        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3

        service = StorageService()
        service.upload_activity_files("/tmp/test.fit", "test.fit", "Morning Run", True)

        assert mock_s3.upload_file.call_count == 1
        upload_file_call = mock_s3.upload_file.call_args[0]
        assert upload_file_call[0] == "/tmp/test.fit"
        assert upload_file_call[1] == "test-bucket"
        assert upload_file_call[2] == "data/fit/test.fit"

        assert mock_s3.put_object.call_count == 1
        put_object_call = mock_s3.put_object.call_args[1]
        assert put_object_call["Key"] == "data/2024/03/abc12345.yaml"
        assert put_object_call["ContentType"] == "text/yaml"
        assert b"fit: test.fit" in put_object_call["Body"]
        assert b"title: Morning Run" in put_object_call["Body"]
        assert b"race: true" in put_object_call["Body"]
