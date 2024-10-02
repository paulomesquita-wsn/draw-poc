import { DrawCustomMode } from '@mapbox/mapbox-gl-draw';
import { SnapDirectSelect } from "mapbox-gl-draw-snap-mode";

export const DirectSelect: DrawCustomMode = {
  ...SnapDirectSelect,
  onSetup: function (opts) {
    const state = SnapDirectSelect.onSetup.call(this, opts);

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
  onStop: function (state) {
    if (state.onKeydown) {
      window.removeEventListener('keydown', state.onKeydown);
    }

    SnapDirectSelect.onStop.call(this, state);
  },

  onDrag: function (state, e) {
    if (state.selectedCoordPaths.length > 0) {
      SnapDirectSelect.onDrag.call(this, state, e);
    }
  },

  onMouseMove: function (state, e) {
    SnapDirectSelect.onMouseMove.call(this, state, e);
    const isVertex = e.featureTarget?.properties?.meta === 'vertex';
    const isMidpoint = e.featureTarget?.properties?.meta === 'midpoint';
    const canvasContainer = this.map.getContainer().querySelector('.mapboxgl-canvas-container.mapboxgl-interactive') as HTMLElement;
    if (canvasContainer) {
      if (isVertex) {
        canvasContainer.style.setProperty('cursor', 'move');
      } else if (isMidpoint) {
        canvasContainer.style.setProperty('cursor', 'pointer');
      } else {
        canvasContainer.style.setProperty('cursor', 'default');
      }
    }
  },
};
