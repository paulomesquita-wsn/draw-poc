import { useMap } from "react-map-gl";
import { atom, useRecoilState } from "recoil";
import * as turf from "@turf/turf";
import { useNavigation } from "../navigation/useNavigation";

type Coordinate = [number, number];
type Waypoints = {[featureId: string]: Coordinate[]};

export const waypointsState = atom<Waypoints>({
  key: 'waypointsState',
  default: {},
});

export const useWaypoints = (): [Waypoints, (leg: {index: number; coordinates: Coordinate[]}, dragStart: Coordinate, value: Coordinate) => void] => {
  const [waypoints, setWaypoints] = useRecoilState(waypointsState);
  const { current: mapRef } = useMap();
  const map = mapRef.getMap();
  
  const addWaypoints = (leg: {index: number;coordinates: Coordinate[]}, dragStart: Coordinate, dragEnd: Coordinate) => {
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

    for(const pointIndex in waypoints[leg.index] || []) {
      const point = waypoints[leg.index][pointIndex];
      const pointDistance = turf.length(turf.lineSlice(turf.getCoords(line)[0], point, line));
      if(pointDistance > distanceNewPoint) {
        newFeaturePoints = waypoints[leg.index].splice(+pointIndex, 0, dragEnd);
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

  return [waypoints, addWaypoints];
}