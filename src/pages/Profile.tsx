import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";

import LoadingIndicator from "../components/LoadingIndicator";
import ZoneTables from "../components/ZoneTables";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";

const Profile = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["id"],
    queryFn: fetchProfile,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  const profileStatsColumns: Column[] = [
    {
      id: "metric",
      label: "Metric",
      width: "60%",
    },
    {
      id: "value",
      label: "Value",
      width: "40%",
    },
  ];

  const profileStatsRows = [
    { id: 1, metric: "Total Activities", value: data.n_activities },
    { id: 2, metric: "Run Total Activities", value: data.run_n_activities },
    { id: 3, metric: "Run Total Distance", value: formatDistance(data.run_total_distance) },
    { id: 4, metric: "Cycling Total Activities", value: data.cycling_n_activities },
    { id: 5, metric: "Cycling Total Distance", value: formatDistance(data.cycling_total_distance) },
  ];

  const yearlyStatsColumns: Column[] = [
    { id: "year", label: "Year" },
    { id: "run_activities", label: "Activities", align: "center" as const },
    { id: "run_distance", label: "Distance", align: "center" as const },
    { id: "cycling_activities", label: "Activities", align: "center" as const },
    { id: "cycling_distance", label: "Distance", align: "center" as const },
  ];

  const yearlyStatsRows = data.years.map((year) => ({
    id: year.year,
    year: year.year,
    run_activities: year.statistics[0].n_activities,
    run_distance: formatDistance(year.statistics[0].total_distance),
    cycling_activities: year.statistics[1].n_activities,
    cycling_distance: formatDistance(year.statistics[1].total_distance),
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Profile Statistics" />

      <SectionContainer maxWidth={{ xs: "100%", sm: "600px", md: "800px" }} centered variant="paper">
        <DataTable columns={profileStatsColumns} rows={profileStatsRows} minWidth={isMobile ? 300 : 650} responsive />
      </SectionContainer>

      <ZoneTables zones={data.zones} />

      <SectionContainer
        title="Yearly Statistics"
        maxWidth={{ xs: "100%", sm: "90%", md: "800px" }}
        centered
        variant="paper"
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>
              Running &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Cycling
            </Typography>
          </Box>
        </Box>
        <DataTable columns={yearlyStatsColumns} rows={yearlyStatsRows} minWidth={isMobile ? 400 : 650} responsive />
      </SectionContainer>
    </Box>
  );
};

export default Profile;
