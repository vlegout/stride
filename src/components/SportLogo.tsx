// @ts-expect-error: no types for SVG
import LogoBike from "../data/bike.svg?react";
// @ts-expect-error: no types for SVG
import LogoRun from "../data/running.svg?react";

const SportLogo = ({ sport }: { sport: string }) => {
  switch (sport) {
    case "cycling":
      return <LogoBike style={{ width: "40px", height: "40px" }} />;
    case "running":
      return <LogoRun style={{ width: "40px", height: "40px" }} />;
    default:
      return null;
  }
};

export default SportLogo;
