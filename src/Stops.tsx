import { Dropdown } from 'primereact/dropdown';
import * as React from 'react';
import { Marker, useMap } from 'react-map-gl';
import { useStops } from './atoms/stops';
import { Button } from 'primereact/button';
import mapboxgl from 'mapbox-gl';

type Props = {
}

const places: {name: string; coordinates: [number, number]}[] = [
  { name: 'House', coordinates: [-19.838481, -43.963829] },
  { name: 'Supermarket', coordinates: [-19.840992, -43.966125] },
  { name: 'Gym', coordinates: [-19.837532, -43.971887] },
  { name: 'Bakery', coordinates: [-19.843204, -43.973778] },
];

export const Stops = ({}: Props) => {
  const [stops, setStops] = useStops();

  const {current: mapRef} = useMap();
  const map = mapRef.getMap();

  React.useEffect(() => {
    if (map && stops.some(stop => stop)) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => {
        if (stop) {
          bounds.extend([stop[1], stop[0]]);
        }
      });

      if (stops.filter(stop => stop).length === 1) {
        const singleStop = stops.find(stop => stop);
        map.setCenter([singleStop[1], singleStop[0]]);
        map.setZoom(14); // Set a default zoom level for a single stop
      } else {
        map.fitBounds(bounds, { padding: 150 });
      }
    }
  }, [stops, map]);

  return (
    <div className='absolute top-5 left-4 bg-white p-5 rounded w-80'>
      <div className='flex flex-col gap-3'>
        <div className='w-full flex justify-between'>
          <p className='text-lg font-bold mb-2'>Stops</p>
          <Button label='Clear all' onClick={()=> {
            setStops(0, null);
            setStops(1, null);
            setStops(2, null);
          }} />
        </div>
        <Dropdown 
          pt={{ root: {className: 'border border-solid border-gray-300'} }}
          value={stops[0]} 
          onChange={(e) => setStops(0, e.value)} 
          options={places.filter(p => p.coordinates !== stops[1] && p.coordinates !== stops[2])} 
          optionLabel="name" 
          optionValue='coordinates'
          placeholder="Select start" 
          className="w-full" 
        />
        <Dropdown 
          pt={{ root: {className: 'border border-solid border-gray-300'} }}
          value={stops[1]} 
          onChange={(e) => setStops(1, e.value)} 
          options={places.filter(p => p.coordinates !== stops[0] && p.coordinates !== stops[2])} 
          optionLabel="name" 
          optionValue='coordinates'
          placeholder="Select stop 1" 
          className="w-full" 
        />
        <Dropdown 
          pt={{ root: {className: 'border border-solid border-gray-300'} }}
          value={stops[2]} 
          onChange={(e) => setStops(2, e.value)} 
          options={places.filter(p => p.coordinates !== stops[0] && p.coordinates !== stops[1])} 
          optionLabel="name" 
          optionValue='coordinates'
          placeholder="Select stop 2" 
          className="w-full" 
        />
      </div>
      {stops.map((stop, i) => {
        const place = places.find(p => p.coordinates === stop);

        return (
        <Marker key={`${stop[0]}-${stop[1]}`} longitude={stop[1]} latitude={stop[0]} anchor='top'>
          <span className='bg-white font-bold p-1 rounded border-2 border-solid border-red-600 text-lg'>
            {place.name}
          </span>
        </Marker>
        )
      })}
    </div>
  )
}
