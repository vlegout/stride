import time
import uuid

import httpx
from sqlmodel import Session, select

from api.model import Location, Activity, Tracepoint


class LocationService:
    def __init__(self, session: Session):
        self.session = session

    def fetch_location_from_api(
        self, lat: float, lon: float
    ) -> tuple[str | None, str | None, str | None]:
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"

        try:
            response = httpx.get(url, timeout=10.0, follow_redirects=True)
            response.raise_for_status()
            data = response.json()

            city = data.get("city") or data.get("locality")
            subdivision = data.get("principalSubdivision")
            country = data.get("countryName")

            return city, subdivision, country

        except (httpx.TimeoutException, httpx.RequestError, httpx.HTTPStatusError):
            return None, None, None

    def get_or_fetch_location(
        self, lat: float, lon: float
    ) -> tuple[str | None, str | None, str | None]:
        existing_location = self.session.exec(
            select(Location).where(Location.lat == lat, Location.lon == lon)
        ).first()

        if existing_location:
            return (
                existing_location.city,
                existing_location.subdivision,
                existing_location.country,
            )

        city, subdivision, country = self.fetch_location_from_api(lat, lon)

        if city is not None or subdivision is not None or country is not None:
            location = Location(
                id=uuid.uuid4(),
                lat=lat,
                lon=lon,
                city=city,
                subdivision=subdivision,
                country=country,
            )
            self.session.add(location)

        return city, subdivision, country

    def update_activity_location(self, activity: Activity) -> bool:
        if (
            activity.city is not None
            or activity.subdivision is not None
            or activity.country is not None
        ):
            return False

        first_tracepoint = self.session.exec(
            select(Tracepoint)
            .where(Tracepoint.activity_id == activity.id)
            .order_by(Tracepoint.timestamp)  # type: ignore[arg-type]
        ).first()

        if first_tracepoint is None:
            return False

        city, subdivision, country = self.get_or_fetch_location(
            first_tracepoint.lat, first_tracepoint.lon
        )

        if city is None and subdivision is None and country is None:
            return False

        activity.city = city
        activity.subdivision = subdivision
        activity.country = country

        return True

    def update_all_locations(self, rate_limit_seconds: float = 1.0) -> tuple[int, int]:
        activities = self.session.exec(select(Activity)).all()
        updated_count = 0
        last_api_call = 0.0

        for activity in activities:
            if self.update_activity_location(activity):
                current_time = time.time()
                if current_time - last_api_call < rate_limit_seconds:
                    time.sleep(rate_limit_seconds - (current_time - last_api_call))

                last_api_call = time.time()
                updated_count += 1

        self.session.commit()
        return updated_count, len(activities)
