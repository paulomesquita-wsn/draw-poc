import MapboxDraw, { DrawCustomMode } from '@mapbox/mapbox-gl-draw';


export const SimpleSelect: DrawCustomMode = {
  ...MapboxDraw.modes.simple_select,
  onClick: function (state, e) {
    if (e.featureTarget) {
      const featureId = e.featureTarget.properties.id;
      if(!featureId) {
        console.log('No feature id found', e.featureTarget.properties);
      }
      this.changeMode('direct_select', { featureId: featureId });
    } else {
      // If no feature is clicked, call the default behavior
    }
    return MapboxDraw.modes.simple_select.onClick.call(this, state, e);
  }
}