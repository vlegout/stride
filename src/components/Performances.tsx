import { Performance } from "../types";
import { formatDistance, formatInterval } from "../utils";
import { DataTable, Column, SectionContainer } from "./ui";
import { Link } from "react-router-dom";

const Performances = ({ performances, showTitle = true }: { performances: Performance[]; showTitle?: boolean }) => {
  if (performances.length === 0) {
    return null;
  }

  const columns: Column<Performance>[] = [
    {
      id: "distance",
      label: "Distance",
      render: (value, row) => (
        <Link to={`/activities/${row.activity_id}`} style={{ textDecoration: "none", color: "inherit" }}>
          {formatDistance(value as number)}
        </Link>
      ),
    },
    {
      id: "time",
      label: "Time",
      render: (value, row) => (
        <Link to={`/activities/${row.activity_id}`} style={{ textDecoration: "none", color: "inherit" }}>
          {formatInterval(value as string)}
        </Link>
      ),
    },
  ];

  return (
    <SectionContainer {...(showTitle ? { title: "Performances" } : {})}>
      <DataTable columns={columns} rows={performances} emptyMessage="No performances available" minWidth={200} />
    </SectionContainer>
  );
};

export default Performances;
