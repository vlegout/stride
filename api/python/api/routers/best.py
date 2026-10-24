import datetime
from enum import StrEnum

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlmodel import Session

from api.dependencies import get_current_user_id, get_session
from api.model import (
    ActivityPublicWithoutTracepoints,
    BestPerformanceItem,
    BestPerformanceResponse,
    PowerProfileResponse,
    Sport,
)

router = APIRouter()


class CyclingDistance(StrEnum):
    one_minute = "1"
    five_minutes = "5"
    ten_minutes = "10"
    twenty_minutes = "20"
    one_hour = "60"
    two_hours = "120"
    four_hours = "240"


class RunningDistance(StrEnum):
    one_km = "1"
    five_km = "5"
    ten_km = "10"
    half_marathon = "21.098"
    full_marathon = "42.195"


@router.get("/best/", response_model=BestPerformanceResponse)
def read_best_performances(
    sport: Sport,
    distance: CyclingDistance | None = None,
    time: RunningDistance | None = None,
    year: int | None = None,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    # Validate parameters based on sport
    if sport == Sport.cycling:
        if distance is None:
            raise HTTPException(
                status_code=400, detail="Distance parameter required for cycling"
            )
        if time is not None:
            raise HTTPException(
                status_code=400, detail="Time parameter not valid for cycling"
            )
    elif sport == Sport.running:
        if time is None:
            raise HTTPException(
                status_code=400, detail="Time parameter required for running"
            )
        if distance is not None:
            raise HTTPException(
                status_code=400, detail="Distance parameter not valid for running"
            )

    performances = []

    if sport == Sport.cycling:
        assert distance is not None  # Validated above

        # Convert distance enum to timedelta (minutes)
        distance_mapping = {
            CyclingDistance.one_minute: datetime.timedelta(minutes=1),
            CyclingDistance.five_minutes: datetime.timedelta(minutes=5),
            CyclingDistance.ten_minutes: datetime.timedelta(minutes=10),
            CyclingDistance.twenty_minutes: datetime.timedelta(minutes=20),
            CyclingDistance.one_hour: datetime.timedelta(minutes=60),
            CyclingDistance.two_hours: datetime.timedelta(minutes=120),
            CyclingDistance.four_hours: datetime.timedelta(minutes=240),
        }

        target_time = distance_mapping[distance]

        # Query for cycling power performances
        query = """
            SELECT pp.power, a.*
            FROM performancepower pp
            JOIN activity a ON pp.activity_id = a.id
            WHERE a.user_id = :user_id AND a.status = 'created'
            AND pp.time = :target_time
        """
        params: dict[str, object] = {"user_id": user_id, "target_time": target_time}

        if year is not None:
            query += " AND EXTRACT(YEAR FROM to_timestamp(a.start_time)) = :year"
            params["year"] = year

        query += " ORDER BY pp.power DESC LIMIT 10"

        power_performances = session.execute(text(query).bindparams(**params)).all()  # ty: ignore[deprecated]

        for row in power_performances:
            power = row[0]
            activity_data = dict(row._mapping)
            del activity_data["power"]  # Remove power from activity data
            activity = ActivityPublicWithoutTracepoints(**activity_data)
            performances.append(BestPerformanceItem(value=power, activity=activity))

        parameter = distance.value

    elif sport == Sport.running:
        assert time is not None  # Validated above

        # Convert time enum to distance in meters
        time_mapping = {
            RunningDistance.one_km: 1000,
            RunningDistance.five_km: 5000,
            RunningDistance.ten_km: 10000,
            RunningDistance.half_marathon: 21097.5,
            RunningDistance.full_marathon: 42195,
        }

        target_distance = time_mapping[time]

        # Query for running performances (best times)
        query = """
            SELECT EXTRACT(EPOCH FROM p.time) as time_seconds, a.*
            FROM performance p
            JOIN activity a ON p.activity_id = a.id
            WHERE a.user_id = :user_id AND a.status = 'created'
            AND p.distance = :target_distance
            AND p.time IS NOT NULL
        """
        params = {"user_id": user_id, "target_distance": target_distance}

        if year is not None:
            query += " AND EXTRACT(YEAR FROM to_timestamp(a.start_time)) = :year"
            params["year"] = year

        query += " ORDER BY p.time ASC LIMIT 10"

        running_performances = session.execute(text(query).bindparams(**params)).all()  # ty: ignore[deprecated]

        for row in running_performances:
            time_seconds = row[0]
            activity_data = dict(row._mapping)
            del activity_data["time_seconds"]  # Remove time_seconds from activity data
            activity = ActivityPublicWithoutTracepoints(**activity_data)
            performances.append(
                BestPerformanceItem(value=time_seconds, activity=activity)
            )

        parameter = time.value

    return BestPerformanceResponse(
        sport=sport.value,
        parameter=parameter,
        performances=performances,
    )


@router.get("/best/power-profile/", response_model=PowerProfileResponse)
def read_power_profile(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    # Define time periods for power profile
    time_periods = [
        (datetime.timedelta(seconds=5), "5s"),
        (datetime.timedelta(seconds=15), "15s"),
        (datetime.timedelta(seconds=30), "30s"),
        (datetime.timedelta(minutes=1), "1min"),
        (datetime.timedelta(minutes=2), "2min"),
        (datetime.timedelta(minutes=5), "5min"),
        (datetime.timedelta(minutes=10), "10min"),
        (datetime.timedelta(minutes=20), "20min"),
        (datetime.timedelta(minutes=30), "30min"),
        (datetime.timedelta(minutes=60), "1h"),
        (datetime.timedelta(minutes=90), "1h30"),
        (datetime.timedelta(minutes=120), "2h"),
    ]

    labels = [label for _, label in time_periods]

    time_values = [t for t, _ in time_periods]

    # Single query to get max power per time period, both overall and by year
    query = """
        SELECT
            pp.time,
            MAX(pp.power) as max_power,
            EXTRACT(YEAR FROM to_timestamp(a.start_time))::int as year
        FROM performancepower pp
        JOIN activity a ON pp.activity_id = a.id
        WHERE a.user_id = :user_id
        AND a.status = 'created'
        AND pp.time = ANY(:time_values)
        GROUP BY pp.time, year
        ORDER BY year DESC, pp.time
    """
    results = session.execute(  # ty: ignore[deprecated]
        text(query).bindparams(user_id=user_id, time_values=time_values)
    ).all()

    # Build lookup: (time, year) -> power, and (time, None) -> overall max
    power_by_time_year: dict[tuple[datetime.timedelta, int | None], float] = {}
    available_years_set: set[int] = set()
    for row in results:
        time_val, power, year = row
        available_years_set.add(year)
        key = (time_val, year)
        power_by_time_year[key] = float(power) if power else 0.0
        # Track overall max
        overall_key = (time_val, None)
        if overall_key not in power_by_time_year:
            power_by_time_year[overall_key] = 0.0
        power_by_time_year[overall_key] = max(
            power_by_time_year[overall_key], float(power) if power else 0.0
        )

    available_years = sorted(available_years_set, reverse=True)

    # Build overall powers list
    overall_powers = [power_by_time_year.get((t, None), 0.0) for t, _ in time_periods]

    # Build years data
    years_data: dict[int, list[float]] = {}
    for year in available_years:
        years_data[year] = [
            power_by_time_year.get((t, year), 0.0) for t, _ in time_periods
        ]

    return PowerProfileResponse(
        labels=labels,
        overall=overall_powers,
        years=years_data,
        available_years=available_years,
    )
