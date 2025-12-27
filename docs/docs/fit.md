---
sidebar_position: 3
---

# FIT

Stride uses a parser to extract activity data from FIT files. The parser processes three main message types from the FIT protocol: Session, Lap, and Record.

## Session

Session messages contain overall activity summary data. Stride extracts the following fields:

| Field | Field Number | Data Type | Transformation | Description |
|-------|--------------|-----------|----------------|-------------|
| `start_time` | 2 | u32 | None | Activity start timestamp |
| `sport` | 5 | Enum | None | Sport type (running, cycling, swimming) |
| `total_elapsed_time` | 7 | u32 | ÷ 1000 | Total elapsed time in seconds |
| `total_timer_time` | 8 | u32 | ÷ 1000 | Total timer time in seconds |
| `total_distance` | 9 | u32 | ÷ 100 | Total distance in meters |
| `total_calories` | 11 | u16 | None | Total calories burned |
| `avg_heart_rate` | 16 | u8 | None | Average heart rate in bpm |
| `max_heart_rate` | 17 | u8 | None | Maximum heart rate in bpm |
| `avg_cadence` | 18 | u8 | None | Average cadence (rpm for cycling, spm for running) |
| `max_cadence` | 19 | u8 | None | Maximum cadence |
| `avg_power` | 20 | u16 | Sanitized | Average power in watts |
| `max_power` | 21 | u16 | Sanitized | Maximum power in watts |
| `total_ascent` | 22 | u16 | Sanitized | Total ascent in meters |
| `total_training_effect` | 24 | u8 | None | Training effect score |
| `num_lengths` | 33 | u16 | Sanitized | Number of pool lengths (swimming) |
| `np_power` | 34 | u16 | Sanitized | Normalized power in watts |
| `training_stress_score` | 35 | u16 | Sanitized | Training stress score (TSS) |
| `intensity_factor` | 36 | u16 | Sanitized | Intensity factor (IF) |
| `pool_length` | 44 | u16 | Sanitized, ÷ 100 | Pool length in meters (swimming) |
| `avg_temperature` | 57 | i8 | Sanitized | Average temperature in °C |
| `max_temperature` | 58 | i8 | Sanitized | Maximum temperature in °C |
| `min_temperature` | 150 | i8 | Sanitized | Minimum temperature in °C |
| `avg_speed` | 124 | u32 | Sanitized | Average speed in m/s |
| `timestamp` | 253 | u32 | None | End timestamp |

### Sport Types

The parser currently supports three sport types:
- **running**: Running activities
- **cycling**: Cycling activities
- **swimming**: Swimming activities

## Lap

Lap messages contain data for individual laps/segments within an activity. Each lap includes:

| Field | Field Number | Data Type | Transformation | Description |
|-------|--------------|-----------|----------------|-------------|
| `index` | - | u16 | Auto-incremented | Lap index (0-based) |
| `start_time` | 2 | u32 | None | Lap start timestamp |
| `total_elapsed_time` | 7 | u32 | ÷ 1000 | Total elapsed time in seconds |
| `total_timer_time` | 8 | u32 | ÷ 1000 | Total timer time in seconds |
| `total_distance` | 9 | u32 | ÷ 100 | Total distance in meters |
| `avg_heart_rate` | 15 | u8 | None | Average heart rate in bpm |
| `max_heart_rate` | 16 | u8 | None | Maximum heart rate in bpm |

The lap index is automatically incremented for each lap message encountered, starting from 0.

## Record

Record messages contain individual data points recorded during the activity. These are stored as track points on the map and used for detailed charts.

| Field | Field Number | Data Type | Transformation | Description |
|-------|--------------|-----------|----------------|-------------|
| `lat` | 0 | f32 | Special* | Latitude in degrees |
| `lon` | 1 | f32 | None | Longitude in degrees |
| `heart_rate` | 3 | u8 | None | Heart rate in bpm |
| `cadence` | 4 | u8 | None | Cadence (rpm for cycling, spm for running) |
| `distance` | 5 | u32 | ÷ 100 | Distance in meters |
| `power` | 7 | u16 | Sanitized | Power in watts |
| `temperature` | 13 | i8 | Sanitized | Temperature in °C |
| `speed` | 73 | u32 | None | Speed in m/s |
| `altitude` | 78 | u32 | None | Altitude in meters |
| `timestamp` | 253 | u32 | None | Timestamp |

*Latitude has special handling: values of 180.0 are converted to 0.0

## Data Transformations

### Division Transformations
- **÷ 1000**: Time values are stored in milliseconds in the FIT file and converted to seconds
- **÷ 100**: Distance and length values are stored in centimeters and converted to meters

### Sanitization
Sanitization removes invalid or placeholder values (typically maximum values like 65535 for u16 or 255 for u8) and replaces them with 0. This prevents displaying erroneous data from uninitialized or unavailable sensor readings.
