from sqlmodel import Session

from .activity import ActivityService
from .heatmap import HeatmapService
from .notification import NotificationService
from .performance import PerformanceService
from .profile import ProfileService
from .storage import StorageService
from .zone import ZoneService


def get_storage_service() -> StorageService:
    return StorageService()


def get_performance_service() -> PerformanceService:
    return PerformanceService()


def get_zone_service(session: Session) -> ZoneService:
    return ZoneService(session)


def get_notification_service(session: Session) -> NotificationService:
    return NotificationService(session)


def get_profile_service(session: Session) -> ProfileService:
    return ProfileService(session)


def get_heatmap_service(session: Session) -> HeatmapService:
    return HeatmapService(session)


def get_activity_service(session: Session) -> ActivityService:
    storage = get_storage_service()
    zone = get_zone_service(session)
    notification = get_notification_service(session)

    return ActivityService(
        session=session,
        storage_service=storage,
        zone_service=zone,
        notification_service=notification,
    )


__all__ = [
    "ActivityService",
    "HeatmapService",
    "NotificationService",
    "PerformanceService",
    "ProfileService",
    "StorageService",
    "ZoneService",
    "get_activity_service",
    "get_heatmap_service",
    "get_notification_service",
    "get_performance_service",
    "get_profile_service",
    "get_storage_service",
    "get_zone_service",
]
