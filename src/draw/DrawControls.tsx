import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as React from 'react';
import { useMap } from 'react-map-gl';
import {clsx} from 'clsx'

type Props = {
  draw: MapboxDraw;
}

export const Controls = ({draw}: Props) => {
  const [mode, setMode] = React.useState<string>();
  const {current: mapRef} = useMap();
  const map = mapRef.getMap();

  React.useEffect(()=> {
    map.on('draw.modechange', ({mode})=> {
      setMode(mode);
    });
    map.once('load', () => {
      setMode(draw.getMode());
    });
  }, []);

  React.useEffect(()=> {
    if(!mode) return;
    if(mode !== draw.getMode()){
      draw.changeMode(mode);
    }
  }, [mode])

  return (
    <div className='absolute top-5 right-4 bg-white p-5 rounded'>
      <p className='text-lg font-bold mb-2'>EDIT TOOLS</p>
      <p className='font-bold text-base'>Mode: {mode?.split('_').join(' ')}</p>
      <div className='flex gap-1'>
        <button className={clsx('bg-slate-300 w-8 h-8', {'!bg-black text-white': mode === 'draw_line_string'})} onClick={()=> setMode('draw_line_string')}>D</button>
        <button className={clsx('bg-slate-300 w-8 h-8', {'!bg-black text-white': mode?.endsWith('select')})} onClick={()=> setMode('simple_select')}>M</button>
        <button className={clsx('bg-slate-300 w-8 h-8', {'!bg-black text-white': mode === 'cut'})} onClick={()=> setMode('cut')}>C</button>
        <button className='bg-slate-300 w-8 h-8'>N</button>
        <button className='bg-slate-300 w-8 h-8'>L</button>
        <button className='bg-slate-300 w-8 h-8'>R</button>
      </div>
    </div>
  )
}
