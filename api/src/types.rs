pub enum Device {
    FR110,
    FR10,
    FR235,
    Edge530,
    FR745,
    Edge840,
    FR965,
    Unknown,
}

impl Device {
    pub fn from_id(id: u16) -> Device {
        match id {
            1124 => Device::FR110,
            1482 => Device::FR10,
            2431 => Device::FR235,
            3121 => Device::Edge530,
            3589 => Device::FR745,
            4062 => Device::Edge840,
            4315 => Device::FR965,
            _ => Device::Unknown,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Device::FR110 => "FR 110",
            Device::FR10 => "FR 10",
            Device::FR235 => "FR 235",
            Device::Edge530 => "Edge 530",
            Device::FR745 => "FR 745",
            Device::Edge840 => "Edge 840",
            Device::FR965 => "FR 965",
            Device::Unknown => "Unknown",
        }
    }
}

#[derive(pyo3::IntoPyObject)]
pub struct Lap {
    pub index: u16,
    pub start_time: u32,
    pub total_elapsed_time: u32,
    pub total_timer_time: u32,
    pub total_distance: u32,
    pub avg_heart_rate: u8,
    pub max_heart_rate: u8,
}

#[derive(pyo3::IntoPyObject)]
pub struct Point {
    pub lat: f32,
    pub lon: f32,
    pub timestamp: u32,
    pub distance: u32,
    pub heart_rate: u8,
    pub speed: u32,
    pub power: u16,
    pub altitude: u32,
    pub temperature: i8,
    pub cadence: u8,
}

#[derive(pyo3::IntoPyObject)]
pub struct Activity {
    pub sport: String,
    pub device: String,
    pub start_time: u32,
    pub timestamp: u32,
    pub total_timer_time: u32,
    pub total_elapsed_time: u32,
    pub total_distance: u32,
    pub total_ascent: u16,
    pub avg_speed: u32,
    pub avg_heart_rate: u8,
    pub max_heart_rate: u8,
    pub avg_cadence: u8,
    pub max_cadence: u8,
    pub avg_power: u16,
    pub max_power: u16,
    pub np_power: u16,
    pub total_calories: u16,
    pub total_training_effect: u8,
    pub training_stress_score: u16,
    pub intensity_factor: u16,
    pub avg_temperature: i8,
    pub max_temperature: i8,
    pub min_temperature: i8,
    pub pool_length: u16,
    pub num_lengths: u16,
}

#[derive(pyo3::IntoPyObject)]
pub struct FitStruct {
    pub activity: Activity,
    pub laps: Vec<Lap>,
    pub data_points: Vec<Point>,
}
