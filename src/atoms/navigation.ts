import { atom } from "recoil";

export const navigationState = atom<{geojson: any[], legs: any[]}>({
  key: 'navigationState',
  default: {geojson: [], legs: []},
})