import datetime
import logging
import os
import uuid
from dataclasses import dataclass

from sqlmodel import Session, col, delete, select

from api.fit import get_activity_from_fit
from api.fitness import update_ftp_for_date
from api.model import (
    Activity,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Ftp,
    Lap,
    Notification,
    Performance,
    PerformancePower,
    Tracepoint,
    User,
    Zone,
)
from api.services.fit_file import FitFileService
from api.services.notification import NotificationService
from api.services.performance import PerformanceService
from api.services.storage import StorageService
from api.services.zone import ZoneService
from api.utils import (
    MAX_TRACEPOINTS_FOR_RESPONSE,
    get_best_performance_power,
    get_best_performances,
)

logger = logging.getLogger(__name__)


@dataclass
class BulkOperationResult:
    processed_count: int
    skipped_count: int
    error_count: int = 0
    total_count: int = 0


class BulkOperationService:
    def __init__(
        self,
        session: Session,
        storage_service: StorageService | None = None,
    ):
        self.session = session
        self.storage_service = storage_service
        self.fit_file_service = FitFileService(session, storage_service)
        self.zone_service = ZoneService(session)
        self.notification_service = NotificationService(session)
        self.performance_service = PerformanceService()

    def update_performance_powers(self) -> BulkOperationResult:
        cycling_activities = self.session.exec(
            select(Activity).where(
                Activity.sport == "cycling", Activity.status == "created"
            )
        ).all()

        processed_count = 0
        skipped_count = 0

        for activity in cycling_activities:
            existing_power_performances = self.session.exec(
                select(PerformancePower).where(
                    PerformancePower.activity_id == activity.id
                )
            ).all()

            if existing_power_performances:
                skipped_count += 1
                continue

            fit_file_paths = [
                f"./data/fit/{activity.fit}",
                f"./data/files/{activity.fit}",
            ]
            fit_file_path = None
            for path in fit_file_paths:
                if os.path.exists(path):
                    fit_file_path = path
                    break

            if fit_file_path is None:
                skipped_count += 1
                continue

            try:
                _, _, tracepoints = get_activity_from_fit(self.session, fit_file_path)

                if not tracepoints:
                    continue

                performance_powers = get_best_performance_power(activity, tracepoints)

                if performance_powers:
                    for performance_power in performance_powers:
                        self.session.add(performance_power)
                    processed_count += 1

            except Exception:
                logger.exception(
                    f"Failed to process performance powers for activity {activity.id}"
                )
                skipped_count += 1

        self.session.commit()
        return BulkOperationResult(
            processed_count=processed_count,
            skipped_count=skipped_count,
            total_count=len(cycling_activities),
        )

    def update_zones(self) -> BulkOperationResult:
        users = self.session.exec(select(User)).all()
        updated_count = 0
        skipped_count = 0

        for user in users:
            activities = self.session.exec(
                select(Activity).where(
                    Activity.user_id == user.id, Activity.status == "created"
                )
            ).all()

            if not activities:
                skipped_count += 1
                continue

            existing_zones = self.session.exec(
                select(Zone).where(Zone.user_id == user.id)
            ).all()

            if not existing_zones:
                self.zone_service.create_default_zones(user.id)
                self.session.commit()

            self.zone_service.update_user_zones(user.id)
            updated_count += 1

        return BulkOperationResult(
            processed_count=updated_count,
            skipped_count=skipped_count,
            total_count=len(users),
        )

    def update_ftps(self) -> BulkOperationResult:
        cycling_activities = self.session.exec(
            select(Activity)
            .where(Activity.sport == "cycling", Activity.status == "created")
            .order_by(Activity.start_time)  # type: ignore[arg-type]
        ).all()

        processed_count = 0
        skipped_count = 0
        activities_by_user: dict[str, list[Activity]] = {}

        for activity in cycling_activities:
            if activity.user_id is None:
                continue
            if activity.user_id not in activities_by_user:
                activities_by_user[activity.user_id] = []
            activities_by_user[activity.user_id].append(activity)

        for user_id, user_activities in activities_by_user.items():
            processed_activities = set()

            for activity in user_activities:
                activity_date = datetime.date.fromtimestamp(activity.start_time)

                date_key = (user_id, activity_date)
                if date_key in processed_activities:
                    continue

                existing_ftp = self.session.exec(
                    select(Ftp).where(Ftp.user_id == user_id, Ftp.date == activity_date)
                ).first()

                if existing_ftp:
                    skipped_count += 1
                    processed_activities.add(date_key)
                    continue

                try:
                    update_ftp_for_date(self.session, user_id, activity_date)

                    new_ftp = self.session.exec(
                        select(Ftp).where(
                            Ftp.user_id == user_id, Ftp.date == activity_date
                        )
                    ).first()

                    if new_ftp:
                        processed_count += 1
                    else:
                        skipped_count += 1

                    processed_activities.add(date_key)

                except Exception:
                    logger.exception(
                        f"Failed to update FTP for user {user_id} on {activity_date}"
                    )
                    skipped_count += 1

        return BulkOperationResult(
            processed_count=processed_count,
            skipped_count=skipped_count,
            total_count=len(cycling_activities),
        )

    def update_activity_zones(self, fit_dir: str = "./data/fit") -> BulkOperationResult:
        activities = self.session.exec(
            select(Activity)
            .where(Activity.status == "created")
            .order_by(Activity.start_time)  # type: ignore[arg-type]
        ).all()

        processed_count = 0
        skipped_count = 0
        error_count = 0

        for activity in activities:
            try:
                if not activity.user_id:
                    skipped_count += 1
                    continue

                fit_file_paths = [
                    f"{fit_dir}/{activity.fit}",
                    f"./data/files/{activity.fit}",
                ]
                fit_file_path = None
                for path in fit_file_paths:
                    if os.path.exists(path):
                        fit_file_path = path
                        break

                if fit_file_path is None:
                    skipped_count += 1
                    continue

                self.session.exec(
                    delete(ActivityZonePace).where(
                        col(ActivityZonePace.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(ActivityZonePower).where(
                        col(ActivityZonePower.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(ActivityZoneHeartRate).where(
                        col(ActivityZoneHeartRate.activity_id) == activity.id
                    )
                )

                try:
                    _, _, tracepoints = get_activity_from_fit(
                        self.session, fit_file_path
                    )
                except Exception:
                    logger.exception(
                        f"Failed to parse FIT file for activity {activity.id}"
                    )
                    error_count += 1
                    continue

                if not tracepoints:
                    skipped_count += 1
                    continue

                user_zones = self.session.exec(
                    select(Zone).where(Zone.user_id == activity.user_id)
                ).all()

                if not user_zones:
                    self.zone_service.create_default_zones(activity.user_id)
                    self.session.commit()

                self.zone_service.calculate_activity_zones(activity, tracepoints)

                processed_count += 1

                if processed_count % 10 == 0:
                    self.session.commit()

            except Exception:
                logger.exception(
                    f"Failed to update activity zones for activity {activity.id}"
                )
                error_count += 1
                self.session.rollback()

        self.session.commit()

        return BulkOperationResult(
            processed_count=processed_count,
            skipped_count=skipped_count,
            error_count=error_count,
            total_count=len(activities),
        )

    def recompute_activities(
        self,
        fit_dir: str = "./data/fit",
        user_email: str | None = None,
        activity_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        download_from_s3: bool = True,
        batch_size: int = 10,
    ) -> BulkOperationResult:
        query = select(Activity).where(Activity.status == "created")

        if user_email:
            user = self.session.exec(
                select(User).where(User.email == user_email)
            ).first()
            if not user:
                raise ValueError(f"User with email {user_email} not found")
            query = query.where(Activity.user_id == user.id)

        if activity_id:
            try:
                activity_uuid = uuid.UUID(activity_id)
                query = query.where(Activity.id == activity_uuid)
            except ValueError:
                raise ValueError(f"Invalid activity ID: {activity_id}")

        if start_date:
            try:
                start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
                start_timestamp = int(start_dt.timestamp())
                query = query.where(Activity.start_time >= start_timestamp)
            except ValueError:
                raise ValueError(
                    f"Invalid start date format: {start_date}. Use YYYY-MM-DD"
                )

        if end_date:
            try:
                end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d")
                end_timestamp = int(end_dt.timestamp())
                query = query.where(Activity.start_time <= end_timestamp)
            except ValueError:
                raise ValueError(f"Invalid end date format: {end_date}. Use YYYY-MM-DD")

        query = query.order_by(Activity.start_time)  # type: ignore[arg-type]

        activities = self.session.exec(query).all()

        processed_count = 0
        skipped_count = 0
        error_count = 0

        for activity in activities:
            try:
                original_title = activity.title
                original_description = activity.description
                original_race = activity.race

                fit_path, _ = self.fit_file_service.get_fit_file_path(
                    activity, fit_dir, download_from_s3
                )

                if not fit_path:
                    skipped_count += 1
                    continue

                try:
                    parsed_activity, new_laps, new_tracepoints = get_activity_from_fit(
                        self.session,
                        fit_path,
                        title=original_title,
                        description=original_description or "",
                        race=original_race,
                        fit_name=activity.fit,
                    )
                except Exception:
                    logger.exception(
                        f"Failed to parse FIT file for activity {activity.id}"
                    )
                    error_count += 1
                    continue

                fit_fields_to_update = [
                    "sport",
                    "device",
                    "timestamp",
                    "total_timer_time",
                    "total_elapsed_time",
                    "total_distance",
                    "total_ascent",
                    "avg_speed",
                    "avg_heart_rate",
                    "max_heart_rate",
                    "avg_cadence",
                    "max_cadence",
                    "avg_power",
                    "max_power",
                    "np_power",
                    "total_calories",
                    "total_training_effect",
                    "training_stress_score",
                    "intensity_factor",
                    "avg_temperature",
                    "max_temperature",
                    "min_temperature",
                    "pool_length",
                    "num_lengths",
                ]

                for field in fit_fields_to_update:
                    value = getattr(parsed_activity, field, None)
                    setattr(activity, field, value)

                activity.updated_at = datetime.datetime.now(datetime.timezone.utc)

                self.session.exec(
                    delete(Lap).where(col(Lap.activity_id) == activity.id)
                )
                self.session.exec(
                    delete(Tracepoint).where(col(Tracepoint.activity_id) == activity.id)
                )
                self.session.exec(
                    delete(Performance).where(
                        col(Performance.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(PerformancePower).where(
                        col(PerformancePower.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(ActivityZonePace).where(
                        col(ActivityZonePace.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(ActivityZonePower).where(
                        col(ActivityZonePower.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(ActivityZoneHeartRate).where(
                        col(ActivityZoneHeartRate.activity_id) == activity.id
                    )
                )
                self.session.exec(
                    delete(Notification).where(
                        col(Notification.activity_id) == activity.id
                    )
                )

                for lap in new_laps:
                    lap.activity_id = activity.id
                    self.session.add(lap)

                performances = get_best_performances(activity, new_tracepoints)
                for perf in performances:
                    self.session.add(perf)

                performance_powers = get_best_performance_power(
                    activity, new_tracepoints
                )
                for pp in performance_powers:
                    self.session.add(pp)

                original_tracepoints = new_tracepoints.copy()

                while len(new_tracepoints) > MAX_TRACEPOINTS_FOR_RESPONSE:
                    new_tracepoints = [
                        tp for i, tp in enumerate(new_tracepoints) if i % 2 == 0
                    ]

                for tp in new_tracepoints:
                    tp.activity_id = activity.id
                    self.session.add(tp)

                if activity.user_id:
                    self.zone_service.calculate_activity_zones(
                        activity, original_tracepoints
                    )

                notifications = self.notification_service.detect_achievements(
                    activity, performances
                )
                for notif in notifications:
                    self.session.add(notif)

                if activity.user_id:
                    self.zone_service.update_user_zones(activity.user_id)

                if activity.sport == "cycling" and activity.user_id:
                    activity_date = datetime.date.fromtimestamp(activity.start_time)
                    update_ftp_for_date(self.session, activity.user_id, activity_date)

                processed_count += 1

                if processed_count % batch_size == 0:
                    self.session.commit()

            except Exception:
                logger.exception(f"Failed to recompute activity {activity.id}")
                error_count += 1
                self.session.rollback()
                continue

        if processed_count % batch_size != 0:
            self.session.commit()

        return BulkOperationResult(
            processed_count=processed_count,
            skipped_count=skipped_count,
            error_count=error_count,
            total_count=len(activities),
        )
