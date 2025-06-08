pub fn extract_u8(value: &fit_rust::protocol::value::Value) -> u8 {
    value.clone().try_into().unwrap_or(0)
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

pub fn sanitize_u16(value: u16) -> u16 {
    if value == u16::MAX { 0 } else { value }
}

pub fn sanitize_u32(value: u32) -> u32 {
    if value == u32::MAX { 0 } else { value }
}
