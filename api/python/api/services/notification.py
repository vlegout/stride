import bisect
import datetime

from sqlmodel import Session, select

from api.model import Activity, Notification, Performance, PerformancePower
from api.utils import (
    DISTANCE_1KM,
    DISTANCE_1MILE,
    DISTANCE_5KM,
    DISTANCE_10KM,
    DISTANCE_HALF_MARATHON,
    DISTANCE_FULL_MARATHON,
    DURATION_5S,
    DURATION_1MIN,
    DURATION_5MIN,
    DURATION_20MIN,
    DURATION_1HR,
)


class NotificationService:
    def __init__(self, session: Session):
        self.session = session

    def detect_achievements(
        self, activity: Activity, performances: list[Performance]
    ) -> list[Notification]:
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

        historical_by_distance: dict[
            float, list[tuple[datetime.timedelta, int, int]]
        ] = {}
        for perf, start_time in historical_results:
            if perf.time is None:
                continue
            if perf.distance not in historical_by_distance:
                historical_by_distance[perf.distance] = []
            perf_year = datetime.date.fromtimestamp(start_time).year
            historical_by_distance[perf.distance].append(
                (perf.time, perf_year, start_time)
            )

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
                        rank=1,
                        message="",
                    )
                )
                continue

            all_times = [time for time, _, _ in historical_data]
            yearly_times = [
                time
                for time, year, start_time in historical_data
                if year == current_year and start_time < activity.start_time
            ]

            # Check all-time top 5
            all_times_sorted = sorted(all_times)
            if len(all_times) < 5 or current_perf.time <= all_times_sorted[4]:
                rank = bisect.bisect_left(all_times_sorted, current_perf.time) + 1
                if rank <= 5:
                    notifications.append(
                        Notification(
                            activity_id=activity.id,
                            type="best_effort_all_time",
                            distance=target_distance,
                            achievement_year=None,
                            rank=rank,
                            message="",
                        )
                    )

            # Check yearly top 5
            if yearly_times:
                yearly_times_sorted = sorted(yearly_times)
                if len(yearly_times) < 5 or current_perf.time <= yearly_times_sorted[4]:
                    rank = (
                        bisect.bisect_left(yearly_times_sorted, current_perf.time) + 1
                    )
                    if rank <= 5:
                        # Only create yearly notification if not already created all-time
                        if not any(
                            n.type == "best_effort_all_time"
                            and n.distance == target_distance
                            for n in notifications
                        ):
                            notifications.append(
                                Notification(
                                    activity_id=activity.id,
                                    type="best_effort_yearly",
                                    distance=target_distance,
                                    achievement_year=current_year,
                                    rank=rank,
                                    message="",
                                )
                            )

        return notifications

    def detect_power_achievements(
        self, activity: Activity, performance_powers: list[PerformancePower]
    ) -> list[Notification]:
        if activity.sport != "cycling":
            return []

        durations = [
            DURATION_5S,
            DURATION_1MIN,
            DURATION_5MIN,
            DURATION_20MIN,
            DURATION_1HR,
        ]
        current_year = datetime.date.fromtimestamp(activity.start_time).year

        current_perfs = {
            p.time: p
            for p in performance_powers
            if p.time in durations and p.power and p.power > 0
        }

        if not current_perfs:
            return []

        stmt = (
            select(PerformancePower, Activity.start_time)
            .join(Activity)
            .where(
                Activity.user_id == activity.user_id,
                Activity.sport == "cycling",
                Activity.status == "created",
                Activity.id != activity.id,
                PerformancePower.time.in_(list(current_perfs.keys())),  # type: ignore[attr-defined]
                PerformancePower.power.is_not(None),  # type: ignore[attr-defined]
                PerformancePower.power > 0,  # type: ignore[operator]
            )
        )
        historical_results = self.session.exec(stmt).all()

        historical_by_duration: dict[
            datetime.timedelta, list[tuple[float, int, int]]
        ] = {}
        for perf, start_time in historical_results:
            if perf.power is None or perf.power <= 0:
                continue
            if perf.time not in historical_by_duration:
                historical_by_duration[perf.time] = []
            perf_year = datetime.date.fromtimestamp(start_time).year
            historical_by_duration[perf.time].append(
                (perf.power, perf_year, start_time)
            )

        notifications = []

        for target_duration, current_perf in current_perfs.items():
            if current_perf.power is None or current_perf.power <= 0:
                continue

            historical_data = historical_by_duration.get(target_duration, [])

            if not historical_data:
                notifications.append(
                    Notification(
                        activity_id=activity.id,
                        type="best_effort_all_time",
                        duration=target_duration,
                        power=current_perf.power,
                        achievement_year=None,
                        rank=1,
                        message="",
                    )
                )
                continue

            all_powers = [power for power, _, _ in historical_data]
            yearly_powers = [
                power
                for power, year, start_time in historical_data
                if year == current_year and start_time < activity.start_time
            ]

            # Check all-time top 5 (higher power is better, so sort descending)
            all_powers_sorted = sorted(all_powers, reverse=True)
            if len(all_powers) < 5 or current_perf.power >= all_powers_sorted[4]:
                rank = (
                    bisect.bisect_left(
                        [-p for p in all_powers_sorted], -current_perf.power
                    )
                    + 1
                )
                if rank <= 5:
                    notifications.append(
                        Notification(
                            activity_id=activity.id,
                            type="best_effort_all_time",
                            duration=target_duration,
                            power=current_perf.power,
                            achievement_year=None,
                            rank=rank,
                            message="",
                        )
                    )

            # Check yearly top 5
            if yearly_powers:
                yearly_powers_sorted = sorted(yearly_powers, reverse=True)
                if (
                    len(yearly_powers) < 5
                    or current_perf.power >= yearly_powers_sorted[4]
                ):
                    rank = (
                        bisect.bisect_left(
                            [-p for p in yearly_powers_sorted], -current_perf.power
                        )
                        + 1
                    )
                    if rank <= 5:
                        # Only create yearly notification if not already created all-time
                        if not any(
                            n.type == "best_effort_all_time"
                            and n.duration == target_duration
                            for n in notifications
                        ):
                            notifications.append(
                                Notification(
                                    activity_id=activity.id,
                                    type="best_effort_yearly",
                                    duration=target_duration,
                                    power=current_perf.power,
                                    achievement_year=current_year,
                                    rank=rank,
                                    message="",
                                )
                            )

        return notifications
