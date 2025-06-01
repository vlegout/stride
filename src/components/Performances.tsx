import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

import { Performance } from "../types";
import { formatDistance, formatInterval } from "../utils";

const Performances = ({ performances }: { performances: Performance[] }) => {
  if (performances.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Distance</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {performances.map((performance) => (
            <TableRow key={performance.distance}>
              <TableCell>{formatDistance(performance.distance)}</TableCell>
              <TableCell>{formatInterval(performance.time)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Performances;
