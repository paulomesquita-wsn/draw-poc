import { useMap } from "react-map-gl";
import { atom, useRecoilState } from "recoil";
import * as turf from "@turf/turf";

type Coordinate = [number, number];
type Waypoints = {[lineIndex: string]: Coordinate[]};

export const waypointsState = atom<Waypoints>({
  key: 'waypointsState',
  default: {},
});

export const useWaypoints = () => {
  const [waypoints, setWaypoints] = useRecoilState(waypointsState);
  const { current: mapRef } = useMap();
  const map = mapRef.getMap();
  
  const addWaypoint = (leg: {index: number; coordinates: Coordinate[]}, dragStart: Coordinate, dragEnd: Coordinate) => {
    if (!map) return;

    const line = turf.lineString(leg.coordinates);
    const distanceNewPoint = turf.length(turf.lineSlice(turf.getCoords(line)[0], dragStart, line));

    let newFeaturePoints: Coordinate[];

    if(!(leg.index in waypoints)) {
      setWaypoints((prev) => ({
        ...prev,
        [leg.index]: [dragEnd],
      }));
      return;
    }

    const currentLegWaypoints = [...waypoints[leg.index]];
    for(const pointIndex in currentLegWaypoints || []) {
      const point = currentLegWaypoints[pointIndex];
      const pointDistance = turf.length(turf.lineSlice(turf.getCoords(line)[0], point, line));
      if(pointDistance > distanceNewPoint) {
        newFeaturePoints = [
          ...currentLegWaypoints.slice(0, +pointIndex),
          dragEnd,
          ...currentLegWaypoints.slice(+pointIndex),
        ];
        break;
      }
    }

    if(!newFeaturePoints) {
      newFeaturePoints = [...waypoints[leg.index], dragEnd];
    }

    setWaypoints((prev) => ({
      ...prev,
      [leg.index]: newFeaturePoints,
    }));
  }

  return { waypoints, setWaypoints, addWaypoint };
}
