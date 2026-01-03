from sqlmodel import Session, select

from api.model import Activity, Lap, Tracepoint, Performance, PerformancePower, Zone
from api.utils import (
    _calculate_heart_rate_zones,
    _calculate_pace_zones,
    _calculate_power_zones,
)


class ActivityFormatter:
    def __init__(self, session: Session):
        self.session = session

    def format_activity(self, activity: Activity) -> str:
        return f"Activity: {activity}"

    def format_laps(self, laps: list[Lap], limit: int = 10) -> str:
        if not laps:
            return "No laps found"

        lines = ["Laps:"]
        for lap in laps[:limit]:
            lines.append(f"  {lap}")
        if len(laps) > limit:
            lines.append(f"  ... ({len(laps) - limit} more laps)")
        return "\n".join(lines)

    def format_tracepoints(self, tracepoints: list[Tracepoint], limit: int = 10) -> str:
        if not tracepoints:
            return "No tracepoints found"

        lines = ["Tracepoints:"]
        for tp in tracepoints[:limit]:
            lines.append(f"  {tp}")
        if len(tracepoints) > limit:
            lines.append(f"  ... ({len(tracepoints) - limit} more tracepoints)")
        return "\n".join(lines)

    def format_running_performances(self, performances: list[Performance]) -> str:
        if not performances:
            return "No running performances found"

        lines = ["Running Performances:"]
        for performance in performances:
            lines.append(f"  {performance.distance}m: {performance.time}")
        return "\n".join(lines)

    def format_cycling_performances(
        self, performance_powers: list[PerformancePower]
    ) -> str:
        if not performance_powers:
            return "No cycling power performances found"

        lines = ["Cycling Power Performances:"]
        for performance_power in performance_powers:
            lines.append(f"  {performance_power.time}: {performance_power.power}W")
        return "\n".join(lines)

    def format_zone_analysis(
        self,
        user_id: str,
        activity: Activity,
        tracepoints: list[Tracepoint],
    ) -> str:
        user_zones = self.session.exec(
            select(Zone).where(Zone.user_id == user_id)
        ).all()

        if not user_zones:
            return "Zone Analysis:\n  No zones found for user"

        heart_rate_zones = [z for z in user_zones if z.type == "heart_rate"]
        pace_zones = [z for z in user_zones if z.type == "pace"]
        power_zones = [z for z in user_zones if z.type == "power"]

        hr_zone_data_display = {}
        pace_zone_data_display = {}
        power_zone_data_display = {}

        if heart_rate_zones and any(tp.heart_rate for tp in tracepoints):
            hr_zone_data = _calculate_heart_rate_zones(heart_rate_zones, tracepoints)
            for zone in heart_rate_zones:
                if zone.id in hr_zone_data:
                    hr_zone_data_display[
                        f"HR Zone {zone.index} (≤{zone.max_value:.0f} bpm)"
                    ] = hr_zone_data[zone.id]

        if pace_zones and activity.sport == "running":
            pace_zone_data = _calculate_pace_zones(pace_zones, tracepoints)
            for zone in pace_zones:
                if zone.id in pace_zone_data:
                    pace_min = int(zone.max_value // 60)
                    pace_sec = int(zone.max_value % 60)

                    if zone.index == 5:
                        zone_label = (
                            f"Pace Zone {zone.index} (≤{pace_min}:{pace_sec:02d} /km)"
                        )
                    elif zone.index == 1:
                        zone_label = (
                            f"Pace Zone {zone.index} (>{pace_min}:{pace_sec:02d} /km)"
                        )
                    else:
                        faster_zone = next(
                            (z for z in pace_zones if z.index == zone.index + 1), None
                        )
                        if faster_zone:
                            faster_min = int(faster_zone.max_value // 60)
                            faster_sec = int(faster_zone.max_value % 60)
                            zone_label = f"Pace Zone {zone.index} ({faster_min}:{faster_sec:02d}-{pace_min}:{pace_sec:02d} /km)"
                        else:
                            zone_label = f"Pace Zone {zone.index} (≤{pace_min}:{pace_sec:02d} /km)"

                    pace_zone_data_display[zone_label] = pace_zone_data[zone.id]

        if (
            power_zones
            and activity.sport == "cycling"
            and any(tp.power for tp in tracepoints)
        ):
            power_zone_data = _calculate_power_zones(power_zones, tracepoints)
            for zone in power_zones:
                if zone.id in power_zone_data:
                    power_zone_data_display[
                        f"Power Zone {zone.index} (≤{zone.max_value:.0f} W)"
                    ] = power_zone_data[zone.id]

        if (
            not hr_zone_data_display
            and not pace_zone_data_display
            and not power_zone_data_display
        ):
            return "Zone Analysis:\n  No zone data calculated (missing sensor data or incompatible sport)"

        lines = ["Zone Analysis:", "  Time in zones:"]

        if hr_zone_data_display:
            hr_total_time = sum(hr_zone_data_display.values())
            for zone_name, time_seconds in sorted(hr_zone_data_display.items()):
                time_min = int(time_seconds // 60)
                time_sec = int(time_seconds % 60)
                percentage = (
                    (time_seconds / hr_total_time * 100) if hr_total_time > 0 else 0
                )
                lines.append(
                    f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                )

        if pace_zone_data_display:
            pace_total_time = sum(pace_zone_data_display.values())
            for zone_name, time_seconds in sorted(pace_zone_data_display.items()):
                time_min = int(time_seconds // 60)
                time_sec = int(time_seconds % 60)
                percentage = (
                    (time_seconds / pace_total_time * 100) if pace_total_time > 0 else 0
                )
                lines.append(
                    f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                )

        if power_zone_data_display:
            power_total_time = sum(power_zone_data_display.values())
            for zone_name, time_seconds in sorted(power_zone_data_display.items()):
                time_min = int(time_seconds // 60)
                time_sec = int(time_seconds % 60)
                percentage = (
                    (time_seconds / power_total_time * 100)
                    if power_total_time > 0
                    else 0
                )
                lines.append(
                    f"    {zone_name}: {time_min}:{time_sec:02d} ({percentage:.1f}%)"
                )

        return "\n".join(lines)
