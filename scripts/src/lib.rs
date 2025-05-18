use pyo3::prelude::*;
use fit_rust::protocol::message_type::MessageType;
use fit_rust::protocol::FitMessage;
use fit_rust::Fit;
use std::fs;

#[pyfunction]
fn get_device_info(file_name: &str) -> u16 {
    let file = fs::read(file_name).unwrap();
    let fit: Fit = Fit::read(file).unwrap();

    let mut device: u16 = 0;

    for data in &fit.data {
        match data {
            FitMessage::Data(msg) => {
                match msg.data.message_type {
                    MessageType::DeviceInfo => {
                        for value in &msg.data.values {
                            if value.field_num == 4 && device == 0 {
                                device = value.value.clone().try_into().unwrap_or(device);
                            }
                        }
                    }
                    MessageType::Lap => {
                    }
                    MessageType::Record => {
                    }
                    MessageType::Session => {
                    }
                    _ => {
                    }
                }
            }
            _ => {
            }
        }
    }

    device
}

#[pymodule]
fn scripts(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_device_info, m)?)?;

    Ok(())
}
