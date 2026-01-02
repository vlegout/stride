import datetime
import os

import boto3
import yaml
from botocore.exceptions import ClientError

from api.services.exceptions import StorageServiceError
from api.utils import generate_random_string


class StorageService:
    def __init__(self):
        self.bucket = os.environ.get("BUCKET")
        if not self.bucket:
            raise StorageServiceError("BUCKET environment variable not set")
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = boto3.client("s3")
        return self._client

    def upload_activity_files(
        self,
        fit_file_path: str,
        fit_filename: str,
        title: str,
        race: bool,
    ) -> None:
        fit_s3_key = f"data/fit/{fit_filename}"
        self.upload_file(fit_file_path, fit_s3_key)

        now = datetime.datetime.now()
        yaml_s3_key = f"data/{now.year}/{now.month:02d}/{generate_random_string()}.yaml"
        yaml_content = {"fit": fit_filename, "title": title, "race": race}
        yaml_string = yaml.dump(yaml_content, default_flow_style=False)
        self.upload_content(yaml_string, yaml_s3_key, content_type="text/yaml")

    def upload_file(self, file_path: str, s3_key: str) -> None:
        try:
            self.client.upload_file(file_path, self.bucket, s3_key)
        except ClientError as e:
            raise StorageServiceError(f"Failed to upload file to S3: {str(e)}") from e

    def upload_content(
        self,
        content: str,
        s3_key: str,
        content_type: str = "text/plain",
    ) -> None:
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=content.encode("utf-8"),
                ContentType=content_type,
            )
        except ClientError as e:
            raise StorageServiceError(
                f"Failed to upload content to S3: {str(e)}"
            ) from e

    def download_file(self, s3_key: str, local_path: str) -> None:
        try:
            self.client.download_file(self.bucket, s3_key, local_path)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "404" or error_code == "NoSuchKey":
                raise StorageServiceError(f"File not found in S3: {s3_key}") from e
            raise StorageServiceError(
                f"Failed to download file from S3: {str(e)}"
            ) from e
