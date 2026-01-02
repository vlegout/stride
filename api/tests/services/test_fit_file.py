import os
import tempfile
import uuid
from unittest.mock import Mock, patch

import pytest
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from api.model import Activity, SQLModel
from api.services.fit_file import FitFileService


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def fit_file_service(session):
    return FitFileService(session)


def test_get_fit_file_path_exists_locally(session, fit_file_service):
    with tempfile.TemporaryDirectory() as tmpdir:
        fit_filename = "test.fit"
        fit_path = os.path.join(tmpdir, fit_filename)

        with open(fit_path, "w") as f:
            f.write("test data")

        activity = Activity(
            id=uuid.uuid4(),
            fit=fit_filename,
            sport="running",
            timestamp=1234567890,
        )

        path, downloaded = fit_file_service.get_fit_file_path(
            activity, tmpdir, download_from_s3=False
        )

        assert path == fit_path
        assert downloaded is False


def test_get_fit_file_path_not_found(session, fit_file_service):
    with tempfile.TemporaryDirectory() as tmpdir:
        activity = Activity(
            id=uuid.uuid4(),
            fit="nonexistent.fit",
            sport="running",
            timestamp=1234567890,
        )

        path, downloaded = fit_file_service.get_fit_file_path(
            activity, tmpdir, download_from_s3=False
        )

        assert path is None
        assert downloaded is False


def test_get_fit_file_path_path_traversal_detected(session, fit_file_service):
    with tempfile.TemporaryDirectory() as tmpdir:
        activity = Activity(
            id=uuid.uuid4(),
            fit="../../../etc/passwd",
            sport="running",
            timestamp=1234567890,
        )

        with pytest.raises(ValueError, match="path traversal detected"):
            fit_file_service.get_fit_file_path(activity, tmpdir, download_from_s3=False)


def test_get_fit_file_path_download_from_s3(session):
    mock_storage = Mock()
    mock_storage.download_file = Mock()

    fit_file_service = FitFileService(session, mock_storage)

    with tempfile.TemporaryDirectory() as tmpdir:
        activity = Activity(
            id=uuid.uuid4(),
            fit="test.fit",
            sport="running",
            timestamp=1234567890,
        )

        path, downloaded = fit_file_service.get_fit_file_path(
            activity, tmpdir, download_from_s3=True
        )

        assert path == os.path.join(tmpdir, "test.fit")
        assert downloaded is True
        mock_storage.download_file.assert_called_once_with(
            "data/fit/test.fit", os.path.join(tmpdir, "test.fit")
        )


def test_get_fit_file_path_s3_traversal_blocked(session):
    mock_storage = Mock()
    fit_file_service = FitFileService(session, mock_storage)

    with tempfile.TemporaryDirectory() as tmpdir:
        activity = Activity(
            id=uuid.uuid4(),
            fit="../bad.fit",
            sport="running",
            timestamp=1234567890,
        )

        with pytest.raises(ValueError, match="path traversal"):
            fit_file_service.get_fit_file_path(activity, tmpdir, download_from_s3=True)


def test_read_fit_file_direct(session, fit_file_service):
    mock_activity = Activity(
        id=uuid.uuid4(), fit="test.fit", sport="running", timestamp=1234567890
    )

    with patch("api.services.fit_file.get_activity_from_fit") as mock_get:
        mock_get.return_value = (mock_activity, [], [])

        activity, laps, tracepoints = fit_file_service.read_fit_file("test.fit")

        assert activity == mock_activity
        assert laps == []
        assert tracepoints == []
        mock_get.assert_called_once_with(session, "test.fit", "Activity", "", False)
