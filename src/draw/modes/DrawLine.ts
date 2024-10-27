import type { DrawCustomMode } from "@mapbox/mapbox-gl-draw";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import {
  SnapLineMode,
} from "mapbox-gl-draw-snap-mode";
const {
  geojsonTypes,
} = MapboxDraw.constants;

export const DrawLine: DrawCustomMode = {
  ...SnapLineMode,
  /*
   mapbox-gl-draw-snap-mode does not have support to continue a line from a specific point
   so I merged the SnapLineMode onSetup with the DrawLineMode onSetup to add this feature

   References:
   https://github.com/mapbox/mapbox-gl-draw/blob/main/src/modes/draw_line_string.js
   https://github.com/mhsattarian/mapbox-gl-draw-snap-mode/blob/main/src/modes/snap_line.js
  */
  onSetup: function (opts) {
    opts = opts || {};
    const featureId = opts.featureId;

    if(!featureId){
      const state = SnapLineMode.onSetup.call(this, opts);
      return state;
    }

    let line, currentVertexPosition;
    let direction = 'forward';
    
    line = this.getFeature(featureId);
    if (!line) {
      throw new Error('Could not find a feature with the provided featureId');
    }
    let from = opts.from;
    if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
      from = from.geometry;
    }
    if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
      from = from.coordinates;
    }
    if (!from || !Array.isArray(from)) {
      throw new Error('Please use the `from` property to indicate which point to continue the line from');
    }
    const lastCoord = line.coordinates.length - 1;
    if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
      currentVertexPosition = lastCoord + 1;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
    } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
      direction = 'backwards';
      currentVertexPosition = 0;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
    } else {
      throw new Error('`from` should match the point at either the start or the end of the provided LineString');
    }
    const state = SnapLineMode.onSetup.call(this, opts);
    this.deleteFeature(state.line.id);
    return {...state, line, currentVertexPosition, direction };
  },
}
