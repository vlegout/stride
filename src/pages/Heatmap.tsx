import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { fetchHeatmap } from "../api";
import QueryBoundary from "../components/QueryBoundary";
import MapHeatmap from "../components/MapHeatmap";
import { PageHeader, SectionContainer } from "../components/ui";
import type { Sport } from "../types";

const Heatmap = () => {
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");

  const query = useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
  });

  const handleSportChange = (_: React.MouseEvent<HTMLElement>, newSport: Sport | "all" | null) => {
    if (newSport !== null) {
      setSportFilter(newSport);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Heatmap" />

      <QueryBoundary query={query} loadingMessage="Loading heatmap...">
        {(data) => {
          const filteredPolylines =
            sportFilter === "all" ? data.polylines : data.polylines.filter((p) => p.sport === sportFilter);

          return (
            <SectionContainer>
              <Box sx={{ mb: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Filter by sport:
                </Typography>
                <ToggleButtonGroup value={sportFilter} exclusive onChange={handleSportChange} size="small">
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="running">Running</ToggleButton>
                  <ToggleButton value="cycling">Cycling</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {filteredPolylines.length > 0 ? (
                <Box sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <MapHeatmap polylines={filteredPolylines} height="70vh" />
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No activities found. Upload some activities to see your heatmap.
                </Typography>
              )}
            </SectionContainer>
          );
        }}
      </QueryBoundary>
    </Box>
  );
};

export default Heatmap;
