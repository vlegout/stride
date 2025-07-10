import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";

interface PerformanceFiltersProps {
  sport: string;
  selectedDistance: string;
  selectedTime: string;
  selectedYear: string;
  onSportChange: (sport: string) => void;
  onDistanceChange: (distance: string) => void;
  onTimeChange: (time: string) => void;
  onYearChange: (year: string) => void;
}

const PerformanceFilters = ({
  sport,
  selectedDistance,
  selectedTime,
  selectedYear,
  onSportChange,
  onDistanceChange,
  onTimeChange,
  onYearChange,
}: PerformanceFiltersProps) => {
  const cyclingDistances = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "20", label: "20 minutes" },
    { value: "60", label: "1 hour" },
  ];

  const runningDistances = [
    { value: "1", label: "1 km" },
    { value: "5", label: "5 km" },
    { value: "10", label: "10 km" },
    { value: "21.098", label: "Half Marathon" },
    { value: "42.195", label: "Marathon" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "all", label: "All" },
    ...Array.from({ length: currentYear - 2012 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
    })),
  ];

  const currentParameter =
    sport === "cycling"
      ? cyclingDistances.find((d) => d.value === selectedDistance)?.label || ""
      : runningDistances.find((d) => d.value === selectedTime)?.label || "";

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Sport</InputLabel>
            <Select value={sport} label="Sport" onChange={(e) => onSportChange(e.target.value)}>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="cycling">Cycling</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>{sport === "cycling" ? "Duration" : "Distance"}</InputLabel>
            <Select
              value={sport === "cycling" ? selectedDistance : selectedTime}
              label={sport === "cycling" ? "Duration" : "Distance"}
              onChange={(e) => {
                if (sport === "cycling") {
                  onDistanceChange(e.target.value);
                } else {
                  onTimeChange(e.target.value);
                }
              }}
            >
              {(sport === "cycling" ? cyclingDistances : runningDistances).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} label="Year" onChange={(e) => onYearChange(e.target.value)}>
              {yearOptions.map((option) => (
                <MenuItem key={option.value || "all"} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
        Best {currentParameter} {sport === "cycling" ? "Power" : "Times"}
      </Typography>
    </Box>
  );
};

export default PerformanceFilters;
