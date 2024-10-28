import * as React from 'react';
import MapboxDraw, { DrawCustomMode, type DrawFeature } from '@mapbox/mapbox-gl-draw';
import { useState, useCallback } from 'react';
import { useControl, useMap, type ControlPosition } from 'react-map-gl';
import { Controls } from './DrawControls';
import { SimpleSelect } from './modes/SimpleSelect';
import { DirectSelect } from './modes/DirectSelect';
import { Cut } from './modes/Cut';
import { DrawLine } from './modes/DrawLine';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;
  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
};

export function DrawControl(props: DrawControlProps) {
  const draw = useControl<MapboxDraw>(
   () => new MapboxDraw(props),
    ({ map }) => {
      map.on('draw.create', props.onCreate);
      map.on('draw.update', props.onUpdate);
      map.on('draw.delete', props.onDelete);
    },
    ({ map }) => {
      map.off('draw.create', props.onCreate);
      map.off('draw.update', props.onUpdate);
      map.off('draw.delete', props.onDelete);
    },
    {
      position: props.position,
    }
  );

  if(!draw) return null;

  return <Controls draw={draw} />;
}

export const Draw = () => {
  const [features, setFeatures] = useState<Record<string, DrawFeature>>({});

  const {current: mapRef} = useMap();

  // React.useEffect(()=> {
  //   console.log('features', features)
  // }, [features])

  const showMapSources = async() => {
    const map = mapRef.getMap();
    if(map.isStyleLoaded()){
      console.log('sources', map.getStyle().sources);
    }
      map.once('load', () => {
        console.log('sources', map.getStyle().sources);
      }); 
  }

  const onUpdate = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);

  const modes: { [key: string]: DrawCustomMode } = { 
    ...MapboxDraw.modes,
    draw_line_string: DrawLine,
    direct_select: DirectSelect,
    simple_select: SimpleSelect,
    cut: Cut
  };

  const lineStyles = [
    // {
    //   id: 'gl-draw-line-inactive',
    //   type: 'line',
    //   filter: [
    //     'all',
    //     ['==', 'active', 'false'],
    //     ['==', '$type', 'LineString'],
    //     ['!=', 'mode', 'static'],
    //   ],
    //   layout: {
    //     'line-cap': 'round',
    //     'line-join': 'round',
    //   },
    //   paint: {
    //     'line-color': '#04ffce',
    //     'line-width': 14,
    //   },
    // },
    {
      id: 'gl-draw-line-active',
      type: 'line',
      filter: [
        'all',
        ['==', '$type', 'LineString'],
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#04ffce',
        'line-width': 14,
      },
    },
    // Inactive vertices
    {
      id: 'gl-draw-line-vertex-inactive',
      type: 'circle',
      filter: [
        'all',
        ['!=', 'meta', 'midpoint'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': '#000',
      },
    },
    // Vertices being moved
    {
      id: 'gl-draw-line-vertex-active',
      type: 'circle',
      filter: [
        'all',
        ['==', 'meta', 'vertex'],
        ['==', '$type', 'Point'],
        ['==', 'active', 'true'],
      ],
      paint: {
        'circle-radius': 8,
        'circle-color': '#fff', 
      },
    },
  ];

  return (
    <DrawControl
      position="top-left"
      modes={modes}
      displayControlsDefault={false}
      onCreate={onUpdate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      styles={[
        ...lineStyles,
        // ...snapStyles,
      ]}
      userProperties={true}
      snap={true}
      snapOptions={{
        snapPx: 15,
        snapToMidPoints: true, 
        snapVertexPriorityDistance: 0.0025,
      }}
      // guides={true}
    />
  )
}