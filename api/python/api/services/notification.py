import datetime
from typing import Dict, List

from sqlmodel import Session, select

from api.model import Activity, Notification, Performance
from api.utils import (
    DISTANCE_1KM,
    DISTANCE_1MILE,
    DISTANCE_5KM,
    DISTANCE_10KM,
    DISTANCE_HALF_MARATHON,
    DISTANCE_FULL_MARATHON,
)


class NotificationService:
    def __init__(self, session: Session):
        self.session = session

    def detect_achievements(
        self, activity: Activity, performances: List[Performance]
    ) -> List[Notification]:
        if activity.sport != "running":
            return []

        distances = [
            DISTANCE_1KM,
            DISTANCE_1MILE,
            DISTANCE_5KM,
            DISTANCE_10KM,
            DISTANCE_HALF_MARATHON,
            DISTANCE_FULL_MARATHON,
        ]
        current_year = datetime.date.fromtimestamp(activity.start_time).year

        current_perfs = {
            p.distance: p for p in performances if p.distance in distances and p.time
        }

        if not current_perfs:
            return []

        stmt = (
            select(Performance, Activity.start_time)
            .join(Activity)
            .where(
                Activity.user_id == activity.user_id,
                Activity.sport == "running",
                Activity.status == "created",
                Activity.id != activity.id,
                Performance.distance.in_(list(current_perfs.keys())),  # type: ignore[attr-defined]
                Performance.time.is_not(None),  # type: ignore[union-attr]
            )
        )
        historical_results = self.session.exec(stmt).all()

        historical_by_distance: Dict[float, List[tuple[datetime.timedelta, int]]] = {}
        for perf, start_time in historical_results:
            if perf.time is None:
                continue
            if perf.distance not in historical_by_distance:
                historical_by_distance[perf.distance] = []
            perf_year = datetime.date.fromtimestamp(start_time).year
            historical_by_distance[perf.distance].append((perf.time, perf_year))

        notifications = []

        for target_distance, current_perf in current_perfs.items():
            if current_perf.time is None:
                continue

            historical_data = historical_by_distance.get(target_distance, [])

            if not historical_data:
                notifications.append(
                    Notification(
                        activity_id=activity.id,
                        type="best_effort_all_time",
                        distance=target_distance,
                        achievement_year=None,
                        message="",
                    )
                )
                continue

            all_times = [time for time, _ in historical_data]
            yearly_times = [
                time for time, year in historical_data if year == current_year
            ]

            all_time_best = min(all_times)

            if current_perf.time < all_time_best:
                notifications.append(
                    Notification(
                        activity_id=activity.id,
                        type="best_effort_all_time",
                        distance=target_distance,
                        achievement_year=None,
                        message="",
                    )
                )
            elif not yearly_times or current_perf.time < min(yearly_times):
                notifications.append(
                    Notification(
                        activity_id=activity.id,
                        type="best_effort_yearly",
                        distance=target_distance,
                        achievement_year=current_year,
                        message="",
                    )
                )

        return notifications
