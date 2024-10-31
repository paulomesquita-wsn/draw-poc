import './index.css'
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as React from 'react';
import Map from 'react-map-gl';
import { createRoot } from 'react-dom/client';
import { Draw } from './draw/Draw';
import { Stops } from './Stops';
import { PrimeReactProvider } from 'primereact/api';
import { RecoilRoot } from 'recoil';
import { Navigation } from './navigation/Navigation';

const TOKEN = 'pk.eyJ1IjoicGF1bG9tZXNxdWl0YSIsImEiOiJjazZ3eWY1aDUwaG14M2VyeGJsbWlqbDBqIn0.PzL3vnZYf9DZ3R8AYVZRxQ';

export default function App() {
  
  return (
    <RecoilRoot>
      <PrimeReactProvider>
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
          <Stops />
          <Navigation />
        </Map>
      </PrimeReactProvider>
    </RecoilRoot>
  );
}

export function renderToDom(container) {
  createRoot(container).render(<App />);
}
