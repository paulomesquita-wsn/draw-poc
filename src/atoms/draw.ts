import type { DrawFeature } from "@mapbox/mapbox-gl-draw";
import { atom } from "recoil";

export type DrawMode = 'simple_select' | 'direct_select' | 'draw_line_string' | 'cut'

export const drawModeState = atom<DrawMode>({
  key: 'drawModeState',
  default: 'simple_select',
});


export const drawFeaturesState = atom<Record<string, DrawFeature>>({
  key: 'drawFeaturesState',
  default: {},
})