// @ts-expect-error: no types for SVG
import LogoBike from "../data/bike.svg?react";
// @ts-expect-error: no types for SVG
import LogoRun from "../data/running.svg?react";
// @ts-expect-error: no types for SVG
import LogoSwim from "../data/swim.svg?react";
import type { Sport } from "../types";

const ActivityLogo = ({ sport, width = 40 }: { sport: Sport; width?: number }) => {
  switch (sport) {
    case "cycling":
      return <LogoBike style={{ width: `${width}px`, height: `${width}px` }} />;
    case "running":
      return <LogoRun style={{ width: `${width}px`, height: `${width}px` }} />;
    case "swimming":
      return <LogoSwim style={{ width: `${width}px`, height: `${width}px` }} />;
    default:
      return null;
  }
};

export default ActivityLogo;
