use crate::types::{Activity, FitStruct, Lap, Point};

use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;

fn set_dict_item<'py, T: pyo3::IntoPyObject<'py>>(
    dict: &pyo3::Bound<'py, PyDict>,
    key: &str,
    value: T,
) {
    dict.set_item(key, value).unwrap();
}

impl IntoPy<PyObject> for Lap {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        set_dict_item(&dict, "index", self.index);
        set_dict_item(&dict, "start_time", self.start_time);
        set_dict_item(&dict, "total_elapsed_time", self.total_elapsed_time);
        set_dict_item(&dict, "total_timer_time", self.total_timer_time);
        set_dict_item(&dict, "total_distance", self.total_distance);
        set_dict_item(&dict, "avg_heart_rate", self.avg_heart_rate);
        set_dict_item(&dict, "max_heart_rate", self.max_heart_rate);
        dict.into()
    }
}

impl IntoPy<PyObject> for Point {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        set_dict_item(&dict, "lat", self.lat);
        set_dict_item(&dict, "lon", self.lon);
        set_dict_item(&dict, "timestamp", self.timestamp);
        set_dict_item(&dict, "distance", self.distance);
        set_dict_item(&dict, "heart_rate", self.heart_rate);
        set_dict_item(&dict, "speed", self.speed);
        set_dict_item(&dict, "power", self.power);
        set_dict_item(&dict, "altitude", self.altitude);
        dict.into()
    }
}

impl IntoPy<PyObject> for Activity {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        set_dict_item(&dict, "sport", self.sport);
        set_dict_item(&dict, "device", self.device);
        set_dict_item(&dict, "start_time", self.start_time);
        set_dict_item(&dict, "timestamp", self.timestamp);
        set_dict_item(&dict, "total_timer_time", self.total_timer_time);
        set_dict_item(&dict, "total_elapsed_time", self.total_elapsed_time);
        set_dict_item(&dict, "total_distance", self.total_distance);
        set_dict_item(&dict, "total_ascent", self.total_ascent);
        set_dict_item(&dict, "avg_speed", self.avg_speed);
        set_dict_item(&dict, "avg_heart_rate", self.avg_heart_rate);
        set_dict_item(&dict, "max_heart_rate", self.max_heart_rate);
        set_dict_item(&dict, "avg_power", self.avg_power);
        set_dict_item(&dict, "max_power", self.max_power);
        set_dict_item(&dict, "np_power", self.np_power);
        set_dict_item(&dict, "total_calories", self.total_calories);
        set_dict_item(&dict, "total_training_effect", self.total_training_effect);
        set_dict_item(&dict, "training_stress_score", self.training_stress_score);
        set_dict_item(&dict, "intensity_factor", self.intensity_factor);
        dict.into()
    }
}

impl IntoPy<PyObject> for FitStruct {
    fn into_py(self, py: Python<'_>) -> PyObject {
        let dict = PyDict::new(py);
        set_dict_item(&dict, "activity", self.activity.into_py(py));
        set_dict_item(&dict, "laps", self.laps.into_py(py));
        set_dict_item(&dict, "data_points", self.data_points.into_py(py));
        dict.into()
    }
}
