import { Box, Flex } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { fetchProfile } from "../api";
import { formatDistance } from "../utils";
import { TableHead } from "@mui/material";

const Profile = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["id"],
    queryFn: fetchProfile,
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Flex justifyContent="center">
      <Box maxWidth="1200px">
        <Box>
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
        <Box marginTop="20px">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell colSpan={2}>Running</TableCell>
                  <TableCell colSpan={2}>Cycling</TableCell>
                  <TableCell colSpan={2}>Swimming</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Activities</TableCell>
                  <TableCell>Distance</TableCell>
                  <TableCell>Activities</TableCell>
                  <TableCell>Distance</TableCell>
                  <TableCell>Activities</TableCell>
                  <TableCell>Distance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.years.map((year) => (
                  <TableRow>
                    <TableCell>{year.year}</TableCell>
                    <>
                      {year.statistics.map((stat) => (
                        <>
                          <TableCell>{stat.n_activities}</TableCell>
                          <TableCell>{formatDistance(stat.total_distance)}</TableCell>
                        </>
                      ))}
                    </>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Flex>
  );
};

export default Profile;
