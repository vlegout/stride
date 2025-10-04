import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import { Link as MuiLink } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchBestPerformances } from "../api";
import { formatDistance, formatDuration } from "../utils";
import LoadingIndicator from "../components/LoadingIndicator";
import PerformanceFilters from "../components/PerformanceFilters";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";

const Best = () => {
  const [sport, setSport] = useState("running");
  const [selectedDistance, setSelectedDistance] = useState("");
  const [selectedTime, setSelectedTime] = useState("42.195");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["best", sport, selectedDistance, selectedTime, selectedYear],
    queryFn: () =>
      fetchBestPerformances(
        sport,
        sport === "cycling" ? selectedDistance : undefined,
        sport === "running" ? selectedTime : undefined,
        selectedYear === "all" ? undefined : Number(selectedYear),
      ),
  });

  const handleSportChange = (newSport: string): void => {
    setSport(newSport);
    if (newSport === "cycling") {
      setSelectedDistance("1");
      setSelectedTime("");
    } else {
      setSelectedDistance("");
      setSelectedTime("42.195");
    }
  };

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading best performances..." />;
  }

  const columns: Column[] = [
    {
      id: "rank",
      label: "#",
      width: "10%",
      align: "center" as const,
    },
    {
      id: "value",
      label: sport === "cycling" ? "Power (W)" : "Time",
      width: "20%",
      align: "center" as const,
    },
    {
      id: "activity_title",
      label: "Activity",
      width: "35%",
      render: (value, row) => (
        <MuiLink component={Link} to={`/activities/${row.id}`}>
          {value as string}
        </MuiLink>
      ),
    },
    {
      id: "activity_date",
      label: "Date",
      width: "20%",
      align: "center" as const,
    },
    {
      id: "activity_distance",
      label: "Distance",
      width: "15%",
      align: "center" as const,
    },
  ];

  const rows =
    data?.performances.map((performance, index) => ({
      id: performance.activity.id,
      rank: index + 1,
      value: sport === "cycling" ? `${Math.round(performance.value)} W` : formatDuration(performance.value),
      activity_title: performance.activity.title,
      activity_date: new Date(performance.activity.start_time * 1000).toLocaleDateString(),
      activity_distance: formatDistance(performance.activity.total_distance),
    })) || [];

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Best Performances" />

      <SectionContainer maxWidth={{ xs: "100%", sm: "800px", md: "1000px" }} centered variant="paper">
        <PerformanceFilters
          sport={sport}
          selectedDistance={selectedDistance}
          selectedTime={selectedTime}
          selectedYear={selectedYear}
          onSportChange={handleSportChange}
          onDistanceChange={setSelectedDistance}
          onTimeChange={setSelectedTime}
          onYearChange={setSelectedYear}
        />

        <DataTable
          columns={columns}
          rows={rows}
          minWidth={isMobile ? 400 : 700}
          responsive
          emptyMessage={`No ${sport} performances found`}
        />
      </SectionContainer>
    </Box>
  );
};

export default Best;
