import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";

export type DateRangeOption = "30d" | "90d" | "6m" | "1y";

interface DateSelectorProps {
  selectedRange: DateRangeOption;
  onChange: (range: DateRangeOption) => void;
}

const DateSelector = ({ selectedRange, onChange }: DateSelectorProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newRange: DateRangeOption) => {
    if (newRange !== null) {
      onChange(newRange);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
      <ToggleButtonGroup
        value={selectedRange}
        exclusive
        onChange={handleChange}
        aria-label="date range selector"
        size="small"
      >
        <ToggleButton value="30d" aria-label="30 days">
          30 days
        </ToggleButton>
        <ToggleButton value="90d" aria-label="90 days">
          90 days
        </ToggleButton>
        <ToggleButton value="6m" aria-label="6 months">
          6 months
        </ToggleButton>
        <ToggleButton value="1y" aria-label="1 year">
          1 year
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default DateSelector;
