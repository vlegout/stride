import uuid

import pytest
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool

from api.model import Activity, SQLModel, User, Zone
from api.services.bulk_operations import BulkOperationService


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def bulk_service(session):
    return BulkOperationService(session)


@pytest.fixture
def test_user(session):
    user = User(
        id=str(uuid.uuid4()),
        first_name="Test",
        last_name="User",
        email="test@example.com",
        google_id="test123",
    )
    session.add(user)
    session.commit()
    return user


def test_update_zones_no_users(session, bulk_service):
    result = bulk_service.update_zones()

    assert result.processed_count == 0
    assert result.skipped_count == 0
    assert result.total_count == 0


def test_update_zones_user_no_activities(session, bulk_service, test_user):
    result = bulk_service.update_zones()

    assert result.processed_count == 0
    assert result.skipped_count == 1
    assert result.total_count == 1


def test_update_zones_creates_default_zones(session, bulk_service, test_user):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="test.fit",
        sport="running",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Activity",
        total_timer_time=0.0,
        total_elapsed_time=0.0,
        total_distance=0.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.update_zones()

    assert result.processed_count == 1
    assert result.skipped_count == 0

    zones = session.exec(select(Zone).where(Zone.user_id == test_user.id)).all()
    assert len(zones) == 15


def test_update_performance_powers_no_activities(session, bulk_service):
    result = bulk_service.update_performance_powers()

    assert result.processed_count == 0
    assert result.skipped_count == 0
    assert result.total_count == 0


def test_update_ftps_no_activities(session, bulk_service):
    result = bulk_service.update_ftps()

    assert result.processed_count == 0
    assert result.skipped_count == 0
    assert result.total_count == 0


def test_recompute_activities_invalid_user_email(session, bulk_service):
    with pytest.raises(ValueError, match="not found"):
        bulk_service.recompute_activities(user_email="nonexistent@example.com")


def test_recompute_activities_invalid_activity_id(session, bulk_service):
    with pytest.raises(ValueError, match="Invalid activity ID"):
        bulk_service.recompute_activities(activity_id="not-a-uuid")


def test_recompute_activities_invalid_date_format(session, bulk_service):
    with pytest.raises(ValueError, match="Invalid start date"):
        bulk_service.recompute_activities(start_date="2024-13-45")

    with pytest.raises(ValueError, match="Invalid end date"):
        bulk_service.recompute_activities(end_date="invalid-date")
