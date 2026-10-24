import datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from api.dependencies import get_current_user_id, get_session
from api.model import Activity, WeeklyActivitySummary, WeeklySummary, WeeksResponse

router = APIRouter()


@router.get("/weeks/", response_model=WeeksResponse)
def read_weeks(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
    offset: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=52),
):
    now = datetime.datetime.now()
    current_week_start = now - datetime.timedelta(days=now.weekday())
    current_week_start = current_week_start.replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Query enough activities to fill limit weeks (fetch limit+1 to check has_more)
    # Order by start_time desc and use offset to skip already-seen weeks
    range_end = current_week_start + datetime.timedelta(days=7)

    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == user_id, Activity.status == "created")
        .where(Activity.start_time < int(range_end.timestamp()))
        .order_by(Activity.start_time.desc())  # type: ignore
    ).all()

    # Group activities by week (year, week_number)
    weeks_map: dict[tuple[int, int], list[Activity]] = {}
    for activity in activities:
        activity_dt = datetime.datetime.fromtimestamp(activity.start_time)
        year, week_number, _ = activity_dt.isocalendar()
        key = (year, week_number)
        if key not in weeks_map:
            weeks_map[key] = []
        weeks_map[key].append(activity)

    # Sort weeks by date (most recent first)
    sorted_weeks = sorted(weeks_map.keys(), reverse=True)

    # Apply offset and limit to get the requested page of weeks
    paginated_weeks = sorted_weeks[offset : offset + limit]
    weeks_data = []

    for year, week_number in paginated_weeks:
        week_activities = weeks_map[(year, week_number)]

        # Calculate week start date
        week_start = datetime.datetime.strptime(
            f"{year}-W{week_number:02d}-1", "%G-W%V-%u"
        )

        # Create activity summaries
        activity_summaries = [
            WeeklyActivitySummary(
                id=activity.id,
                title=activity.title,
                sport=activity.sport,
                start_time=activity.start_time,
                total_distance=activity.total_distance,
                total_timer_time=activity.total_timer_time,
                avg_speed=activity.avg_speed,
                avg_heart_rate=activity.avg_heart_rate,
                avg_power=activity.avg_power,
                race=activity.race,
            )
            for activity in sorted(
                week_activities, key=lambda a: a.start_time, reverse=True
            )
        ]

        # Calculate week summary statistics
        total_activities = len(week_activities)
        total_distance = sum(a.total_distance for a in week_activities)
        total_time = sum(a.total_timer_time for a in week_activities)
        total_tss = sum(a.training_stress_score or 0.0 for a in week_activities)

        # Calculate sports breakdown
        sports_breakdown: dict[str, dict[str, float]] = {}
        for activity in week_activities:
            sport = activity.sport
            if sport not in sports_breakdown:
                sports_breakdown[sport] = {"distance": 0.0, "time": 0.0, "count": 0}
            sports_breakdown[sport]["distance"] += activity.total_distance
            sports_breakdown[sport]["time"] += activity.total_timer_time
            sports_breakdown[sport]["count"] += 1

        weeks_data.append(
            WeeklySummary(
                week_start=week_start,
                week_number=week_number,
                year=year,
                activities=activity_summaries,
                total_activities=total_activities,
                total_distance=total_distance,
                total_time=total_time,
                total_tss=total_tss,
                sports_breakdown=sports_breakdown,
            )
        )

    # has_more is true if there are more weeks beyond what we returned
    has_more = len(sorted_weeks) > offset + limit

    # next_offset points to the next set of weeks
    next_offset = offset + len(weeks_data)

    return WeeksResponse(weeks=weeks_data, has_more=has_more, next_offset=next_offset)
