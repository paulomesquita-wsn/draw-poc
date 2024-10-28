import MapboxDraw, { DrawCustomMode } from '@mapbox/mapbox-gl-draw';
import { lineString, nearestPointOnLine, point } from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import { SnapDirectSelect } from "mapbox-gl-draw-snap-mode";

class HoverPoint {
  map: mapboxgl.Map;
  coordinate: [number, number] | [];
  
  constructor(map: mapboxgl.Map){
    this.map = map;
    this.map.addSource('hover-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    this.map.addLayer({
      id: 'hover-point',
      type: 'circle',
      source: 'hover-point',
      paint: {
        'circle-radius': 4,
        'circle-color': '#fff',
        'circle-stroke-width': 4,
        'circle-stroke-color': '#000000',
        'circle-stroke-opacity': 0.3,
      }
    });
    this.coordinate = [];
  }

  set(point: GeoJSON.Feature<GeoJSON.Point> | null){
    if(point){
      (this.map.getSource('hover-point') as mapboxgl.GeoJSONSource).setData(point);
      this.coordinate = point.geometry.coordinates as [number, number];
    }else{
      (this.map.getSource('hover-point') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
      this.coordinate = [];
    }
  }

  clear(){
    this.map.removeLayer('hover-point');
    this.map.removeSource('hover-point');
    this.coordinate = [];
  }
}

type State = {
  hoverPoint?: HoverPoint;
  onKeydown: (e: KeyboardEvent) => void;
  selectedCoordPaths: string[];
}

export const DirectSelect: DrawCustomMode = {
  ...SnapDirectSelect,
  onSetup: function (opts) {
    const state = SnapDirectSelect.onSetup.call(this, opts);
    state.hoverPoint = new HoverPoint(this.map);

    const deleteFeatureOnKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.featureId) {
          this.deleteFeature(state.featureId); 
          this.changeMode('simple_select'); 
        }
      }
    };
    
    state.onKeydown = deleteFeatureOnKeydown;
    window.addEventListener('keydown', state.onKeydown);    

    return state;
  },
  onStop: function (state: State) {
    state.hoverPoint?.clear();
    if (state.onKeydown) {
      window.removeEventListener('keydown', state.onKeydown);
    }

    SnapDirectSelect.onStop.call(this, state);
  },

  onMouseDown(state, e) {
    if (state.hoverPoint && state.hoverPoint.coordinate.length === 2) {
      const featureId = e.featureTarget?.properties.id;
      const lineFeature = this.getFeature(featureId);
      if (lineFeature && lineFeature.type === 'LineString') {
        const lineCoords = lineFeature.coordinates;
        const hoverPointCoords = state.hoverPoint.coordinate;
        
        const insertIndex = nearestPointOnLine(lineString(lineCoords), point(hoverPointCoords)).properties.index;
        state.feature.addCoordinate(insertIndex + 1, hoverPointCoords[0], hoverPointCoords[1]);

        this.map.fire('draw.update', {
          action: 'change_coordinates',
          features: [state.feature],
        });

        this.map.dragPan.disable();
        this.doRender(state.feature.id);
        state.canDragMove = true;
        state.dragMoveLocation = e.lngLat;
        state.selectedCoordPaths = [`${insertIndex + 1}`];
        return;
      }
    }

    return MapboxDraw.modes.direct_select.onMouseDown.call(this, state, e);
  },

  onDrag: function (state: State, e) {
    if (state.selectedCoordPaths.length > 0) {
      if(state.hoverPoint && state.hoverPoint.coordinate.length === 2){
        state.hoverPoint.set(null);
      }
      const result = SnapDirectSelect.onDrag.call(this, state, e);
      return result;
    }
  },

  onMouseMove: function (state: State, e) {
    SnapDirectSelect.onMouseMove.call(this, state, e);

    const featureId = e.featureTarget?.properties.id;
    const parentId = e.featureTarget?.properties.parent;
    if(!featureId && !parentId){
      this.changeMode('simple_select');
      return;
    }

    const isVertex = e.featureTarget?.properties?.meta === 'vertex';
    const canvasContainer = this.map.getContainer().querySelector('.mapboxgl-canvas-container.mapboxgl-interactive') as HTMLElement;
    if (canvasContainer) {
      canvasContainer.style.setProperty('cursor', isVertex ? 'move' : 'pointer');
    }

    if(isVertex){
      state.hoverPoint?.set(null);
    }else{
      const line = this.getFeature(featureId);
      if (line && line.type === 'LineString') {
        state.hoverPoint?.set(nearestPointOnLine(lineString(line.coordinates), point([e.lngLat.lng, e.lngLat.lat])));
      }
    }
  },

  onClick: function (state: State, e) {
    const isVertex = e.featureTarget?.properties?.meta === 'vertex';

    if (isVertex) {
      const featureId = e.featureTarget.properties.parent || e.featureTarget.properties.id;
      const vertexIndex = parseInt(e.featureTarget.properties.coord_path.split('.').pop(), 10);
      const lineFeature = this.getFeature(featureId);

      if (lineFeature && lineFeature.type === 'LineString') {
        // const isEndpoint = vertexIndex === 0 || vertexIndex === lineFeature.coordinates.length - 1;
  
        // if (isEndpoint) {
          this.changeMode('draw_line_string', {
            featureId: featureId,
            from: lineFeature.coordinates[vertexIndex],
          });
        // }
      }
    }
  },
};
