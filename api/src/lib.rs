use fit_rust::Fit;
use fit_rust::protocol::FitMessage;
use fit_rust::protocol::message_type::MessageType;
use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;
use std::fs;

fn extract_u8(value: &fit_rust::protocol::value::Value) -> u8 {
    value.clone().try_into().unwrap_or(0)
}

fn extract_u16(value: &fit_rust::protocol::value::Value) -> u16 {
    value.clone().try_into().unwrap_or(0)
}

fn extract_u32(value: &fit_rust::protocol::value::Value) -> u32 {
    value.clone().try_into().unwrap_or(0)
}

fn extract_f32(value: &fit_rust::protocol::value::Value) -> f32 {
    value.clone().try_into().unwrap_or(0.0)
}

fn sanitize_u16(value: u16) -> u16 {
    if value == u16::MAX { 0 } else { value }
}

fn sanitize_u32(value: u32) -> u32 {
    if value == u32::MAX { 0 } else { value }
}

enum Device {
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
    fn from_id(id: u16) -> Device {
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

    fn as_str(&self) -> &str {
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

struct Lap {
    index: u16,
    start_time: u32,
    total_elapsed_time: u32,
    total_timer_time: u32,
    total_distance: u32,
    avg_heart_rate: u8,
    max_heart_rate: u8,
}

struct Point {
    lat: f32,
    lon: f32,
    timestamp: u32,
    distance: u32,
    heart_rate: u8,
    speed: u32,
    power: u16,
    altitude: u32,
}

struct Activity {
    sport: String,

    device: String,

    start_time: u32,
    timestamp: u32,
    total_timer_time: u32,
    total_elapsed_time: u32,

    total_distance: u32,
    total_ascent: u16,

    avg_speed: u32,

    avg_heart_rate: u8,
    max_heart_rate: u8,

    avg_power: u16,
    max_power: u16,
    np_power: u16,

    total_calories: u16,
    total_training_effect: u8,
    training_stress_score: u16,
    intensity_factor: u16,
}

struct FitStruct {
    activity: Activity,
    laps: Vec<Lap>,
    data_points: Vec<Point>,
}

impl IntoPy<PyObject> for Lap {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        dict.set_item("index", self.index).unwrap();
        dict.set_item("start_time", self.start_time).unwrap();
        dict.set_item("total_elapsed_time", self.total_elapsed_time)
            .unwrap();
        dict.set_item("total_timer_time", self.total_timer_time)
            .unwrap();
        dict.set_item("total_distance", self.total_distance)
            .unwrap();
        dict.set_item("avg_heart_rate", self.avg_heart_rate)
            .unwrap();
        dict.set_item("max_heart_rate", self.max_heart_rate)
            .unwrap();
        dict.into()
    }
}

impl IntoPy<PyObject> for Point {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        dict.set_item("lat", self.lat).unwrap();
        dict.set_item("lon", self.lon).unwrap();
        dict.set_item("timestamp", self.timestamp).unwrap();
        dict.set_item("distance", self.distance).unwrap();
        dict.set_item("heart_rate", self.heart_rate).unwrap();
        dict.set_item("speed", self.speed).unwrap();
        dict.set_item("power", self.power).unwrap();
        dict.set_item("altitude", self.altitude).unwrap();
        dict.into()
    }
}

impl IntoPy<PyObject> for Activity {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        dict.set_item("sport", self.sport).unwrap();
        dict.set_item("device", self.device).unwrap();
        dict.set_item("start_time", self.start_time).unwrap();
        dict.set_item("timestamp", self.timestamp).unwrap();
        dict.set_item("total_timer_time", self.total_timer_time)
            .unwrap();
        dict.set_item("total_elapsed_time", self.total_elapsed_time)
            .unwrap();
        dict.set_item("total_distance", self.total_distance)
            .unwrap();
        dict.set_item("total_ascent", self.total_ascent).unwrap();
        dict.set_item("avg_speed", self.avg_speed).unwrap();
        dict.set_item("avg_heart_rate", self.avg_heart_rate)
            .unwrap();
        dict.set_item("max_heart_rate", self.max_heart_rate)
            .unwrap();
        dict.set_item("avg_power", self.avg_power).unwrap();
        dict.set_item("max_power", self.max_power).unwrap();
        dict.set_item("np_power", self.np_power).unwrap();
        dict.set_item("total_calories", self.total_calories)
            .unwrap();
        dict.set_item("total_training_effect", self.total_training_effect)
            .unwrap();
        dict.set_item("training_stress_score", self.training_stress_score)
            .unwrap();
        dict.set_item("intensity_factor", self.intensity_factor)
            .unwrap();
        dict.into()
    }
}

impl IntoPy<PyObject> for FitStruct {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        dict.set_item("activity", self.activity.into_py(py))
            .unwrap();
        dict.set_item("laps", self.laps.into_py(py)).unwrap();
        dict.set_item("data_points", self.data_points.into_py(py))
            .unwrap();
        dict.into()
    }
}

#[pyfunction]
fn get_fit(file_name: &str) -> FitStruct {
    let file = fs::read(file_name).unwrap();
    let fit_file: Fit = Fit::read(file).unwrap();

    let mut lap: u16 = 0;

    let mut fit = FitStruct {
        activity: Activity {
            sport: String::new(),
            device: String::new(),
            start_time: 0,
            timestamp: 0,
            total_timer_time: 0,
            total_elapsed_time: 0,
            total_distance: 0,
            total_ascent: 0,
            avg_speed: 0,
            avg_heart_rate: 0,
            max_heart_rate: 0,
            avg_power: 0,
            max_power: 0,
            np_power: 0,
            total_calories: 0,
            total_training_effect: 0,
            training_stress_score: 0,
            intensity_factor: 0,
        },
        laps: Vec::new(),
        data_points: Vec::new(),
    };

    for data in &fit_file.data {
        match data {
            FitMessage::Data(msg) => match msg.data.message_type {
                MessageType::DeviceInfo => {
                    for value in &msg.data.values {
                        if value.field_num == 4 && fit.activity.device == "" {
                            let device_id: u16 = extract_u16(&value.value);
                            fit.activity.device = Device::from_id(device_id).as_str().to_string();
                        }
                    }
                }
                MessageType::Lap => {
                    let mut new_lap = Lap {
                        index: lap,
                        start_time: 0,
                        total_elapsed_time: 0,
                        total_timer_time: 0,
                        total_distance: 0,
                        avg_heart_rate: 0,
                        max_heart_rate: 0,
                    };

                    for value in &msg.data.values {
                        new_lap.index = lap;
                        match value.field_num {
                            2 => {
                                new_lap.start_time = extract_u32(&value.value);
                            }
                            7 => {
                                new_lap.total_elapsed_time = extract_u32(&value.value) / 1000;
                            }
                            8 => {
                                new_lap.total_timer_time = extract_u32(&value.value) / 1000;
                            }
                            9 => {
                                new_lap.total_distance = extract_u32(&value.value) / 100;
                            }
                            15 => {
                                new_lap.avg_heart_rate = extract_u8(&value.value);
                            }
                            16 => {
                                new_lap.max_heart_rate = extract_u8(&value.value);
                            }
                            _ => {}
                        }
                    }

                    fit.laps.push(new_lap);
                    lap += 1;
                }
                MessageType::Record => {
                    let mut point = Point {
                        lat: 0.0,
                        lon: 0.0,
                        timestamp: 0,
                        distance: 0,
                        heart_rate: 0,
                        speed: 0,
                        power: 0,
                        altitude: 0,
                    };

                    for value in &msg.data.values {
                        match value.field_num {
                            0 => {
                                point.lat = extract_f32(&value.value);
                                if point.lat == 180.0 {
                                    point.lat = 0.0;
                                }
                            }
                            1 => {
                                point.lon = extract_f32(&value.value);
                            }
                            3 => {
                                point.heart_rate = extract_u8(&value.value);
                            }
                            5 => {
                                point.distance = extract_u32(&value.value) / 100;
                            }
                            7 => {
                                let raw_power: u16 = extract_u16(&value.value);
                                point.power = sanitize_u16(raw_power);
                            }
                            73 => {
                                point.speed = extract_u32(&value.value);
                            }
                            78 => {
                                point.altitude = extract_u32(&value.value);
                            }
                            253 => {
                                point.timestamp = extract_u32(&value.value);
                            }
                            _ => {}
                        }
                    }

                    if point.lat == 0.0 {
                        continue;
                    }

                    fit.data_points.push(point);
                }
                MessageType::Session => {
                    for value in &msg.data.values {
                        match value.field_num {
                            2 => {
                                fit.activity.start_time = extract_u32(&value.value);
                            }
                            5 => match value.value {
                                fit_rust::protocol::value::Value::Enum("running") => {
                                    fit.activity.sport = "running".to_string()
                                }
                                fit_rust::protocol::value::Value::Enum("cycling") => {
                                    fit.activity.sport = "cycling".to_string()
                                }
                                _ => {}
                            },
                            7 => {
                                fit.activity.total_elapsed_time = extract_u32(&value.value) / 1000;
                            }
                            8 => {
                                fit.activity.total_timer_time = extract_u32(&value.value) / 1000;
                            }
                            9 => {
                                fit.activity.total_distance = extract_u32(&value.value);
                                fit.activity.total_distance = fit.activity.total_distance / 100;
                            }
                            11 => {
                                fit.activity.total_calories = extract_u16(&value.value);
                            }
                            16 => {
                                fit.activity.avg_heart_rate = extract_u8(&value.value);
                            }
                            17 => {
                                fit.activity.max_heart_rate = extract_u8(&value.value);
                            }
                            20 => {
                                let raw_avg_power: u16 = extract_u16(&value.value);
                                fit.activity.avg_power = sanitize_u16(raw_avg_power);
                            }
                            21 => {
                                let raw_max_power: u16 = extract_u16(&value.value);
                                fit.activity.max_power = sanitize_u16(raw_max_power);
                            }
                            22 => {
                                fit.activity.total_ascent = extract_u16(&value.value);
                            }
                            24 => {
                                fit.activity.total_training_effect = extract_u8(&value.value);
                            }
                            34 => {
                                let raw_np_power: u16 = extract_u16(&value.value);
                                fit.activity.np_power = sanitize_u16(raw_np_power);
                            }
                            35 => {
                                let raw_tss: u16 = extract_u16(&value.value);
                                fit.activity.training_stress_score = sanitize_u16(raw_tss);
                            }
                            36 => {
                                let raw_if: u16 = extract_u16(&value.value);
                                fit.activity.intensity_factor = sanitize_u16(raw_if);
                            }
                            124 => {
                                let raw_avg_speed: u32 = extract_u32(&value.value);
                                fit.activity.avg_speed = sanitize_u32(raw_avg_speed);
                            }
                            253 => {
                                fit.activity.timestamp = extract_u32(&value.value);
                            }
                            _ => {}
                        }
                    }
                }
                _ => {}
            },
            _ => {}
        }
    }

    fit
}

#[pymodule]
fn api(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_fit, m)?)?;

    Ok(())
}
