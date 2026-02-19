import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";

import QueryBoundary from "../components/QueryBoundary";
import ZoneTables from "../components/ZoneTables";
import { PageHeader, DataTable, SectionContainer, type Column } from "../components/ui";
import { useAuthStore } from "../store";

const Profile = () => {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ["id"],
    queryFn: fetchProfile,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <QueryBoundary query={query} loadingMessage="Loading profile...">
      {(data) => {
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

        const runningEnabled = user?.running_enabled ?? true;
        const cyclingEnabled = user?.cycling_enabled ?? true;
        const swimmingEnabled = user?.swimming_enabled ?? true;

        const profileStatsRows = [
          { id: 1, metric: "Total Activities", value: data.n_activities },
          ...(runningEnabled
            ? [
                { id: 2, metric: "Run Total Activities", value: data.run_n_activities },
                { id: 3, metric: "Run Total Distance", value: formatDistance(data.run_total_distance) },
              ]
            : []),
          ...(cyclingEnabled
            ? [
                { id: 4, metric: "Cycling Total Activities", value: data.cycling_n_activities },
                { id: 5, metric: "Cycling Total Distance", value: formatDistance(data.cycling_total_distance) },
              ]
            : []),
          ...(swimmingEnabled
            ? [
                { id: 6, metric: "Swimming Total Activities", value: data.swimming_n_activities },
                { id: 7, metric: "Swimming Total Distance", value: formatDistance(data.swimming_total_distance) },
              ]
            : []),
        ];

        const yearlyStatsColumns: Column[] = [
          { id: "year", label: "Year" },
          ...(runningEnabled
            ? [
                { id: "run_activities", label: "Activities", align: "center" as const },
                { id: "run_distance", label: "Distance", align: "center" as const },
              ]
            : []),
          ...(cyclingEnabled
            ? [
                { id: "cycling_activities", label: "Activities", align: "center" as const },
                { id: "cycling_distance", label: "Distance", align: "center" as const },
              ]
            : []),
          ...(swimmingEnabled
            ? [
                { id: "swimming_activities", label: "Activities", align: "center" as const },
                { id: "swimming_distance", label: "Distance", align: "center" as const },
              ]
            : []),
        ];

        const yearlyStatsRows = data.years.map((year) => {
          const statsBySport = Object.fromEntries(year.statistics.map((s) => [s.sport, s]));
          return {
            id: year.year,
            year: year.year,
            ...(runningEnabled && {
              run_activities: statsBySport.running?.n_activities ?? 0,
              run_distance: formatDistance(statsBySport.running?.total_distance ?? 0),
            }),
            ...(cyclingEnabled && {
              cycling_activities: statsBySport.cycling?.n_activities ?? 0,
              cycling_distance: formatDistance(statsBySport.cycling?.total_distance ?? 0),
            }),
            ...(swimmingEnabled && {
              swimming_activities: statsBySport.swimming?.n_activities ?? 0,
              swimming_distance: formatDistance(statsBySport.swimming?.total_distance ?? 0),
            }),
          };
        });

        return (
          <Box sx={{ width: "100%" }}>
            <PageHeader title="Profile Statistics" />

            <SectionContainer maxWidth={{ xs: "100%", sm: "600px", md: "800px" }} centered variant="paper">
              <DataTable
                columns={profileStatsColumns}
                rows={profileStatsRows}
                minWidth={isMobile ? 300 : 650}
                responsive
              />
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
                    {[runningEnabled && "Running", cyclingEnabled && "Cycling", swimmingEnabled && "Swimming"]
                      .filter(Boolean)
                      .join("\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0")}
                  </Typography>
                </Box>
              </Box>
              <DataTable
                columns={yearlyStatsColumns}
                rows={yearlyStatsRows}
                minWidth={isMobile ? 400 : 650}
                responsive
              />
            </SectionContainer>
          </Box>
        );
      }}
    </QueryBoundary>
  );
};

export default Profile;
