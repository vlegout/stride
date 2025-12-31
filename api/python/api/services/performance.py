import datetime
import uuid

from api.model import Activity, Performance, PerformancePower, Tracepoint
from api.utils import (
    DISTANCE_1KM,
    DISTANCE_1MILE,
    DISTANCE_5KM,
    DISTANCE_10KM,
    DISTANCE_HALF_MARATHON,
    DISTANCE_FULL_MARATHON,
    POWER_TIME_TOLERANCE_SECONDS,
)


class PerformanceService:
    def calculate_running_performances(
        self, activity: Activity, tracepoints: list[Tracepoint]
    ) -> list[Performance]:
        if not tracepoints:
            return []

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
        max_distance = tracepoints[-1].distance
        performances = [
            Performance(id=uuid.uuid4(), activity_id=activity.id, distance=d)
            for d in distances
            if max_distance >= d
        ]
        if not performances:
            return []

        best_times = [datetime.timedelta.max] * len(performances)
        n = len(tracepoints)

        for i, perf in enumerate(performances):
            start = 0
            end = 0
            while (
                start < n
                and tracepoints[start].distance <= max_distance - perf.distance
            ):
                while (
                    end < n
                    and tracepoints[end].distance - tracepoints[start].distance
                    < perf.distance
                ):
                    end += 1
                if end < n:
                    time = tracepoints[end].timestamp - tracepoints[start].timestamp
                    if not best_times[i] or time < best_times[i]:
                        best_times[i] = time
                start += 1

        for perf, t in zip(performances, best_times):
            perf.time = t

        return performances

    def calculate_cycling_performances(
        self, activity: Activity, tracepoints: list[Tracepoint]
    ) -> list[PerformancePower]:
        if not tracepoints:
            return []

        if activity.sport != "cycling":
            return []

        time_periods = []

        for s in range(1, 121):
            time_periods.append(datetime.timedelta(seconds=s))

        for s in range(130, 3601, 10):
            time_periods.append(datetime.timedelta(seconds=s))

        for m in range(61, 241):
            time_periods.append(datetime.timedelta(minutes=m))

        max_time = tracepoints[-1].timestamp - tracepoints[0].timestamp
        performance_powers = [
            PerformancePower(
                id=uuid.uuid4(), activity_id=activity.id, time=t, power=0.0
            )
            for t in time_periods
            if max_time >= t
        ]
        if not performance_powers:
            return []

        period_seconds = [int(p.time.total_seconds()) for p in performance_powers]
        best_powers = [0.0] * len(performance_powers)
        n = len(tracepoints)

        valid_tracepoints = [
            (i, tp) for i, tp in enumerate(tracepoints) if tp.power is not None
        ]

        if not valid_tracepoints:
            return performance_powers

        for period_idx, target_seconds in enumerate(period_seconds):
            if target_seconds == 0:
                continue

            max_power = 0.0

            left = 0
            power_sum = 0.0
            power_count = 0

            for right in range(n):
                right_power = tracepoints[right].power
                if right_power is not None:
                    power_sum += right_power
                    power_count += 1

                while left <= right:
                    time_diff = (
                        tracepoints[right].timestamp - tracepoints[left].timestamp
                    ).total_seconds()
                    if time_diff < target_seconds:
                        break

                    left_power = tracepoints[left].power
                    if left_power is not None:
                        power_sum -= left_power
                        power_count -= 1
                    left += 1

                if power_count > 0:
                    time_diff = (
                        tracepoints[right].timestamp - tracepoints[left].timestamp
                    ).total_seconds()
                    if time_diff >= target_seconds - POWER_TIME_TOLERANCE_SECONDS:
                        avg_power = power_sum / power_count
                        max_power = max(max_power, avg_power)

            best_powers[period_idx] = max_power

        for perf, best_power in zip(performance_powers, best_powers):
            perf.power = best_power

        return performance_powers
