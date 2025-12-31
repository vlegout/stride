import datetime
import uuid
from typing import Dict, List

from sqlmodel import Session, select

from api.model import (
    Activity,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Tracepoint,
    Zone,
)
from api.utils import (
    DEFAULT_HR_ZONE_1_MAX,
    DEFAULT_HR_ZONE_2_MAX,
    DEFAULT_HR_ZONE_3_MAX,
    DEFAULT_HR_ZONE_4_MAX,
    DEFAULT_HR_ZONE_5_MAX,
    DEFAULT_PACE_ZONE_1_MAX,
    DEFAULT_PACE_ZONE_2_MAX,
    DEFAULT_PACE_ZONE_3_MAX,
    DEFAULT_PACE_ZONE_4_MAX,
    DEFAULT_PACE_ZONE_5_MAX,
    DEFAULT_POWER_ZONE_1_MAX,
    DEFAULT_POWER_ZONE_2_MAX,
    DEFAULT_POWER_ZONE_3_MAX,
    DEFAULT_POWER_ZONE_4_MAX,
    DEFAULT_POWER_ZONE_5_MAX,
    FASTEST_RUNS_PERCENTILE,
    FTP_FROM_MAX_POWER_MULTIPLIER,
    HR_PERCENTILE_95_INDEX,
    HR_ZONE_1_MAX_PCT,
    HR_ZONE_2_MAX_PCT,
    HR_ZONE_3_MAX_PCT,
    HR_ZONE_4_MAX_PCT,
    HR_ZONE_5_MAX_PCT,
    LONG_RUN_MIN_DISTANCE_METERS,
    MAX_HR_SAFETY_CAP,
    ONE_YEAR_IN_DAYS,
    PACE_CONSERVATIVENESS_FACTOR,
    PACE_ZONE_1_MULTIPLIER,
    PACE_ZONE_2_MULTIPLIER,
    PACE_ZONE_3_MULTIPLIER,
    PACE_ZONE_4_MULTIPLIER,
    PACE_ZONE_5_MULTIPLIER,
    POWER_ZONE_1_MAX_PCT,
    POWER_ZONE_2_MAX_PCT,
    POWER_ZONE_3_MAX_PCT,
    POWER_ZONE_4_MAX_PCT,
    POWER_ZONE_5_MAX_PCT,
    SECONDS_PER_KM_CONVERSION,
    THRESHOLD_RUN_MIN_DISTANCE_METERS,
    THRESHOLD_RUN_MAX_DISTANCE_METERS,
)


class ZoneService:
    def __init__(self, session: Session):
        self.session = session

    def calculate_activity_zones(
        self, activity: Activity, tracepoints: List[Tracepoint]
    ) -> None:
        if not tracepoints or not activity.user_id:
            return

        user_zones = self.session.exec(
            select(Zone).where(Zone.user_id == activity.user_id)
        ).all()

        if not user_zones:
            return

        heart_rate_zones = [z for z in user_zones if z.type == "heart_rate"]
        pace_zones = [z for z in user_zones if z.type == "pace"]
        power_zones = [z for z in user_zones if z.type == "power"]

        if heart_rate_zones and any(tp.heart_rate for tp in tracepoints):
            zone_data = self._calculate_heart_rate_zones(heart_rate_zones, tracepoints)
            for zone_id, time_in_zone in zone_data.items():
                if time_in_zone > 0:
                    activity_zone_hr = ActivityZoneHeartRate(
                        activity_id=activity.id,
                        zone_id=zone_id,
                        time_in_zone=time_in_zone,
                    )
                    self.session.add(activity_zone_hr)

        if pace_zones and activity.sport == "running":
            zone_data = self._calculate_pace_zones(pace_zones, tracepoints)
            for zone_id, time_in_zone in zone_data.items():
                if time_in_zone > 0:
                    activity_zone_pace = ActivityZonePace(
                        activity_id=activity.id,
                        zone_id=zone_id,
                        time_in_zone=time_in_zone,
                    )
                    self.session.add(activity_zone_pace)

        if (
            power_zones
            and activity.sport == "cycling"
            and any(tp.power for tp in tracepoints)
        ):
            zone_data = self._calculate_power_zones(power_zones, tracepoints)
            for zone_id, time_in_zone in zone_data.items():
                if time_in_zone > 0:
                    activity_zone_power = ActivityZonePower(
                        activity_id=activity.id,
                        zone_id=zone_id,
                        time_in_zone=time_in_zone,
                    )
                    self.session.add(activity_zone_power)

    def update_user_zones(self, user_id: str) -> None:
        one_year_ago = datetime.datetime.now() - datetime.timedelta(
            days=ONE_YEAR_IN_DAYS
        )
        one_year_ago_timestamp = int(one_year_ago.timestamp())

        activities = self.session.exec(
            select(Activity).where(
                Activity.user_id == user_id,
                Activity.status == "created",
                Activity.start_time >= one_year_ago_timestamp,
            )
        ).all()

        if not activities:
            return

        heart_rates = [
            a.max_heart_rate for a in activities if a.max_heart_rate is not None
        ]
        if heart_rates:
            sorted_hrs = sorted(heart_rates, reverse=True)
            percentile_95_index = max(0, int(len(sorted_hrs) * HR_PERCENTILE_95_INDEX))
            estimated_max_hr = sorted_hrs[percentile_95_index]

            if estimated_max_hr > MAX_HR_SAFETY_CAP:
                estimated_max_hr = min(estimated_max_hr, MAX_HR_SAFETY_CAP)

            hr_zones = [
                {"index": 1, "max_value": estimated_max_hr * HR_ZONE_1_MAX_PCT},
                {"index": 2, "max_value": estimated_max_hr * HR_ZONE_2_MAX_PCT},
                {"index": 3, "max_value": estimated_max_hr * HR_ZONE_3_MAX_PCT},
                {"index": 4, "max_value": estimated_max_hr * HR_ZONE_4_MAX_PCT},
                {"index": 5, "max_value": estimated_max_hr * HR_ZONE_5_MAX_PCT},
            ]

            for zone_data in hr_zones:
                zone = self.session.exec(
                    select(Zone).where(
                        Zone.user_id == user_id,
                        Zone.type == "heart_rate",
                        Zone.index == zone_data["index"],
                    )
                ).first()
                if zone:
                    zone.max_value = zone_data["max_value"]
                    self.session.add(zone)

        running_activities = [a for a in activities if a.sport == "running"]
        if running_activities:
            longer_runs = [
                a
                for a in running_activities
                if a.total_distance >= LONG_RUN_MIN_DISTANCE_METERS
            ]

            if longer_runs:
                threshold_candidates = [
                    a
                    for a in longer_runs
                    if THRESHOLD_RUN_MIN_DISTANCE_METERS
                    <= a.total_distance
                    <= THRESHOLD_RUN_MAX_DISTANCE_METERS
                ]

                if not threshold_candidates:
                    threshold_candidates = longer_runs

                num_candidates = max(
                    1, int(len(threshold_candidates) * FASTEST_RUNS_PERCENTILE)
                )
                fastest_longer_runs = sorted(
                    threshold_candidates, key=lambda x: x.avg_speed, reverse=True
                )[:num_candidates]

                avg_threshold_speed_kmh = sum(
                    a.avg_speed for a in fastest_longer_runs
                ) / len(fastest_longer_runs)
                threshold_pace = SECONDS_PER_KM_CONVERSION / avg_threshold_speed_kmh
            else:
                speeds = sorted([a.avg_speed for a in running_activities])
                start_idx = len(speeds) // 4
                end_idx = start_idx + len(speeds) // 2
                middle_speeds = (
                    speeds[start_idx:end_idx] if end_idx > start_idx else speeds
                )
                avg_speed_kmh = sum(middle_speeds) / len(middle_speeds)
                threshold_pace = (
                    SECONDS_PER_KM_CONVERSION / avg_speed_kmh
                ) * PACE_CONSERVATIVENESS_FACTOR

            pace_zones = [
                {"index": 1, "max_value": threshold_pace * PACE_ZONE_1_MULTIPLIER},
                {"index": 2, "max_value": threshold_pace * PACE_ZONE_2_MULTIPLIER},
                {"index": 3, "max_value": threshold_pace * PACE_ZONE_3_MULTIPLIER},
                {"index": 4, "max_value": threshold_pace * PACE_ZONE_4_MULTIPLIER},
                {"index": 5, "max_value": threshold_pace * PACE_ZONE_5_MULTIPLIER},
            ]

            for zone_data in pace_zones:
                zone = self.session.exec(
                    select(Zone).where(
                        Zone.user_id == user_id,
                        Zone.type == "pace",
                        Zone.index == zone_data["index"],
                    )
                ).first()
                if zone:
                    zone.max_value = zone_data["max_value"]
                    self.session.add(zone)

        cycling_activities = [
            a for a in activities if a.sport == "cycling" and a.max_power is not None
        ]
        if cycling_activities:
            max_powers = [
                a.max_power for a in cycling_activities if a.max_power is not None
            ]
            estimated_ftp = max(max_powers) * FTP_FROM_MAX_POWER_MULTIPLIER

            power_zones = [
                {"index": 1, "max_value": estimated_ftp * POWER_ZONE_1_MAX_PCT},
                {"index": 2, "max_value": estimated_ftp * POWER_ZONE_2_MAX_PCT},
                {"index": 3, "max_value": estimated_ftp * POWER_ZONE_3_MAX_PCT},
                {"index": 4, "max_value": estimated_ftp * POWER_ZONE_4_MAX_PCT},
                {"index": 5, "max_value": estimated_ftp * POWER_ZONE_5_MAX_PCT},
            ]

            for zone_data in power_zones:
                zone = self.session.exec(
                    select(Zone).where(
                        Zone.user_id == user_id,
                        Zone.type == "power",
                        Zone.index == zone_data["index"],
                    )
                ).first()
                if zone:
                    zone.max_value = zone_data["max_value"]
                    self.session.add(zone)

    def create_default_zones(self, user_id: str):
        default_zones = [
            {"type": "heart_rate", "index": 1, "max_value": DEFAULT_HR_ZONE_1_MAX},
            {"type": "heart_rate", "index": 2, "max_value": DEFAULT_HR_ZONE_2_MAX},
            {"type": "heart_rate", "index": 3, "max_value": DEFAULT_HR_ZONE_3_MAX},
            {"type": "heart_rate", "index": 4, "max_value": DEFAULT_HR_ZONE_4_MAX},
            {"type": "heart_rate", "index": 5, "max_value": DEFAULT_HR_ZONE_5_MAX},
            {"type": "pace", "index": 1, "max_value": DEFAULT_PACE_ZONE_1_MAX},
            {"type": "pace", "index": 2, "max_value": DEFAULT_PACE_ZONE_2_MAX},
            {"type": "pace", "index": 3, "max_value": DEFAULT_PACE_ZONE_3_MAX},
            {"type": "pace", "index": 4, "max_value": DEFAULT_PACE_ZONE_4_MAX},
            {"type": "pace", "index": 5, "max_value": DEFAULT_PACE_ZONE_5_MAX},
            {"type": "power", "index": 1, "max_value": DEFAULT_POWER_ZONE_1_MAX},
            {"type": "power", "index": 2, "max_value": DEFAULT_POWER_ZONE_2_MAX},
            {"type": "power", "index": 3, "max_value": DEFAULT_POWER_ZONE_3_MAX},
            {"type": "power", "index": 4, "max_value": DEFAULT_POWER_ZONE_4_MAX},
            {"type": "power", "index": 5, "max_value": DEFAULT_POWER_ZONE_5_MAX},
        ]

        for zone_data in default_zones:
            zone = Zone(
                user_id=user_id,
                index=zone_data["index"],
                type=zone_data["type"],
                max_value=zone_data["max_value"],
            )
            self.session.add(zone)

    def _calculate_heart_rate_zones(
        self, zones: List[Zone], tracepoints: List[Tracepoint]
    ) -> Dict[uuid.UUID, float]:
        zone_data: Dict[uuid.UUID, float] = {}

        sorted_zones = sorted(zones, key=lambda z: z.max_value)

        for i in range(len(tracepoints) - 1):
            current_tp = tracepoints[i]
            next_tp = tracepoints[i + 1]

            if current_tp.heart_rate is None:
                continue

            time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

            zone_id = None
            for zone in sorted_zones:
                if current_tp.heart_rate <= zone.max_value:
                    zone_id = zone.id
                    break

            if zone_id:
                zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

        return zone_data

    def _calculate_pace_zones(
        self, zones: List[Zone], tracepoints: List[Tracepoint]
    ) -> Dict[uuid.UUID, float]:
        zone_data: Dict[uuid.UUID, float] = {}

        zones_by_index = sorted(zones, key=lambda z: z.index)

        for i in range(len(tracepoints) - 1):
            current_tp = tracepoints[i]
            next_tp = tracepoints[i + 1]

            if current_tp.speed <= 0:
                continue

            speed_kmh = current_tp.speed
            if speed_kmh > 0:
                pace = SECONDS_PER_KM_CONVERSION / speed_kmh
            else:
                continue

            time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

            zone_id = None

            for zone in reversed(zones_by_index):
                if pace <= zone.max_value:
                    zone_id = zone.id
                    break

            if zone_id is None:
                zone_id = zones_by_index[0].id

            zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

        return zone_data

    def _calculate_power_zones(
        self, zones: List[Zone], tracepoints: List[Tracepoint]
    ) -> Dict[uuid.UUID, float]:
        zone_data: Dict[uuid.UUID, float] = {}

        sorted_zones = sorted(zones, key=lambda z: z.max_value)

        for i in range(len(tracepoints) - 1):
            current_tp = tracepoints[i]
            next_tp = tracepoints[i + 1]

            if current_tp.power is None:
                continue

            time_diff = (next_tp.timestamp - current_tp.timestamp).total_seconds()

            zone_id = None
            for zone in sorted_zones:
                if current_tp.power <= zone.max_value:
                    zone_id = zone.id
                    break

            if zone_id:
                zone_data[zone_id] = zone_data.get(zone_id, 0) + time_diff

        return zone_data
