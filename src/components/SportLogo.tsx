// @ts-expect-error: no types for SVG
import LogoBike from "../data/bike.svg?react";
// @ts-expect-error: no types for SVG
import LogoRun from "../data/running.svg?react";

const SportLogo = ({ sport, width = 40 }: { sport: string; width?: number }) => {
  switch (sport) {
    case "cycling":
      return <LogoBike style={{ width: `${width}px`, height: `${width}px` }} />;
    case "running":
      return <LogoRun style={{ width: `${width}px`, height: `${width}px` }} />;
    default:
      return null;
  }
};

export default SportLogo;
