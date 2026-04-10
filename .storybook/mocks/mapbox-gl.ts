const mapboxgl = {
  Map: class {
    on() {}
    remove() {}
    addSource() {}
    addLayer() {}
    fitBounds() {}
  },
  Marker: class {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
  },
  accessToken: "",
};

export default mapboxgl;
