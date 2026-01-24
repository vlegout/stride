import datetime
from collections import defaultdict
from collections.abc import Sequence

from shapely.geometry import LineString
from sqlmodel import Session, col, select

from api.model import Activity, Heatmap, HeatmapPolyline, HeatmapPublic, Tracepoint

SIMPLIFICATION_TOLERANCE = 0.0001  # ~11 meters at equator


class HeatmapService:
    def __init__(self, session: Session):
        self.session = session

    def get_heatmap(self, user_id: str) -> HeatmapPublic | None:
        heatmap = self.session.exec(
            select(Heatmap).where(Heatmap.user_id == user_id)
        ).first()

        if not heatmap:
            return None

        polylines = [
            HeatmapPolyline(
                coordinates=p["coordinates"],
                sport=p["sport"],
            )
            for p in heatmap.polylines
        ]

        return HeatmapPublic(
            polylines=polylines,
            activity_count=heatmap.activity_count,
            point_count=heatmap.point_count,
            updated_at=heatmap.updated_at,
        )

    def compute_heatmap(self, user_id: str) -> HeatmapPublic:
        activities = self.session.exec(
            select(Activity).where(
                Activity.user_id == user_id,
                Activity.status == "created",
                Activity.sport != "swimming",
                col(Activity.lat).isnot(None),
            )
        ).all()

        activity_ids = [activity.id for activity in activities]
        activity_sport_map = {activity.id: activity.sport for activity in activities}

        all_tracepoints = self.session.exec(
            select(Tracepoint)
            .where(col(Tracepoint.activity_id).in_(activity_ids))
            .order_by(col(Tracepoint.activity_id), col(Tracepoint.timestamp))
        ).all()

        tracepoints_by_activity: dict[str, list[Tracepoint]] = defaultdict(list)
        for tp in all_tracepoints:
            tracepoints_by_activity[str(tp.activity_id)].append(tp)

        polylines: list[dict] = []
        total_points = 0

        for activity_id in activity_ids:
            tracepoints = tracepoints_by_activity.get(str(activity_id), [])

            if not tracepoints:
                continue

            coordinates = self._simplify_tracepoints(tracepoints)
            if len(coordinates) < 2:
                continue

            polylines.append(
                {
                    "coordinates": coordinates,
                    "sport": activity_sport_map[activity_id],
                }
            )
            total_points += len(coordinates)

        heatmap = self.session.exec(
            select(Heatmap).where(Heatmap.user_id == user_id)
        ).first()

        now = datetime.datetime.now(datetime.timezone.utc)

        if heatmap:
            heatmap.polylines = polylines
            heatmap.activity_count = len(activities)
            heatmap.point_count = total_points
            heatmap.updated_at = now
        else:
            heatmap = Heatmap(
                user_id=user_id,
                polylines=polylines,
                activity_count=len(activities),
                point_count=total_points,
                created_at=now,
                updated_at=now,
            )

        self.session.add(heatmap)
        self.session.commit()
        self.session.refresh(heatmap)

        polyline_models = [
            HeatmapPolyline(
                coordinates=p["coordinates"],
                sport=p["sport"],
            )
            for p in heatmap.polylines
        ]

        return HeatmapPublic(
            polylines=polyline_models,
            activity_count=heatmap.activity_count,
            point_count=heatmap.point_count,
            updated_at=heatmap.updated_at,
        )

    def _simplify_tracepoints(
        self, tracepoints: Sequence[Tracepoint]
    ) -> list[list[float]]:
        if len(tracepoints) < 2:
            return [[tp.lat, tp.lon] for tp in tracepoints]

        coords = [(tp.lon, tp.lat) for tp in tracepoints]
        line = LineString(coords)
        simplified = line.simplify(SIMPLIFICATION_TOLERANCE, preserve_topology=False)

        return [[lat, lon] for lon, lat in simplified.coords]
