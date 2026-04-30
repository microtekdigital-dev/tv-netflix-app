import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { initKeyMap } from './keymap';
import App from './App';

// Initialize spatial navigation BEFORE mounting any components.
// useGetBoundingClientRect: true is more reliable on TV browsers where
// offsetLeft/offsetTop can be inaccurate inside transformed containers.
init({
  debug: false,
  visualDebug: false,
  distanceCalculationMethod: 'center',
  throttle: 0,           // no throttle — TV remote fires one event per press
  throttleKeypresses: false,
  useGetBoundingClientRect: true,
});

initKeyMap();

const root = ReactDOMClient.createRoot(
  document.querySelector('#root') as HTMLElement
);
root.render(<App />);
