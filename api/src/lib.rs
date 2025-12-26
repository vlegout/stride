mod types;
mod utils;

use fit_rust::Fit;
use fit_rust::protocol::FitMessage;
use fit_rust::protocol::message_type::MessageType;
use pyo3::prelude::*;
use std::fs;

use types::{Activity, Device, FitStruct, Lap, Point};
use utils::{
    extract_f32, extract_i8, extract_u8, extract_u16, extract_u32, sanitize_i8, sanitize_u16,
    sanitize_u32,
};

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
            avg_temperature: 0,
            max_temperature: 0,
            min_temperature: 0,
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
                        temperature: 0,
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
                            13 => {
                                let raw_temp: i8 = extract_i8(&value.value);
                                point.temperature = sanitize_i8(raw_temp);
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
                                fit_rust::protocol::value::Value::Enum("swimming") => {
                                    fit.activity.sport = "swimming".to_string()
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
                                let raw_ascent: u16 = extract_u16(&value.value);
                                fit.activity.total_ascent = sanitize_u16(raw_ascent);
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
                            57 => {
                                let raw_temp: i8 = extract_i8(&value.value);
                                fit.activity.avg_temperature = sanitize_i8(raw_temp);
                            }
                            58 => {
                                let raw_temp: i8 = extract_i8(&value.value);
                                fit.activity.max_temperature = sanitize_i8(raw_temp);
                            }
                            150 => {
                                let raw_temp: i8 = extract_i8(&value.value);
                                fit.activity.min_temperature = sanitize_i8(raw_temp);
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
