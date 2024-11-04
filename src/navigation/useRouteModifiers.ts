import { useRecoilState } from "recoil";
import { drawFeaturesState } from "../atoms/draw";
import { useWaypoints } from "../atoms/waypoints";
import { useMemo } from "react";
import * as turf from "@turf/turf";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import { navigationState } from "../atoms/navigation";

export const useRouteModifiers = () => {
  const [navigation] = useRecoilState(navigationState);
  const { waypoints } = useWaypoints();
  const [ draws ] = useRecoilState(drawFeaturesState);

  const drawsPerLeg = useMemo(() => {
    // check by the coordinates of the draw linestring on which leg does it intersect
    const result: {[legIndex: number]: MapboxDraw.DrawFeature[]} = {};
    for(const draw of Object.values(draws)){
      if(!('geometry' in draw)) continue;
      if(draw.geometry.type !== 'LineString') continue;
      for(let i = 0; i < navigation.legs.length; i++){
        if(!(i in result)){
          result[i] = [];
        }
        const drawFirstPoint = turf.point(draw.geometry.coordinates[0]);
        const legLine = turf.lineString(navigation.legs[i]);
        const drawFirstPointIsOnTheLine = turf.booleanPointOnLine(drawFirstPoint, legLine, {epsilon: 0.001});
        if(drawFirstPointIsOnTheLine){
          result[i].push(draw.geometry.coordinates);
        }
      }
    }
    return result;
  }, [draws, navigation])

  const sortedModifiers = useMemo(() => {
    const numberOfLegs = navigation.legs.length;
    const result = {};
    for(let i = 0; i< numberOfLegs; i++){
      const line = turf.lineString(navigation.legs[i]);
      const waypointsOnLeg = waypoints[i] || [];
      const drawsOnLeg = drawsPerLeg[i] || [];
      const modifiers = [...waypointsOnLeg, ...drawsOnLeg];
      const sorted = modifiers.sort((a, b) => {
        const pointA = Array.isArray(a[0]) ? a[0] : a;
        const pointB = Array.isArray(b[0]) ? b[0] : b;
        const distanceA = turf.length(turf.lineSlice(turf.getCoords(line)[0], pointA as [number, number], line));
        const distanceB = turf.length(turf.lineSlice(turf.getCoords(line)[0], pointB as [number, number], line));
        return distanceA - distanceB;
      });
      result[i] = sorted;
    }
    return result;
  }, [navigation, waypoints, drawsPerLeg]);

  return sortedModifiers;
}