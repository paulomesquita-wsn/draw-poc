import { request, gql } from 'graphql-request';
import useSWR from 'swr';
import { useStops } from '../atoms/stops';
import { useMemo } from 'react';
import { useWaypoints } from '../atoms/waypoints';
import * as turf from '@turf/turf';
import { useRecoilState } from 'recoil';
import { drawFeaturesState } from '../atoms/draw';
import { navigationState } from '../atoms/navigation';
import { useRouteModifiers } from './useRouteModifiers';

const GEOJSON_BY_LEGS_QUERY = gql`
  query GeojsonByLegs($params: APIByLegsInput!) {
    geojsonByLegs(params: $params) {
      errors {
        message
        legIndex
        geomPlacement
        geom {
          type
          properties
          geometry
        }
        distanceToGeom
      }
      route {
        type
        features {
          type
          geometry
          properties
        }
      }
    }
  }
`;

const makeFeature = (coordinates, type: 'STOP' | 'WAYPOINT') => {
  const isLine = Array.isArray(coordinates[0]);
  return {
    "type": "Feature",
    "geometry":  {
      "type": isLine ? 'LineString' : "Point",
      "coordinates": isLine ? coordinates.map(coord => ([+coord[0].toFixed(6), +coord[1].toFixed(6)])) : [+coordinates[0].toFixed(6), +coordinates[1].toFixed(6)],
    },
    "properties": {
      "waypointType": type,
    },
  }
}

const fetcher = async(params: [string, Record<string, unknown>]) => {
  const response = await request('http://localhost:4000/api/graphql', ...params);
  return response.geojsonByLegs.route;
}

export const useNavigation = () => {
  const [, setNavigation] = useRecoilState(navigationState)
  const routeModifiers = useRouteModifiers();
  const [stops] = useStops();
  const { waypoints, setWaypoints } = useWaypoints();

  const params = useMemo(()=> {
    const legs = stops?.map((stop, i) => {
      if(i === stops.length - 1) return null;
      const legModifiers = routeModifiers[i];
      const legModifiersFilters = legModifiers?.map(lm => makeFeature(lm, 'WAYPOINT')) || [];
      const nextPoint = stops[i + 1];
      const points = [makeFeature([stop[1], stop[0]], 'STOP'), ...legModifiersFilters, makeFeature([nextPoint[1], nextPoint[0]], 'STOP')];
      return points;

    }).filter(leg => leg);

    
    return {
      transportMode: 'car',
      legs,
    }
  }, [stops, routeModifiers]); 

  const getLegsFromFeatures = (features) => {
    const legs: [number, number][][] = [];

    // Create a line string for each leg making sure we're not repeating points
    for(const feature of features) {
      if(feature.geometry.type !== 'LineString') return;
      if('legIndex' in feature.properties) {
        const legIndex = feature.properties.legIndex;
        if(!legs[legIndex]) legs[legIndex] = [];
        const leg = legs[legIndex];
        let coordinates = feature.geometry.coordinates;
        
        if(leg.length > 0){
          if(coordinates[0][0] === leg[leg.length - 1][0] && coordinates[0][1] === leg[leg.length - 1][1]) {
            coordinates = coordinates.slice(1);
          }
        }
        legs[legIndex] = leg.concat(coordinates);
      } 
    }
    return legs;
  }

  const { data, error } = useSWR(stops.length >= 2 ? [GEOJSON_BY_LEGS_QUERY, { params }] : null, async(params) => {
    const response = await fetcher(params);
    const legs = getLegsFromFeatures(response.features);
    // fix waypoints to be inside new line
    const newWaypoints = {};
    for(const legIndex in legs) {
      newWaypoints[legIndex] = [];
      const leg = legs[+legIndex];
      const legLine = turf.lineString(leg);
      const waypointsOnLeg = waypoints[+legIndex] || [];
      for(const waypoint of waypointsOnLeg) {
        const nearestPoint = turf.nearestPointOnLine(legLine, turf.point(waypoint));
        newWaypoints[legIndex].push(nearestPoint.geometry.coordinates);
      }
    }

    setWaypoints(newWaypoints);

    const filteredResponse = {
      ...response,
      features: response.features.filter(feature => 'legIndex' in feature.properties),
    }

    const finalData = {
      geojson: filteredResponse,
      legs,
    }

    setNavigation(finalData);

    return finalData;
  });

  return {
    data,
    error,
    isLoading: !error && !data,
  };
};