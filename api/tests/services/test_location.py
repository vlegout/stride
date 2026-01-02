import datetime
import uuid
from unittest.mock import Mock, patch

import httpx
import pytest
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool

from api.model import Activity, Location, Tracepoint, SQLModel
from api.services.location import LocationService


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def location_service(session):
    return LocationService(session)


def create_test_activity(**kwargs):
    defaults = {
        "id": uuid.uuid4(),
        "fit": "test.fit",
        "sport": "running",
        "device": "Test Device",
        "race": False,
        "timestamp": 1234567890,
        "start_time": 1234567890,
        "title": "Test Activity",
        "total_timer_time": 0.0,
        "total_elapsed_time": 0.0,
        "total_distance": 0.0,
    }
    defaults.update(kwargs)
    return Activity(**defaults)


def test_fetch_location_from_api_success(location_service):
    mock_response = Mock()
    mock_response.json.return_value = {
        "city": "San Francisco",
        "principalSubdivision": "California",
        "countryName": "United States",
    }
    mock_response.raise_for_status = Mock()

    with patch("httpx.get", return_value=mock_response):
        city, subdivision, country = location_service.fetch_location_from_api(
            37.7749, -122.4194
        )

    assert city == "San Francisco"
    assert subdivision == "California"
    assert country == "United States"


def test_fetch_location_from_api_timeout(location_service):
    with patch("httpx.get", side_effect=httpx.TimeoutException("Timeout")):
        city, subdivision, country = location_service.fetch_location_from_api(
            37.7749, -122.4194
        )

    assert city is None
    assert subdivision is None
    assert country is None


def test_get_or_fetch_location_existing(session, location_service):
    existing_location = Location(
        id=uuid.uuid4(),
        lat=37.7749,
        lon=-122.4194,
        city="San Francisco",
        subdivision="California",
        country="United States",
    )
    session.add(existing_location)
    session.commit()

    city, subdivision, country = location_service.get_or_fetch_location(
        37.7749, -122.4194
    )

    assert city == "San Francisco"
    assert subdivision == "California"
    assert country == "United States"


def test_get_or_fetch_location_new(session, location_service):
    mock_response = Mock()
    mock_response.json.return_value = {
        "city": "Paris",
        "principalSubdivision": "Île-de-France",
        "countryName": "France",
    }
    mock_response.raise_for_status = Mock()

    with patch("httpx.get", return_value=mock_response):
        city, subdivision, country = location_service.get_or_fetch_location(
            48.8566, 2.3522
        )

    assert city == "Paris"
    assert subdivision == "Île-de-France"
    assert country == "France"

    locations = session.exec(select(Location)).all()
    assert len(locations) == 1
    assert locations[0].city == "Paris"


def test_update_activity_location_already_set(session, location_service):
    activity = create_test_activity(
        city="Existing City",
        subdivision="Existing State",
        country="Existing Country",
    )
    session.add(activity)
    session.commit()

    updated = location_service.update_activity_location(activity)

    assert updated is False
    assert activity.city == "Existing City"


def test_update_activity_location_no_tracepoints(session, location_service):
    activity = create_test_activity()
    session.add(activity)
    session.commit()

    updated = location_service.update_activity_location(activity)

    assert updated is False


def test_update_activity_location_success(session, location_service):
    activity_id = uuid.uuid4()
    activity = create_test_activity(id=activity_id)
    session.add(activity)

    tracepoint = Tracepoint(
        id=uuid.uuid4(),
        activity_id=activity_id,
        timestamp=datetime.datetime.fromtimestamp(1234567890),
        lat=37.7749,
        lon=-122.4194,
        distance=0,
        speed=0,
    )
    session.add(tracepoint)
    session.commit()

    mock_response = Mock()
    mock_response.json.return_value = {
        "city": "San Francisco",
        "principalSubdivision": "California",
        "countryName": "United States",
    }
    mock_response.raise_for_status = Mock()

    with patch("httpx.get", return_value=mock_response):
        updated = location_service.update_activity_location(activity)

    assert updated is True
    assert activity.city == "San Francisco"
    assert activity.subdivision == "California"
    assert activity.country == "United States"
