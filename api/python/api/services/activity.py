import datetime
from typing import List

from sqlmodel import Session

from api.fit import get_activity_from_fit
from api.fitness import update_ftp_for_date
from api.model import (
    Activity,
    Lap,
    Performance,
    PerformancePower,
    Tracepoint,
)
from api.services.notification import NotificationService
from api.services.performance import PerformanceService
from api.services.storage import StorageService
from api.services.zone import ZoneService
from api.utils import MAX_TRACEPOINTS_FOR_RESPONSE


class ActivityService:
    def __init__(
        self,
        session: Session,
        storage_service: StorageService,
        performance_service: PerformanceService,
        zone_service: ZoneService,
        notification_service: NotificationService,
    ):
        self.session = session
        self.storage = storage_service
        self.performance = performance_service
        self.zone = zone_service
        self.notification = notification_service

    def create_activity(
        self,
        user_id: str,
        fit_file_path: str,
        fit_filename: str,
        title: str,
        race: bool,
    ) -> Activity:
        activity, laps, tracepoints = get_activity_from_fit(
            session=self.session,
            fit_file=fit_file_path,
            title=title,
            description="",
            race=race,
            fit_name=fit_filename,
        )

        performances = self.performance.calculate_running_performances(
            activity, tracepoints
        )
        performance_powers = self.performance.calculate_cycling_performances(
            activity, tracepoints
        )

        original_tracepoints = tracepoints.copy()

        while len(tracepoints) > MAX_TRACEPOINTS_FOR_RESPONSE:
            tracepoints = [tp for idx, tp in enumerate(tracepoints) if idx % 2 == 0]

        self.storage.upload_activity_files(
            fit_file_path=fit_file_path,
            fit_filename=fit_filename,
            title=title,
            race=race,
        )

        activity.user_id = user_id

        self._persist_activity_data(
            activity, laps, tracepoints, performances, performance_powers
        )

        notifications = self.notification.detect_achievements(activity, performances)
        for notification in notifications:
            self.session.add(notification)

        self.zone.calculate_activity_zones(activity, original_tracepoints)

        self.session.commit()

        self.zone.update_user_zones(user_id)

        if activity.sport == "cycling":
            activity_date = datetime.date.fromtimestamp(activity.start_time)
            update_ftp_for_date(self.session, user_id, activity_date)

        return activity

    def _persist_activity_data(
        self,
        activity: Activity,
        laps: List[Lap],
        tracepoints: List[Tracepoint],
        performances: List[Performance],
        performance_powers: List[PerformancePower],
    ) -> None:
        self.session.add(activity)

        for lap in laps:
            self.session.add(lap)

        for tracepoint in tracepoints:
            self.session.add(tracepoint)

        for performance in performances:
            self.session.add(performance)

        for performance_power in performance_powers:
            self.session.add(performance_power)
