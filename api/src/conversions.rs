use crate::types::{Activity, FitStruct, Lap, Point};

use pyo3::IntoPy;
use pyo3::PyObject;
use pyo3::Python;
use pyo3::prelude::*;
use pyo3::types::PyDict;

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
