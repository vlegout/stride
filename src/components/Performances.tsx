import { Performance } from "../types";
import { formatDistance, formatInterval } from "../utils";
import { DataTable, Column, SectionContainer } from "./ui";

const Performances = ({ performances, showTitle = true }: { performances: Performance[]; showTitle?: boolean }) => {
  if (performances.length === 0) {
    return null;
  }

  const columns: Column<Performance>[] = [
    {
      id: "distance",
      label: "Distance",
      format: (value) => formatDistance(value as number),
    },
    {
      id: "time",
      label: "Time",
      format: (value) => formatInterval(value as string),
    },
  ];

  return (
    <SectionContainer {...(showTitle ? { title: "Performances" } : {})}>
      <DataTable columns={columns} rows={performances} emptyMessage="No performances available" minWidth={200} />
    </SectionContainer>
  );
};

export default Performances;
