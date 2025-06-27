import { PowerPerformance } from "../types";
import { formatInterval } from "../utils";
import { DataTable, Column, SectionContainer } from "./ui";

const PowerPerformances = ({ performances }: { performances: PowerPerformance[] }) => {
  if (performances.length === 0) {
    return null;
  }

  const columns: Column<PowerPerformance>[] = [
    {
      id: "time",
      label: "Duration",
      format: (value) => formatInterval(value as string),
    },
    {
      id: "power",
      label: "Power (W)",
      format: (value) => `${Math.round(value as number)}W`,
    },
  ];

  return (
    <SectionContainer title="Power Performances">
      <DataTable columns={columns} rows={performances} emptyMessage="No power performances available" minWidth={200} />
    </SectionContainer>
  );
};

export default PowerPerformances;
