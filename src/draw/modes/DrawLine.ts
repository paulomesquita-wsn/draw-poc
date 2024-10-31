import type { DrawCustomMode } from "@mapbox/mapbox-gl-draw";
import {
  SnapLineMode,
} from "mapbox-gl-draw-snap-mode";

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
  /*
    https://github.com/mhsattarian/mapbox-gl-draw-snap-mode/blob/main/src/modes/snap_line.js
    Also copied the onClick function and modified to care about the direction
    so if you start to draw again from the first point, it needs to add new points to the
    beggining of the line
  */
  onClick: function (state, e) {
    const lng = state.snappedLng;
    const lat = state.snappedLat;

    if (state.currentVertexPosition > 0) {
      const lastVertex = state.line.coordinates[state.currentVertexPosition - 1];

      state.lastVertex = lastVertex;

      if (lastVertex[0] === lng && lastVertex[1] === lat) {
        return this.changeMode('simple_select', {
          featureIds: [state.line.id],
        });
      }
    }
    const { x, y } = state.map.project({lng, lat});
    const { width: w, height: h } = state.map.getCanvas();
    const pointIsOnTheScreen = x > 0 && x < w && y > 0 && y < h;
    if (pointIsOnTheScreen) {
      if(state.currentVertexPosition === 0 && state.direction === 'backwards'){
        state.vertices = [{lng, lat}, ...state.vertices];
        const newCoordinates = [[lng, lat], [lng, lat], ...state.line.coordinates];
        state.line.setCoordinates(newCoordinates);
      }else{
        state.vertices.push({ lng, lat });
        state.line.updateCoordinate(state.currentVertexPosition, lng, lat);
        state.currentVertexPosition++;
        state.line.updateCoordinate(state.currentVertexPosition, lng, lat);
      }
    }
  }
}
