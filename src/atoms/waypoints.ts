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

    setWaypoints((prev) => ({
      ...prev,
      [leg.index]: [...waypoints[leg.index], dragEnd],
    }));
  }

  return { waypoints, setWaypoints, addWaypoint };
}
