use fit_rust::Fit;
use fit_rust::protocol::FitMessage;
use fit_rust::protocol::message_type::MessageType;
use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;
use std::fs;

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
                    lap = lap + 1;
                }
                MessageType::Record => {}
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
