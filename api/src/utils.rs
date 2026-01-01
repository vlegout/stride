pub fn extract_u8(value: &fit_rust::protocol::value::Value) -> u8 {
    value.clone().try_into().unwrap_or(0)
}

pub fn extract_i8(value: &fit_rust::protocol::value::Value) -> i8 {
    use fit_rust::protocol::value::Value;
    match value {
        Value::I8(v) => *v,
        Value::U8(v) => *v as i8,
        _ => 0,
    }
}

pub fn extract_u16(value: &fit_rust::protocol::value::Value) -> u16 {
    value.clone().try_into().unwrap_or(0)
}

pub fn extract_u32(value: &fit_rust::protocol::value::Value) -> u32 {
    value.clone().try_into().unwrap_or(0)
}

pub fn extract_f32(value: &fit_rust::protocol::value::Value) -> f32 {
    value.clone().try_into().unwrap_or(0.0)
}
