import datetime
from sqlmodel import Session, select
from api.model import Activity


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
    """Calculate fitness scores for a user over the past 1.5 years"""
    end_date = datetime.datetime.now()
    total_days = int(365 * 1.5)
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
                }
            )
            continue

        weighted_scores = {"overall": 0.0, "running": 0.0, "cycling": 0.0}

        for activity in relevant_activities:
            days_before = (day_end_ts - activity.start_time) / 86400

            decay_factor = max(0.1, 1.0 - (days_before / 42) * 0.5)

            overall_score = calculate_activity_score(activity) * decay_factor
            running_score = calculate_activity_score(activity, "running") * decay_factor
            cycling_score = calculate_activity_score(activity, "cycling") * decay_factor

            weighted_scores["overall"] += overall_score
            weighted_scores["running"] += running_score
            weighted_scores["cycling"] += cycling_score

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
            }
        )

    daily_scores.reverse()

    days_to_skip = total_days - 365

    weekly_tss_data = []
    weekly_running_data = []
    weekly_cycling_data = []
    current_date = datetime.datetime.now()

    for weeks_back in range(52):
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

    weekly_tss_data.reverse()
    weekly_running_data.reverse()
    weekly_cycling_data.reverse()

    return {
        "scores": daily_scores[days_to_skip:],
        "weekly_tss": weekly_tss_data,
        "weekly_running": weekly_running_data,
        "weekly_cycling": weekly_cycling_data,
    }
