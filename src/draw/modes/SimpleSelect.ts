import MapboxDraw, { DrawCustomMode } from '@mapbox/mapbox-gl-draw';

/* 
  Simple select has 2 modes, when it have data and when it doesn't
  No data => When nothing is selected, the "default" mode
  Data => Something is selected but not for editing, just moving around

  The simple select with mode is not useful for our use case so we're
  changing the mode to simple_select without data if we try to setup a
  simple select with data
*/
export const SimpleSelect: DrawCustomMode = {
  ...MapboxDraw.modes.simple_select,
  onSetup: function (opts) {
    if(opts.featureIds){
      this.changeMode('simple_select');
      return {};
    }
    return MapboxDraw.modes.simple_select.onSetup.call(this, opts);
  },
  onMouseMove: function (state, e) {
    const featureId = e.featureTarget?.properties.id;
    if(featureId){
      this.changeMode('direct_select', { featureId: featureId });
    }
  },
}