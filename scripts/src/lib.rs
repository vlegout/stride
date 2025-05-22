use fit_rust::Fit;
use fit_rust::protocol::FitMessage;
use fit_rust::protocol::message_type::MessageType;
use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;
use std::fs;

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
    enhanced_speed: u32,
    power: u16,
    enhanced_altitude: u32,
}

struct Session {
    sport: u8,

    device: u16,

    start_time: u32,
    timestamp: u32,
    total_timer_time: u32,
    total_elapsed_time: u32,

    total_distance: u32,
    total_ascent: u16,

    enhanced_avg_speed: u32,

    avg_heart_rate: u8,
    max_heart_rate: u8,

    total_calories: u16,
    total_training_effect: u8,

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
        dict.set_item("enhanced_speed", self.enhanced_speed)
            .unwrap();
        dict.set_item("power", self.power).unwrap();
        dict.set_item("enhanced_altitude", self.enhanced_altitude)
            .unwrap();
        dict.into()
    }
}

impl IntoPy<PyObject> for Session {
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
        dict.set_item("enhanced_avg_speed", self.enhanced_avg_speed)
            .unwrap();
        dict.set_item("avg_heart_rate", self.avg_heart_rate)
            .unwrap();
        dict.set_item("max_heart_rate", self.max_heart_rate)
            .unwrap();
        dict.set_item("total_calories", self.total_calories)
            .unwrap();
        dict.set_item("total_training_effect", self.total_training_effect)
            .unwrap();
        dict.set_item("laps", self.laps.into_py(py)).unwrap();
        dict.set_item("data_points", self.data_points.into_py(py))
            .unwrap();
        dict.into()
    }
}

#[pyfunction]
fn get_device_info(file_name: &str) -> Session {
    let file = fs::read(file_name).unwrap();
    let fit: Fit = Fit::read(file).unwrap();

    let mut lap: u16 = 0;

    let mut session = Session {
        sport: 0,

        device: 0,

        start_time: 0,
        timestamp: 0,
        total_timer_time: 0,
        total_elapsed_time: 0,

        total_distance: 0,
        total_ascent: 0,

        enhanced_avg_speed: 0,

        avg_heart_rate: 0,
        max_heart_rate: 0,

        total_calories: 0,
        total_training_effect: 0,

        laps: Vec::new(),
        data_points: Vec::new(),
    };

    for data in &fit.data {
        match data {
            FitMessage::Data(msg) => match msg.data.message_type {
                MessageType::DeviceInfo => {
                    for value in &msg.data.values {
                        if value.field_num == 4 && session.device == 0 {
                            session.device = value.value.clone().try_into().unwrap_or(0);
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

                    session.laps.push(new_lap);
                    lap += 1;
                }
                MessageType::Record => {
                    let mut point = Point {
                        lat: 0.0,
                        lon: 0.0,
                        timestamp: 0,
                        distance: 0,
                        heart_rate: 0,
                        enhanced_speed: 0,
                        power: 0,
                        enhanced_altitude: 0,
                    };

                    for value in &msg.data.values {
                        match value.field_num {
                            0 => {
                                point.lat = value.value.clone().try_into().unwrap_or(0.0);
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
                            }
                            73 => {
                                point.enhanced_speed = value.value.clone().try_into().unwrap_or(0);
                            }
                            78 => {
                                point.enhanced_altitude =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            253 => {
                                point.timestamp = value.value.clone().try_into().unwrap_or(0);
                            }
                            _ => {}
                        }
                    }

                    session.data_points.push(point);
                }
                MessageType::Session => {
                    for value in &msg.data.values {
                        match value.field_num {
                            2 => {
                                session.start_time = value.value.clone().try_into().unwrap_or(0);
                            }
                            5 => match value.value {
                                fit_rust::protocol::value::Value::Enum("running") => {
                                    session.sport = 1
                                }
                                fit_rust::protocol::value::Value::Enum("cycling") => {
                                    session.sport = 2
                                }
                                _ => {}
                            },
                            7 => {
                                session.total_elapsed_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            8 => {
                                session.total_timer_time =
                                    value.value.clone().try_into().unwrap_or(0) / 1000;
                            }
                            9 => {
                                session.total_distance =
                                    value.value.clone().try_into().unwrap_or(0);
                                session.total_distance = session.total_distance / 100;
                            }
                            11 => {
                                session.total_calories =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            16 => {
                                session.avg_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            17 => {
                                session.max_heart_rate =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            22 => {
                                session.total_ascent = value.value.clone().try_into().unwrap_or(0);
                            }
                            24 => {
                                session.total_training_effect =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            124 => {
                                session.enhanced_avg_speed =
                                    value.value.clone().try_into().unwrap_or(0);
                            }
                            253 => {
                                session.timestamp = value.value.clone().try_into().unwrap_or(0);
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

    session
}

#[pymodule]
fn scripts(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_device_info, m)?)?;

    Ok(())
}
