import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Chart as ChartJS, BarElement, ChartOptions, LinearScale, CategoryScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";

import Performances from "../components/Performances";
import LoadingIndicator from "../components/LoadingIndicator";

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

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant={isMobile ? "h6" : "h5"} sx={{ mb: { xs: 2, sm: 3 }, textAlign: "center" }}>
        Profile Statistics
      </Typography>

      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          maxWidth: { xs: "100%", sm: "600px", md: "800px" },
          mx: "auto",
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            "& .MuiTable-root": {
              minWidth: isMobile ? "300px" : "650px",
            },
          }}
        >
          <Table size={isMobile ? "small" : "medium"} aria-label="profile statistics">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>Total Activities</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>{data.n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>Run Total Activities</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>{data.run_n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>Run Total Distance</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>
                  {formatDistance(data.run_total_distance)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>Cycling Total Activities</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>{data.cycling_n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>Cycling Total Distance</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "inherit" }}>
                  {formatDistance(data.cycling_total_distance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          maxWidth: { xs: "100%", sm: "90%", md: "800px" },
          mx: "auto",
          height: { xs: "200px", sm: "250px", md: "300px" },
        }}
      >
        <Typography variant={isMobile ? "subtitle2" : "subtitle1"} sx={{ mb: 2, textAlign: "center" }}>
          Weekly Distance
        </Typography>
        <Bar options={weekOptions} data={weekData} />
      </Box>

      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          maxWidth: { xs: "100%", sm: "500px", md: "400px" },
          mx: "auto",
        }}
      >
        <Typography variant={isMobile ? "subtitle2" : "subtitle1"} sx={{ mb: 2, textAlign: "center" }}>
          Running Performances
        </Typography>
        <Performances performances={data.running_performances} />
      </Box>

      <Box
        sx={{
          maxWidth: { xs: "100%", sm: "90%", md: "800px" },
          mx: "auto",
        }}
      >
        <Typography variant={isMobile ? "subtitle2" : "subtitle1"} sx={{ mb: 2, textAlign: "center" }}>
          Yearly Statistics
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            "& .MuiTable-root": {
              minWidth: isMobile ? "400px" : "650px",
            },
          }}
        >
          <Table size={isMobile ? "small" : "medium"} aria-label="yearly statistics">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit", fontWeight: "bold" }}>Year</TableCell>
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={{ fontSize: isMobile ? "0.75rem" : "inherit", fontWeight: "bold" }}
                >
                  Running
                </TableCell>
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={{ fontSize: isMobile ? "0.75rem" : "inherit", fontWeight: "bold" }}
                >
                  Cycling
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "inherit" }}></TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "inherit" }}>Activities</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "inherit" }}>Distance</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "inherit" }}>Activities</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "inherit" }}>Distance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.years.map((year) => (
                <TableRow key={year.year}>
                  <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit" }}>{year.year}</TableCell>
                  <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit" }}>
                    {year.statistics[0].n_activities}
                  </TableCell>
                  <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit" }}>
                    {formatDistance(year.statistics[0].total_distance)}
                  </TableCell>
                  <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit" }}>
                    {year.statistics[1].n_activities}
                  </TableCell>
                  <TableCell sx={{ fontSize: isMobile ? "0.75rem" : "inherit" }}>
                    {formatDistance(year.statistics[1].total_distance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Profile;
