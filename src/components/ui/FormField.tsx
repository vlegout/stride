import {
  FormControl,
  FormControlLabel,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Slider,
  Box,
  Typography,
  Button,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export interface SelectOption {
  value: string | number;
  label: string;
}

interface FormFieldProps {
  type: "text" | "select" | "checkbox" | "slider" | "file";
  label: string;
  value?: unknown;
  onChange?: (value: unknown, event?: Event | React.ChangeEvent<HTMLInputElement> | React.SyntheticEvent) => void;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;

  // Select specific
  options?: SelectOption[];

  // Checkbox specific
  checkboxProps?: {
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };

  // Slider specific
  sliderProps?: {
    min: number;
    max: number;
    valueLabelDisplay?: "auto" | "on" | "off";
    onChangeCommitted?: (event: React.SyntheticEvent | Event, value: number | number[]) => void;
  };

  // File specific
  fileProps?: {
    accept?: string;
    fileName?: string;
  };
}

const FormField = ({
  type,
  label,
  value,
  onChange,
  fullWidth = true,
  required = false,
  disabled = false,
  error = false,
  placeholder,
  options = [],
  checkboxProps,
  sliderProps,
  fileProps,
}: FormFieldProps) => {
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (onChange) {
      onChange(event.target.value, event);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent): void => {
    if (onChange) {
      onChange(event.target.value, event);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (onChange) {
      onChange(file, event);
    }
  };

  const renderField = (): React.ReactNode => {
    switch (type) {
      case "text":
        return (
          <TextField
            label={label}
            value={value || ""}
            onChange={handleTextChange}
            fullWidth={fullWidth}
            required={required}
            disabled={disabled}
            error={error}
            size="medium"
            variant="outlined"
            {...(placeholder && { placeholder })}
          />
        );

      case "select":
        return (
          <FormControl fullWidth={fullWidth} required={required} disabled={disabled} error={error} size="medium">
            <InputLabel id={`${label}-label`}>{label}</InputLabel>
            <Select
              labelId={`${label}-label`}
              value={(value as string) || ""}
              label={label}
              onChange={handleSelectChange}
              variant="outlined"
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControl error={error} disabled={disabled}>
            <FormControlLabel
              control={
                <Checkbox checked={checkboxProps?.checked || false} onChange={checkboxProps?.onChange} size="medium" />
              }
              label={label}
              sx={{ width: fullWidth ? "100%" : "auto" }}
            />
          </FormControl>
        );

      case "slider":
        return (
          <FormControl fullWidth={fullWidth} disabled={disabled} error={error}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Box>
            <Box sx={{ px: { xs: 2, sm: 3 } }}>
              <Slider
                value={(value as number | number[]) || 0}
                onChange={(event, newValue) => onChange?.(newValue, event)}
                {...(sliderProps?.onChangeCommitted && { onChangeCommitted: sliderProps.onChangeCommitted })}
                min={sliderProps?.min || 0}
                max={sliderProps?.max || 100}
                valueLabelDisplay={sliderProps?.valueLabelDisplay || "auto"}
                disabled={disabled}
                sx={{
                  "& .MuiSlider-thumb": {
                    width: { xs: 20, sm: 24 },
                    height: { xs: 20, sm: 24 },
                  },
                }}
              />
            </Box>
          </FormControl>
        );

      case "file":
        return (
          <Box>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={disabled}
              sx={{ mb: 1 }}
            >
              {label}
              <VisuallyHiddenInput type="file" accept={fileProps?.accept} onChange={handleFileChange} />
            </Button>
            {fileProps?.fileName && (
              <Typography variant="body2" color="text.secondary">
                Selected: {fileProps.fileName}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return renderField();
};

export default FormField;
