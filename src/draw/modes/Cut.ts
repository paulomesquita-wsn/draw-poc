import { DrawCustomMode } from '@mapbox/mapbox-gl-draw';
import { point, lineString } from "@turf/helpers";
import pointOnLine from "@turf/nearest-point-on-line";
import lineSplit from "@turf/line-split";

export const Cut: DrawCustomMode = {
  onSetup: function (opts) {
    const state = {};
    return state;
  },
  onClick: function (state, e) {
    const feature = this.getFeature(e.featureTarget.properties.id);
    const line = lineString(feature.getCoordinates() as Array<[number, number]>)
    const collection = lineSplit(line, pointOnLine(line, point([e.lngLat.lng, e.lngLat.lat])));
    const newFeatures = collection.features.map((f) => {
      const nf = this.newFeature(f);
      this.addFeature(nf);
      return nf;
    });
    this.deleteFeature(feature.id as string);

    setTimeout(() => {
      this.map.fire('draw.delete', {
        features: [feature]
      })
      this.map.fire('draw.create', {
        features: newFeatures
      });
    }, 10);
    
    

    this.map.getCanvas().style.cursor = "inherit";
    this.changeMode('direct_select', { featureId: newFeatures[0].id });
  },
  toDisplayFeatures: function(state, geojson, display) {
    display(geojson);
  },
  onMouseMove: function(state, e) {
    const featureId = e.featureTarget?.properties.id;
    this.map.getCanvas().style.cursor = featureId ? "crosshair" : "inherit";
  },
}