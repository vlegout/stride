use fit_rust::Fit;
use fit_rust::protocol::FitMessage;
use fit_rust::protocol::message_type::MessageType;
use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;
use std::fs;

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

    total_calories: u16,
    total_training_effect: u8,
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
        dict.set_item("total_calories", self.total_calories)
            .unwrap();
        dict.set_item("total_training_effect", self.total_training_effect)
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
            total_calories: 0,
            total_training_effect: 0,
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
                            let device_id: u16 = value.value.clone().try_into().unwrap_or(0);
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
                                new_lap.start_time = value.value.clone().try_into().unwrap_or(0);
                            }
                            7 => {
                                new_lap.total_elapsed_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            8 => {
                                new_lap.total_timer_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            9 => {
                                new_lap.total_distance =
                                    value.value.clone().try_into().unwrap_or(0) / 100;
                            }
                            15 => {
                                new_lap.avg_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            16 => {
                                new_lap.max_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
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
                                point.lat = value.value.clone().try_into().unwrap_or(0.0);
                                if point.lat == 180.0 {
                                    point.lat = 0.0;
                                }
                            }
                            1 => {
                                point.lon = value.value.clone().try_into().unwrap_or(0.0);
                            }
                            3 => {
                                point.heart_rate = value.value.clone().try_into().unwrap_or(0);
                            }
                            5 => {
                                point.distance = value.value.clone().try_into().unwrap_or(0) / 100;
                            }
                            7 => {
                                point.power = value.value.clone().try_into().unwrap_or(0);
                                if point.power == 65535 {
                                    point.power = 0;
                                }
                            }
                            73 => {
                                point.speed = value.value.clone().try_into().unwrap_or(0);
                            }
                            78 => {
                                point.altitude = value.value.clone().try_into().unwrap_or(0);
                            }
                            253 => {
                                point.timestamp = value.value.clone().try_into().unwrap_or(0);
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
                                fit.activity.start_time =
                                    value.value.clone().try_into().unwrap_or(0);
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
                                fit.activity.total_elapsed_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            8 => {
                                fit.activity.total_timer_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            9 => {
                                fit.activity.total_distance =
                                    value.value.clone().try_into().unwrap_or(0);
                                fit.activity.total_distance = fit.activity.total_distance / 100;
                            }
                            11 => {
                                fit.activity.total_calories =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            16 => {
                                fit.activity.avg_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            17 => {
                                fit.activity.max_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            22 => {
                                fit.activity.total_ascent =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            24 => {
                                fit.activity.total_training_effect =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            124 => {
                                fit.activity.avg_speed =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            253 => {
                                fit.activity.timestamp =
                                    value.value.clone().try_into().unwrap_or(0);
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
fn scripts(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_fit, m)?)?;

    Ok(())
}
