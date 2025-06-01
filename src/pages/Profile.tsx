import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Chart as ChartJS, BarElement, ChartOptions, LinearScale, CategoryScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";

import Performances from "../components/Performances";

const Profile = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["id"],
    queryFn: fetchProfile,
  });

  if (isPending || isFetching || error) return "Loading...";

  ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

  const weekOptions: ChartOptions<"bar"> = {
    responsive: true,
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
    <Container maxWidth="lg">
      <Box maxWidth="800px" margin="auto" marginTop="20px">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
              <TableRow>
                <TableCell>Total Activities</TableCell>
                <TableCell>{data.n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Run Total Activities</TableCell>
                <TableCell>{data.run_n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Run Total Distance</TableCell>
                <TableCell>{formatDistance(data.run_total_distance)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cycling Total Activities</TableCell>
                <TableCell>{data.cycling_n_activities}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cycling Total Distance</TableCell>
                <TableCell>{formatDistance(data.cycling_total_distance)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box maxWidth="800px" margin="auto" marginTop="20px">
        <Bar height={"100px"} options={weekOptions} data={weekData} />
      </Box>
      <Box maxWidth="400px" margin="auto" marginTop="20px">
        <Performances performances={data.running_performances} />
      </Box>
      <Box maxWidth="800px" margin="auto" marginTop="20px">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell colSpan={2}>Running</TableCell>
                <TableCell colSpan={2}>Cycling</TableCell>
              </TableRow>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Activities</TableCell>
                <TableCell>Distance</TableCell>
                <TableCell>Activities</TableCell>
                <TableCell>Distance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.years.map((year) => (
                <TableRow key={year.year}>
                  <TableCell>{year.year}</TableCell>
                  <TableCell>{year.statistics[0].n_activities}</TableCell>
                  <TableCell>{formatDistance(year.statistics[0].total_distance)}</TableCell>
                  <TableCell>{year.statistics[1].n_activities}</TableCell>
                  <TableCell>{formatDistance(year.statistics[1].total_distance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Profile;
