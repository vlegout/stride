import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { Link as MuiLink } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchBestPerformances } from "../api";
import { formatDistance, formatDuration } from "../utils";
import LoadingIndicator from "../components/LoadingIndicator";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";

const Best = () => {
  const [sport, setSport] = useState("running");
  const [selectedDistance, setSelectedDistance] = useState("");
  const [selectedTime, setSelectedTime] = useState("42.195");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["best", sport, selectedDistance, selectedTime],
    queryFn: () =>
      fetchBestPerformances(
        sport,
        sport === "cycling" ? selectedDistance : undefined,
        sport === "running" ? selectedTime : undefined,
      ),
  });

  const cyclingDistances = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "20", label: "20 minutes" },
    { value: "60", label: "1 hour" },
  ];

  const runningDistances = [
    { value: "1", label: "1 km" },
    { value: "5", label: "5 km" },
    { value: "10", label: "10 km" },
    { value: "21.098", label: "Half Marathon" },
    { value: "42.195", label: "Marathon" },
  ];

  const handleSportChange = (newSport: string) => {
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

  const currentParameter =
    sport === "cycling"
      ? cyclingDistances.find((d) => d.value === selectedDistance)?.label || ""
      : runningDistances.find((d) => d.value === selectedTime)?.label || "";

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Best Performances" />

      <SectionContainer maxWidth={{ xs: "100%", sm: "800px", md: "1000px" }} centered variant="paper">
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sport</InputLabel>
                <Select value={sport} label="Sport" onChange={(e) => handleSportChange(e.target.value)}>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="cycling">Cycling</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{sport === "cycling" ? "Duration" : "Distance"}</InputLabel>
                <Select
                  value={sport === "cycling" ? selectedDistance : selectedTime}
                  label={sport === "cycling" ? "Duration" : "Distance"}
                  onChange={(e) => {
                    if (sport === "cycling") {
                      setSelectedDistance(e.target.value);
                    } else {
                      setSelectedTime(e.target.value);
                    }
                  }}
                >
                  {(sport === "cycling" ? cyclingDistances : runningDistances).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
            Best {currentParameter} {sport === "cycling" ? "Power" : "Times"}
          </Typography>
        </Box>

        <DataTable
          columns={columns}
          rows={rows}
          minWidth={isMobile ? 400 : 700}
          responsive
          emptyMessage={`No ${sport} performances found for ${currentParameter}`}
        />
      </SectionContainer>
    </Box>
  );
};

export default Best;
