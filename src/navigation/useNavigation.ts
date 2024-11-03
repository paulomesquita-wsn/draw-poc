import { request, gql } from 'graphql-request';
import useSWR from 'swr';
import { useStops } from '../atoms/stops';
import { useMemo } from 'react';
import { useWaypoints } from '../atoms/waypoints';
import * as turf from '@turf/turf';

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

const makePoint = (coordinates, type: 'STOP' | 'WAYPOINT') => {
  return {
    "type": "Feature",
    "geometry":  {
      "type": "Point",
      "coordinates": [+coordinates[0].toFixed(6), +coordinates[1].toFixed(6)],
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
  const [stops] = useStops();
  const {waypoints, setWaypoints} = useWaypoints();

  const params = useMemo(()=> {
    const legs = stops?.map((stop, i) => {
      if(i === stops.length - 1) return null;
      const waypointsOnLeg = waypoints[i] || [];
      const waypointsOnLegPoints = waypointsOnLeg.map(waypoint => makePoint([waypoint[0], waypoint[1]], 'WAYPOINT'));
      const nextPoint = stops[i + 1];
      return [makePoint([stop[1], stop[0]], 'STOP'), ...waypointsOnLegPoints, makePoint([nextPoint[1], nextPoint[0]], 'STOP')];
    }).filter(leg => leg);

    
    return {
      transportMode: 'car',
      legs,
    }
  }, [stops, waypoints]); 

  const getLegsFromFeatures = (features) => {
    const legs: [number, number][][] = [];

    // Create a line string for each leg making sure we're not repeating points
    for(const feature of features) {
      if(feature.geometry.type !== 'LineString') return;
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

    return {
      geojson: response,
      legs,
    }
  });

  return {
    data,
    error,
    isLoading: !error && !data,
  };
};