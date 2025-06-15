import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Chart as ChartJS, BarElement, ChartOptions, LinearScale, CategoryScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";

import Performances from "../components/Performances";
import LoadingIndicator from "../components/LoadingIndicator";
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

  ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

  const weekOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => formatDistance(context.raw),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
    },
  };

  const weekData = {
    labels: data.weeks.map((week) => week.week),
    datasets: [
      {
        data: data.weeks.map((week) => week.statistics[0].total_distance),
      },
    ],
  };

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

      <SectionContainer title="Weekly Distance" maxWidth={{ xs: "100%", sm: "90%", md: "800px" }} centered>
        <Box sx={{ height: { xs: "200px", sm: "250px", md: "300px" } }}>
          <Bar options={weekOptions} data={weekData} />
        </Box>
      </SectionContainer>

      <SectionContainer title="Running Performances" maxWidth={{ xs: "100%", sm: "500px", md: "400px" }} centered>
        <Performances performances={data.running_performances} />
      </SectionContainer>

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
