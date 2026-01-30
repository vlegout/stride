import datetime
import uuid
from typing import Any
from sqlmodel import Session, select, col
from api.model import (
    Activity,
    Ftp,
    ActivityZoneHeartRate,
    ActivityZonePace,
    ActivityZonePower,
    Zone,
)

type ZonesByType = dict[str, list[Zone]]
type ZoneTimeData = dict[uuid.UUID, float]


def calculate_activity_score(activity, sport_filter=None):
    """Calculate the base score for an activity, optionally filtered by sport"""
    if sport_filter and activity.sport != sport_filter:
        return 0.0

    activity_score = 0.0

    # Distance contribution - running heavily favored
    if activity.sport == "running":
        # Running: 0.15 points per km, bigger bonuses
        distance_km = activity.total_distance / 1000
        activity_score += distance_km * 0.15
        if distance_km > 21:  # Half marathon+
            activity_score += distance_km * 0.03
        if distance_km > 42:  # Marathon+
            activity_score += distance_km * 0.03
    elif activity.sport == "cycling":
        # Cycling: 0.005 points per km (30x lower than running)
        distance_km = activity.total_distance / 1000
        activity_score += distance_km * 0.005
        if distance_km > 100:  # Century ride
            activity_score += distance_km * 0.001
    elif activity.sport == "swimming":
        # Swimming: 0.3 points per km (higher than running due to shorter distances)
        distance_km = activity.total_distance / 1000
        activity_score += distance_km * 0.3
        if distance_km > 3:  # Long swim
            activity_score += distance_km * 0.05
        if distance_km > 5:  # Very long swim
            activity_score += distance_km * 0.05

    # Time/endurance contribution - sport-specific
    duration_hours = activity.total_timer_time / 3600
    if activity.sport == "running":
        if duration_hours > 1:
            activity_score += (duration_hours - 1) * 0.15
        if duration_hours > 3:
            activity_score += (duration_hours - 3) * 0.08
    elif activity.sport == "cycling":
        # Cycling time contributions are much much lower
        if duration_hours > 3:  # Cycling needs even longer duration to count
            activity_score += (duration_hours - 3) * 0.02
        if duration_hours > 5:
            activity_score += (duration_hours - 5) * 0.005
    elif activity.sport == "swimming":
        if duration_hours > 0.5:
            activity_score += (duration_hours - 0.5) * 0.2
        if duration_hours > 1.5:
            activity_score += (duration_hours - 1.5) * 0.1

    # Elevation gain contribution - sport-specific
    if activity.total_ascent:
        ascent_km = activity.total_ascent / 1000
        if activity.sport == "running":
            activity_score += ascent_km * 0.3
        elif activity.sport == "cycling":
            # Cycling elevation is much less demanding
            activity_score += ascent_km * 0.05

    # Race bonus - tiny
    if activity.race:
        activity_score *= 1.05

    # Power/intensity contribution - minimal
    if activity.training_stress_score:
        activity_score += activity.training_stress_score * 0.005
    elif activity.avg_power and activity.sport == "cycling":
        # Rough TSS estimation for cycling without TSS
        if activity.avg_power > 200:
            activity_score += (activity.avg_power - 200) * 0.0005 * duration_hours

    return activity_score


def calculate_fitness_scores(session: Session, user_id: str):
    """Calculate fitness scores for a user over the past 2.5 years"""
    end_date = datetime.datetime.now()
    total_days = int(365 * 2.5)
    start_date = end_date - datetime.timedelta(days=total_days)
    start_timestamp = int(start_date.timestamp())

    activities = session.exec(
        select(Activity).where(
            Activity.user_id == user_id,
            Activity.status == "created",
            Activity.start_time >= start_timestamp,
        )
    ).all()

    daily_scores = []

    for days_back in range(total_days):
        day_date = end_date - datetime.timedelta(days=days_back)
        day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + datetime.timedelta(days=1)

        day_end_ts = int(day_end.timestamp())

        fitness_window_start = day_start - datetime.timedelta(days=42)
        fitness_window_start_ts = int(fitness_window_start.timestamp())

        relevant_activities = [
            activity
            for activity in activities
            if fitness_window_start_ts <= activity.start_time < day_end_ts
        ]

        if not relevant_activities:
            daily_scores.append(
                {
                    "date": day_date.strftime("%Y-%m-%d"),
                    "overall": 0,
                    "running": 0,
                    "cycling": 0,
                    "swimming": 0,
                }
            )
            continue

        weighted_scores = {
            "overall": 0.0,
            "running": 0.0,
            "cycling": 0.0,
            "swimming": 0.0,
        }

        for activity in relevant_activities:
            days_before = (day_end_ts - activity.start_time) / 86400

            decay_factor = max(0.1, 1.0 - (days_before / 42) * 0.5)

            overall_score = calculate_activity_score(activity) * decay_factor
            running_score = calculate_activity_score(activity, "running") * decay_factor
            cycling_score = calculate_activity_score(activity, "cycling") * decay_factor
            swimming_score = (
                calculate_activity_score(activity, "swimming") * decay_factor
            )

            weighted_scores["overall"] += overall_score
            weighted_scores["running"] += running_score
            weighted_scores["cycling"] += cycling_score
            weighted_scores["swimming"] += swimming_score

        final_scores = {
            sport: min(200, max(0, int(score * 0.5)))
            for sport, score in weighted_scores.items()
        }

        daily_scores.append(
            {
                "date": day_date.strftime("%Y-%m-%d"),
                "overall": final_scores["overall"],
                "running": final_scores["running"],
                "cycling": final_scores["cycling"],
                "swimming": final_scores["swimming"],
            }
        )

    daily_scores.reverse()

    days_to_skip = total_days - 730

    weekly_tss_data = []
    weekly_running_data = []
    weekly_cycling_data = []
    weekly_swimming_data = []
    current_date = datetime.datetime.now()

    for weeks_back in range(104):
        week_start = current_date - datetime.timedelta(weeks=weeks_back)
        week_start = week_start - datetime.timedelta(days=week_start.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + datetime.timedelta(days=7)

        week_start_ts = int(week_start.timestamp())
        week_end_ts = int(week_end.timestamp())

        week_activities = [
            activity
            for activity in activities
            if week_start_ts <= activity.start_time < week_end_ts
        ]

        total_tss = sum(
            activity.training_stress_score or 0.0 for activity in week_activities
        )

        running_activities = [a for a in week_activities if a.sport == "running"]
        running_distance = sum(
            (a.total_distance or 0) / 1000.0 for a in running_activities
        )
        running_time = sum(
            (a.total_timer_time or 0) / 3600.0 for a in running_activities
        )
        cycling_activities = [a for a in week_activities if a.sport == "cycling"]
        cycling_distance = sum(
            (a.total_distance or 0) / 1000.0 for a in cycling_activities
        )
        cycling_time = sum(
            (a.total_timer_time or 0) / 3600.0 for a in cycling_activities
        )
        swimming_activities = [a for a in week_activities if a.sport == "swimming"]
        swimming_distance = sum(
            (a.total_distance or 0) / 1000.0 for a in swimming_activities
        )
        swimming_time = sum(
            (a.total_timer_time or 0) / 3600.0 for a in swimming_activities
        )

        week_str = week_start.strftime("%Y-%m-%d")

        weekly_tss_data.append({"week_start": week_str, "total_tss": total_tss})

        weekly_running_data.append(
            {
                "week_start": week_str,
                "distance": round(running_distance, 2),
                "time": round(running_time, 2),
            }
        )

        weekly_cycling_data.append(
            {
                "week_start": week_str,
                "distance": round(cycling_distance, 2),
                "time": round(cycling_time, 2),
            }
        )

        weekly_swimming_data.append(
            {
                "week_start": week_str,
                "distance": round(swimming_distance, 2),
                "time": round(swimming_time, 2),
            }
        )

    weekly_tss_data.reverse()
    weekly_running_data.reverse()
    weekly_cycling_data.reverse()
    weekly_swimming_data.reverse()

    # Get FTP data for the same time period (past 2 years)
    ftp_start_date = current_date - datetime.timedelta(days=730)
    ftp_records = session.exec(
        select(Ftp)
        .where(Ftp.user_id == user_id, Ftp.date >= ftp_start_date.date())
        .order_by(Ftp.date.asc())  # type: ignore[attr-defined]
    ).all()

    # Convert FTP records to the format expected by the frontend
    ftp_data = []
    for ftp_record in ftp_records:
        ftp_data.append(
            {"date": ftp_record.date.strftime("%Y-%m-%d"), "ftp": ftp_record.ftp}
        )

    # Calculate weekly zone data
    weekly_zones = calculate_weekly_zone_data(session, user_id, 104)

    return {
        "scores": daily_scores[days_to_skip:],
        "weekly_tss": weekly_tss_data,
        "weekly_running": weekly_running_data,
        "weekly_cycling": weekly_cycling_data,
        "weekly_swimming": weekly_swimming_data,
        "weekly_zones": weekly_zones,
        "ftp": ftp_data,
    }


def calculate_ftp_from_activities(
    session: Session, user_id: str, reference_date: datetime.date
) -> float:
    """Calculate FTP based on cycling activities from the past 6 months from a given date"""

    start_date = reference_date - datetime.timedelta(days=180)  # 6 months
    start_timestamp = int(
        datetime.datetime.combine(start_date, datetime.time.min).timestamp()
    )
    end_timestamp = int(
        datetime.datetime.combine(reference_date, datetime.time.max).timestamp()
    )

    cycling_activities = session.exec(
        select(Activity).where(
            Activity.user_id == user_id,
            Activity.status == "created",
            Activity.sport == "cycling",
            Activity.start_time >= start_timestamp,
            Activity.start_time <= end_timestamp,
            Activity.avg_power.is_not(None),  # type: ignore[union-attr]
        )
    ).all()

    if not cycling_activities:
        return 0.0

    # Calculate FTP using different methods and take the highest reasonable value
    ftp_estimates = []

    # Method 1: 95% of best 20-minute power (if we have NP power)
    twenty_min_powers = []
    for activity in cycling_activities:
        if (
            activity.np_power and activity.total_timer_time >= 1200
        ):  # At least 20 minutes
            twenty_min_powers.append(activity.np_power)

    if twenty_min_powers:
        best_20min = max(twenty_min_powers)
        ftp_estimates.append(best_20min * 0.95)

    # Method 2: 75% of best 5-minute power (approximated from max power)
    max_powers = [
        activity.max_power for activity in cycling_activities if activity.max_power
    ]
    if max_powers:
        best_5min_approx = max(max_powers) * 0.85  # Approximate 5-min from max power
        ftp_estimates.append(best_5min_approx * 0.75)

    # Method 3: Use average power from longer rides (>60 minutes) as baseline
    long_ride_avg_powers = []
    for activity in cycling_activities:
        if activity.total_timer_time >= 3600 and activity.avg_power:  # At least 1 hour
            # Weight by duration - longer rides get more weight
            duration_hours = activity.total_timer_time / 3600
            weight = min(duration_hours / 2, 2.0)  # Cap at 2x weight
            long_ride_avg_powers.extend([activity.avg_power] * int(weight))

    if long_ride_avg_powers:
        avg_long_ride_power = sum(long_ride_avg_powers) / len(long_ride_avg_powers)
        ftp_estimates.append(
            avg_long_ride_power * 1.1
        )  # Long ride power is typically 90% of FTP

    # Method 4: Use recent high-intensity activities
    recent_high_intensity = []
    for activity in cycling_activities:
        if (
            activity.avg_power
            and activity.total_timer_time >= 1800  # At least 30 minutes
            and activity.avg_power > 200
        ):  # Some reasonable power threshold
            recent_high_intensity.append(activity.avg_power)

    if recent_high_intensity:
        # Take top 25% of high-intensity rides
        recent_high_intensity.sort(reverse=True)
        top_quarter = recent_high_intensity[: max(1, len(recent_high_intensity) // 4)]
        avg_high_intensity = sum(top_quarter) / len(top_quarter)
        ftp_estimates.append(avg_high_intensity)

    if not ftp_estimates:
        # Fallback: use overall average power from all cycling activities
        all_avg_powers = [
            activity.avg_power for activity in cycling_activities if activity.avg_power
        ]
        if all_avg_powers:
            return sum(all_avg_powers) / len(all_avg_powers)
        return 0.0

    # Remove outliers (values more than 50% different from median)
    ftp_estimates.sort()
    if len(ftp_estimates) >= 3:
        median = ftp_estimates[len(ftp_estimates) // 2]
        filtered_estimates = [
            ftp for ftp in ftp_estimates if abs(ftp - median) / median <= 0.5
        ]
        if filtered_estimates:
            ftp_estimates = filtered_estimates

    # Return the average of remaining estimates
    return sum(ftp_estimates) / len(ftp_estimates)


def update_ftp_for_date(session: Session, user_id: str, date: datetime.date) -> None:
    """Update or create FTP record for a specific date based on past 6 months of activities"""

    calculated_ftp = calculate_ftp_from_activities(session, user_id, date)

    if calculated_ftp > 0:
        # Check if FTP record already exists for this date
        existing_ftp = session.exec(
            select(Ftp).where(Ftp.user_id == user_id, Ftp.date == date)
        ).first()

        if existing_ftp:
            existing_ftp.ftp = round(calculated_ftp)
        else:
            new_ftp = Ftp(user_id=user_id, date=date, ftp=round(calculated_ftp))
            session.add(new_ftp)

        session.commit()


def calculate_weekly_zone_data(session: Session, user_id: str, weeks: int = 104):
    """Calculate weekly zone data for heart rate, pace, and power zones"""
    current_date = datetime.datetime.now()

    # Get user's zones
    user_zones = session.exec(select(Zone).where(Zone.user_id == user_id)).all()

    # Group zones by type
    zones_by_type: ZonesByType = {}
    for zone in user_zones:
        if zone.type not in zones_by_type:
            zones_by_type[zone.type] = []
        zones_by_type[zone.type].append(zone)

    # Sort zones by index for each type
    for zone_type in zones_by_type:
        zones_by_type[zone_type].sort(key=lambda z: z.index)

    weekly_zone_data = []

    for weeks_back in range(weeks):
        week_start = current_date - datetime.timedelta(weeks=weeks_back)
        week_start = week_start - datetime.timedelta(days=week_start.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + datetime.timedelta(days=7)

        week_start_ts = int(week_start.timestamp())
        week_end_ts = int(week_end.timestamp())

        # Get activities for this week
        week_activities = session.exec(
            select(Activity).where(
                Activity.user_id == user_id,
                Activity.status == "created",
                Activity.start_time >= week_start_ts,
                Activity.start_time < week_end_ts,
            )
        ).all()

        activity_ids = [activity.id for activity in week_activities]

        # Initialize zone data for this week
        week_data: dict[str, Any] = {
            "week_start": week_start.strftime("%Y-%m-%d"),
            "heart_rate_zones": [],
            "pace_zones": [],
            "power_zones": [],
        }

        # Calculate heart rate zones split by sport
        if "heart_rate" in zones_by_type and activity_ids:
            hr_zone_times = session.exec(
                select(ActivityZoneHeartRate).where(
                    col(ActivityZoneHeartRate.activity_id).in_(activity_ids)
                )
            ).all()

            # Create a mapping from activity_id to sport
            activity_sports = {
                activity.id: activity.sport for activity in week_activities
            }

            hr_zone_totals: ZoneTimeData = {}
            hr_zone_running_totals: ZoneTimeData = {}
            hr_zone_cycling_totals: ZoneTimeData = {}

            for zone_time in hr_zone_times:
                zone_id = zone_time.zone_id
                activity_sport = activity_sports.get(zone_time.activity_id)

                if zone_id not in hr_zone_totals:
                    hr_zone_totals[zone_id] = 0.0
                    hr_zone_running_totals[zone_id] = 0.0
                    hr_zone_cycling_totals[zone_id] = 0.0

                hr_zone_totals[zone_id] += zone_time.time_in_zone

                if activity_sport == "running":
                    hr_zone_running_totals[zone_id] += zone_time.time_in_zone
                elif activity_sport == "cycling":
                    hr_zone_cycling_totals[zone_id] += zone_time.time_in_zone

            for zone in zones_by_type["heart_rate"]:
                total_time = hr_zone_totals.get(zone.id, 0.0)
                running_time = hr_zone_running_totals.get(zone.id, 0.0)
                cycling_time = hr_zone_cycling_totals.get(zone.id, 0.0)

                week_data["heart_rate_zones"].append(
                    {
                        "zone_index": zone.index,
                        "total_time": total_time,
                        "running_time": running_time,
                        "cycling_time": cycling_time,
                        "max_value": zone.max_value,
                    }
                )

        # Calculate pace zones
        if "pace" in zones_by_type and activity_ids:
            pace_zone_times = session.exec(
                select(ActivityZonePace).where(
                    col(ActivityZonePace.activity_id).in_(activity_ids)
                )
            ).all()

            pace_zone_totals: ZoneTimeData = {}
            for pace_zone_time in pace_zone_times:
                zone_id = pace_zone_time.zone_id
                if zone_id not in pace_zone_totals:
                    pace_zone_totals[zone_id] = 0.0
                pace_zone_totals[zone_id] += pace_zone_time.time_in_zone

            for zone in zones_by_type["pace"]:
                total_time = pace_zone_totals.get(zone.id, 0.0)
                week_data["pace_zones"].append(
                    {
                        "zone_index": zone.index,
                        "total_time": total_time,
                        "max_value": zone.max_value,
                    }
                )

        # Calculate power zones
        if "power" in zones_by_type and activity_ids:
            power_zone_times = session.exec(
                select(ActivityZonePower).where(
                    col(ActivityZonePower.activity_id).in_(activity_ids)
                )
            ).all()

            power_zone_totals: ZoneTimeData = {}
            for power_zone_time in power_zone_times:
                zone_id = power_zone_time.zone_id
                if zone_id not in power_zone_totals:
                    power_zone_totals[zone_id] = 0.0
                power_zone_totals[zone_id] += power_zone_time.time_in_zone

            for zone in zones_by_type["power"]:
                total_time = power_zone_totals.get(zone.id, 0.0)
                week_data["power_zones"].append(
                    {
                        "zone_index": zone.index,
                        "total_time": total_time,
                        "max_value": zone.max_value,
                    }
                )

        weekly_zone_data.append(week_data)

    weekly_zone_data.reverse()
    return weekly_zone_data
