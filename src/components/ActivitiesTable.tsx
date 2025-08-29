import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";

import { fetchActivities, createActivitiesQueryKey } from "../api";
import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import { Activity, ActivitiesQueryParams, Sport } from "../types";
import ActivityLogo from "./ActivityLogo";
import { useActivitiesStore } from "../store";
import LoadingIndicator from "./LoadingIndicator";
import { DataTable, Column } from "./ui";

const ActivitiesTable = () => {
  const { sport, distance, race, page, order, orderBy, setPage, setOrder, setOrderBy } = useActivitiesStore();

  const queryParams: ActivitiesQueryParams = {
    sport,
    distance,
    fetchMap: false,
    limit: 10,
    race,
    page,
    order,
    orderBy,
  };

  const { data, error, isPending } = useQuery({
    queryKey: createActivitiesQueryKey(queryParams),
    queryFn: fetchActivities,
    placeholderData: keepPreviousData,
  });

  const sortHandler = (columnId: string) => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrderBy(columnId as keyof Activity);
    setOrder(newOrder);
  };

  const columns: Column<Activity>[] = [
    {
      id: "sport",
      label: "Sport",
      render: (value) => <ActivityLogo sport={value as Sport} width={25} />,
    },
    {
      id: "title",
      label: "Title",
      render: (value, row) => (
        <MuiLink component={Link} to={`/activities/${row.id}`}>
          {value as string}
        </MuiLink>
      ),
    },
    {
      id: "location",
      label: "Location",
      render: (_, row) => [row.city, row.country].filter(Boolean).join(", ") || "—",
    },
    {
      id: "start_time",
      label: "Start Time",
      format: (value) => formatDateTime(value as number),
    },
    {
      id: "total_distance",
      label: "Distance",
      sortable: true,
      format: (value) => formatDistance(value as number),
    },
    {
      id: "avg_speed",
      label: "Average Speed",
      sortable: true,
      format: (value) => formatSpeed(value as number),
    },
    {
      id: "avg_power",
      label: "Avg Power",
      sortable: true,
    },
    {
      id: "total_ascent",
      label: "Total Ascent",
      sortable: true,
    },
    {
      id: "total_calories",
      label: "Calories",
      sortable: true,
    },
    { id: "total_training_effect", label: "Training Effect" },
    {
      id: "training_stress_score",
      label: "TSS",
      sortable: true,
      format: (value) => (value ? Math.round(value as number).toString() : "—"),
    },
    {
      id: "race",
      label: "Race",
      render: (value) => (value ? "Yes" : "No"),
    },
    { id: "device", label: "Device" },
  ];

  if (isPending || error) return <LoadingIndicator message="Loading activities..." />;
  if (!data) return <LoadingIndicator message="Loading activities..." />;

  return (
    <>
      <DataTable
        columns={columns}
        rows={data.activities}
        sortColumn={orderBy}
        sortDirection={order}
        onSort={sortHandler}
        responsive
      />
      <Box margin={"auto"} marginTop="20px" display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil(data.pagination.total / data.pagination.per_page)}
          shape="rounded"
          page={page}
          onChange={(_event, value) => {
            setPage(value);
          }}
        />
      </Box>
    </>
  );
};

export default ActivitiesTable;
