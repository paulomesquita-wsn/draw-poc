import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as React from 'react';
import Map from 'react-map-gl';
import { createRoot } from 'react-dom/client';
import { Draw } from './draw/Draw';

const TOKEN = 'pk.eyJ1IjoicGF1bG9tZXNxdWl0YSIsImEiOiJjazZ3eWY1aDUwaG14M2VyeGJsbWlqbDBqIn0.PzL3vnZYf9DZ3R8AYVZRxQ';

export default function App() {
  
  return (
      <Map
        initialViewState={{
          longitude: -91.874,
          latitude: 42.76,
          zoom: 12,
        }}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={TOKEN}
      >
        <Draw />
      </Map>
  );
}

export function renderToDom(container) {
  createRoot(container).render(<App />);
}



