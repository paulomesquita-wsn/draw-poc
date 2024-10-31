import React, { useEffect, useRef, useState } from 'react';
import { Layer, Marker, Source, useMap } from "react-map-gl";
import { useNavigation } from "./useNavigation"
import * as turf from "@turf/turf";
import { useWaypoints } from '../atoms/waypoints';

const INTERACTION_LAYER = 'route-interaction';

type Coordinate = [number, number];

export const Navigation = () => {
  const { data, error, isLoading } = useNavigation();
  const [waypoints, addWaypoints] = useWaypoints();

  const [hoveredRoutePoint, setHoveredRoutePoint] = useState<{lng: number, lat: number, legIndex: number} | null>(null);
  const isDraggingHoverRoutePoint = useRef(false);

  const {current: mapRef} = useMap();
  const map = mapRef.getMap();

  
  // useEffect(()=> {
  //   console.log('data', data);
  // }, [data])


  const handleMouseLeave = () => {
    if(!isDraggingHoverRoutePoint.current){
      setHoveredRoutePoint(null);
    }
  };

  const handleMouseMove = (e) => {
    if(isDraggingHoverRoutePoint.current) return;

    const features = map.queryRenderedFeatures(e.point, {
      layers: [INTERACTION_LAYER],
    });

    if (features.length) {
      const feature = features[0];
      if(feature.geometry.type === 'LineString') {
        const mousePoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
        const nearestPoint = turf.nearestPointOnLine(turf.lineString(feature.geometry.coordinates), mousePoint);
        const nearestPointCoordinates = nearestPoint.geometry.coordinates;
        // console.log('feature', feature)
        setHoveredRoutePoint({
          lng: nearestPointCoordinates[0],
          lat: nearestPointCoordinates[1],
          legIndex: feature.properties.legIndex,
        });
      }
    }else if(!isDraggingHoverRoutePoint.current) {
      setHoveredRoutePoint(null);
    }
  }

  const handleDragEnd = (e) => {
    console.log('drag end', hoveredRoutePoint.legIndex, [hoveredRoutePoint.lng, hoveredRoutePoint.lat], [e.lngLat.lng, e.lngLat.lat]);
    addWaypoints({index: hoveredRoutePoint.legIndex, coordinates: data.legs[hoveredRoutePoint.legIndex]}, [hoveredRoutePoint.lng, hoveredRoutePoint.lat], [e.lngLat.lng, e.lngLat.lat]);
    setHoveredRoutePoint(null);
  }

  useEffect(()=> {
    if(!map) return;

    map.on('mousemove', INTERACTION_LAYER, handleMouseMove);
    map.on('mouseleave', INTERACTION_LAYER, handleMouseLeave);

    return () => {
      map.off('mousemove', INTERACTION_LAYER, handleMouseMove);
      map.off('mouseleave', INTERACTION_LAYER, handleMouseLeave);
    }
  }, [map]);

  if(!data) return null;

  return (
    <>
      <Source id='navigation' type='geojson' data={data.geojson}>
      <Layer
          id={INTERACTION_LAYER}
          type="line"
          source="navigation"
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          paint={{
            'line-color': 'rgba(0, 0, 0, 0)',
            'line-width': 56,
          }}
        />
        <Layer
          id='route-stroke'
          type='line'
          source='navigation'
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          paint={{
            'line-color': '#fff',
            'line-width': 16,
          }}
        />
        <Layer
          id='route'
          type='line'
          source='navigation'
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          paint={{
            'line-color': '#1026F5',
            'line-width': 10,
          }}
        />
       
      </Source>
      {hoveredRoutePoint && (
        <Marker
          longitude={hoveredRoutePoint.lng}
          latitude={hoveredRoutePoint.lat}
          draggable
          onDragStart={(e) => {
            isDraggingHoverRoutePoint.current = true
          }}
          onDragEnd={(event) => {
            isDraggingHoverRoutePoint.current = false;
            handleDragEnd(event);
          }}
        >
          <div className='w-14 h-14 flex justify-center items-center'>
            <div className='w-4 h-4 rounded-full bg-white border border-black' />
          </div>
        </Marker>
      )}

      {waypoints && Object.values(waypoints).flat().map(waypoint => {
        return (
          <Marker
            key={`${waypoint[0]}-${waypoint[1]}`}
            longitude={waypoint[0]}
            latitude={waypoint[1]}
          >
            <div className='w-4 h-4 rounded-full bg-white border border-black' />
          {/* <div className='w-14 h-14 flex justify-center items-center'>
          </div> */}
        </Marker>
        )
      })}
    </>
  )
}