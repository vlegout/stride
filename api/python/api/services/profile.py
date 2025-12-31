import datetime

from sqlmodel import Session, select, text

from api.model import Profile, Statistic, YearsStatistics, Zone, ZonePublic

STATISTICS_START_YEAR = 2013

type YearlyStats = dict[int, dict[str, dict[str, int | float]]]


class ProfileService:
    def __init__(self, session: Session):
        self.session = session

    def get_user_profile(self, user_id: str) -> Profile:
        current_date = datetime.datetime.now()

        overall_stats = self.session.exec(  # type: ignore[call-overload]
            text("""
                SELECT
                    COUNT(*) as total_activities,
                    COUNT(CASE WHEN sport = 'running' THEN 1 END) as run_activities,
                    COALESCE(SUM(CASE WHEN sport = 'running' THEN total_distance END), 0) as run_distance,
                    COUNT(CASE WHEN sport = 'cycling' THEN 1 END) as cycling_activities,
                    COALESCE(SUM(CASE WHEN sport = 'cycling' THEN total_distance END), 0) as cycling_distance,
                    COUNT(CASE WHEN sport = 'swimming' THEN 1 END) as swimming_activities,
                    COALESCE(SUM(CASE WHEN sport = 'swimming' THEN total_distance END), 0) as swimming_distance
                 FROM activity
                WHERE user_id = :user_id AND status = 'created'
            """).bindparams(user_id=user_id)
        ).one()

        yearly_stats = self.session.exec(  # type: ignore[call-overload]
            text("""
                SELECT
                    EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) as year,
                    sport,
                    COUNT(*) as n_activities,
                    COALESCE(SUM(total_distance), 0) as total_distance
                FROM activity
                WHERE user_id = :user_id AND status = 'created'
                AND EXTRACT(YEAR FROM TO_TIMESTAMP(start_time)) >= 2013
                GROUP BY year, sport
                ORDER BY year, sport
            """).bindparams(user_id=user_id)
        ).all()

        yearly_dict: YearlyStats = {}
        for row in yearly_stats:
            year = int(row[0])
            if year not in yearly_dict:
                yearly_dict[year] = {}
            yearly_dict[year][row[1]] = {
                "n_activities": row[2],
                "total_distance": row[3] or 0,
            }

        years_data = []
        for year in range(STATISTICS_START_YEAR, current_date.year + 1):
            year_data = yearly_dict.get(year, {})
            years_data.append(
                YearsStatistics(
                    year=year,
                    statistics=[
                        Statistic(
                            sport="running",
                            n_activities=int(
                                year_data.get("running", {}).get("n_activities", 0)
                            ),
                            total_distance=year_data.get("running", {}).get(
                                "total_distance", 0.0
                            ),
                        ),
                        Statistic(
                            sport="cycling",
                            n_activities=int(
                                year_data.get("cycling", {}).get("n_activities", 0)
                            ),
                            total_distance=year_data.get("cycling", {}).get(
                                "total_distance", 0.0
                            ),
                        ),
                        Statistic(
                            sport="swimming",
                            n_activities=int(
                                year_data.get("swimming", {}).get("n_activities", 0)
                            ),
                            total_distance=year_data.get("swimming", {}).get(
                                "total_distance", 0.0
                            ),
                        ),
                    ],
                )
            )

        zones = self.session.exec(
            select(Zone).where(Zone.user_id == user_id).order_by(Zone.type, Zone.index)  # type: ignore[arg-type]
        ).all()

        zones_public = [ZonePublic.model_validate(zone) for zone in zones]

        return Profile(
            n_activities=overall_stats[0],
            run_n_activities=overall_stats[1],
            run_total_distance=overall_stats[2] or 0.0,
            cycling_n_activities=overall_stats[3],
            cycling_total_distance=overall_stats[4] or 0.0,
            swimming_n_activities=overall_stats[5],
            swimming_total_distance=overall_stats[6] or 0.0,
            years=years_data,
            zones=zones_public,
        )
