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


def test_update_performance_powers_skips_activities_with_existing_powers(
    session, bulk_service, test_user
):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="test.fit",
        sport="cycling",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Cycling Activity",
        total_timer_time=3600.0,
        total_elapsed_time=3600.0,
        total_distance=30000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    from api.model import PerformancePower
    import datetime

    pp = PerformancePower(
        id=uuid.uuid4(),
        activity_id=activity.id,
        time=datetime.timedelta(seconds=5),
        power=350.0,
    )
    session.add(pp)
    session.commit()

    result = bulk_service.update_performance_powers()

    assert result.skipped_count == 1
    assert result.processed_count == 0
    assert result.total_count == 1


def test_update_performance_powers_skips_missing_fit_files(
    session, bulk_service, test_user
):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="nonexistent.fit",
        sport="cycling",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Cycling Activity",
        total_timer_time=3600.0,
        total_elapsed_time=3600.0,
        total_distance=30000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.update_performance_powers()

    assert result.skipped_count == 1
    assert result.processed_count == 0


def test_update_ftps_skips_activities_without_user(session, bulk_service):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=None,
        fit="test.fit",
        sport="cycling",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Cycling Activity",
        total_timer_time=3600.0,
        total_elapsed_time=3600.0,
        total_distance=30000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.update_ftps()

    assert result.processed_count == 0
    assert result.skipped_count == 0


def test_update_ftps_skips_existing_ftp_records(session, bulk_service, test_user):
    import datetime
    from api.model import Ftp

    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="test.fit",
        sport="cycling",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Cycling Activity",
        total_timer_time=3600.0,
        total_elapsed_time=3600.0,
        total_distance=30000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    activity_date = datetime.date.fromtimestamp(1234567890)
    ftp = Ftp(
        id=uuid.uuid4(),
        user_id=test_user.id,
        date=activity_date,
        ftp=250,
    )
    session.add(ftp)
    session.commit()

    result = bulk_service.update_ftps()

    assert result.skipped_count == 1
    assert result.processed_count == 0


def test_update_activity_zones_skips_activities_without_user(session, bulk_service):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=None,
        fit="test.fit",
        sport="running",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Activity",
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.update_activity_zones()

    assert result.skipped_count == 1
    assert result.processed_count == 0


def test_update_activity_zones_skips_missing_fit_files(
    session, bulk_service, test_user
):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="nonexistent.fit",
        sport="running",
        device="Test Device",
        race=False,
        start_time=1234567890,
        timestamp=1234567890,
        title="Test Activity",
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.update_activity_zones()

    assert result.skipped_count == 1
    assert result.processed_count == 0


def test_recompute_activities_no_activities(session, bulk_service):
    result = bulk_service.recompute_activities()

    assert result.processed_count == 0
    assert result.skipped_count == 0
    assert result.error_count == 0
    assert result.total_count == 0


def test_recompute_activities_with_valid_user_filter(session, bulk_service, test_user):
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
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.recompute_activities(user_email="test@example.com")

    assert result.total_count == 1
    assert result.skipped_count == 1


def test_recompute_activities_with_activity_id_filter(session, bulk_service, test_user):
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
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.recompute_activities(activity_id=str(activity.id))

    assert result.total_count == 1


def test_recompute_activities_with_date_range_filter(session, bulk_service, test_user):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="test.fit",
        sport="running",
        device="Test Device",
        race=False,
        start_time=1609459200,  # 2021-01-01
        timestamp=1609459200,
        title="Test Activity",
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.recompute_activities(
        start_date="2020-01-01",
        end_date="2022-12-31",
    )

    assert result.total_count == 1


def test_recompute_activities_date_filter_excludes_activities(
    session, bulk_service, test_user
):
    activity = Activity(
        id=uuid.uuid4(),
        user_id=test_user.id,
        fit="test.fit",
        sport="running",
        device="Test Device",
        race=False,
        start_time=1609459200,  # 2021-01-01
        timestamp=1609459200,
        title="Test Activity",
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
    )
    session.add(activity)
    session.commit()

    result = bulk_service.recompute_activities(
        start_date="2023-01-01",
        end_date="2023-12-31",
    )

    assert result.total_count == 0


def test_update_zones_updates_existing_zones(session, bulk_service, test_user):
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
        total_timer_time=1800.0,
        total_elapsed_time=1800.0,
        total_distance=5000.0,
        status="created",
        max_heart_rate=180,
    )
    session.add(activity)

    for i in range(1, 6):
        zone = Zone(
            id=uuid.uuid4(),
            user_id=test_user.id,
            type="heart_rate",
            index=i,
            max_value=100 + i * 20,
        )
        session.add(zone)
    session.commit()

    result = bulk_service.update_zones()

    assert result.processed_count == 1
    assert result.skipped_count == 0


def test_recompute_activities_activity_id_not_found(session, bulk_service, test_user):
    random_id = uuid.uuid4()
    result = bulk_service.recompute_activities(activity_id=str(random_id))

    assert result.total_count == 0
