import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Zone } from "../types";
import { DataTable, Column, SectionContainer } from "./ui";

interface ZoneTablesProps {
  zones: Zone[];
}

const ZoneTables: React.FC<ZoneTablesProps> = ({ zones }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Group zones by type
  const heartRateZones = zones.filter((zone) => zone.type === "heart_rate");
  const paceZones = zones.filter((zone) => zone.type === "pace");
  const powerZones = zones.filter((zone) => zone.type === "power");

  const zoneColumns: Column[] = [
    {
      id: "zone",
      label: "Zone",
      width: "30%",
      align: "center" as const,
    },
    {
      id: "max_value",
      label: "Max Value",
      width: "70%",
      align: "center" as const,
    },
  ];

  const formatHeartRateValue = (value: number) => `${Math.round(value)} bpm`;
  const formatPaceValue = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };
  const formatPowerValue = (value: number) => `${Math.round(value)} W`;

  const createZoneRows = (zones: Zone[], formatter: (value: number) => string) =>
    zones
      .sort((a, b) => a.index - b.index)
      .map((zone) => ({
        id: zone.id,
        zone: `Zone ${zone.index}`,
        max_value: formatter(zone.max_value),
      }));

  const heartRateRows = createZoneRows(heartRateZones, formatHeartRateValue);
  const paceRows = createZoneRows(paceZones, formatPaceValue);
  const powerRows = createZoneRows(powerZones, formatPowerValue);

  if (zones.length === 0) {
    return (
      <SectionContainer title="Training Zones" centered variant="paper">
        <Typography variant="body2" color="text.secondary" align="center">
          No training zones available
        </Typography>
      </SectionContainer>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {heartRateZones.length > 0 && (
        <SectionContainer
          title="Heart Rate Zones"
          maxWidth={{ xs: "100%", sm: "400px", md: "350px" }}
          centered
          variant="paper"
        >
          <DataTable columns={zoneColumns} rows={heartRateRows} minWidth={isMobile ? 250 : 300} responsive />
        </SectionContainer>
      )}

      {paceZones.length > 0 && (
        <SectionContainer
          title="Pace Zones"
          maxWidth={{ xs: "100%", sm: "400px", md: "350px" }}
          centered
          variant="paper"
        >
          <DataTable columns={zoneColumns} rows={paceRows} minWidth={isMobile ? 250 : 300} responsive />
        </SectionContainer>
      )}

      {powerZones.length > 0 && (
        <SectionContainer
          title="Power Zones"
          maxWidth={{ xs: "100%", sm: "400px", md: "350px" }}
          centered
          variant="paper"
        >
          <DataTable columns={zoneColumns} rows={powerRows} minWidth={isMobile ? 250 : 300} responsive />
        </SectionContainer>
      )}
    </Box>
  );
};

export default ZoneTables;
