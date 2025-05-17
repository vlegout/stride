import { Box } from "@chakra-ui/react";
import { Paper, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

import { Performance } from "../types";
import { formatDistance } from "../utils";

const Performances = ({ performances }: { performances: Performance[] }) => {
  return (
    <Box>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Distance</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {performances.map((performance) => (
            <TableRow>
              <TableCell>{formatDistance(performance.distance)}</TableCell>
              <TableCell>{performance.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContainer>
    </Box>
  );
};

export default Performances;
