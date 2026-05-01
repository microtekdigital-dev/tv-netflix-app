import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { initKeyMap, registerTizenKeys, registerWebOSKeys } from './keymap';
import App from './App';

// Initialize spatial navigation BEFORE mounting any components.
// useGetBoundingClientRect: true is more reliable on TV browsers where
// offsetLeft/offsetTop can be inaccurate inside transformed containers.
init({
  debug: false,
  visualDebug: false,
  distanceCalculationMethod: 'nearest',
  throttle: 0,
  throttleKeypresses: false,
  useGetBoundingClientRect: true,
});

initKeyMap();

// Register Samsung Tizen remote keys so they fire as keydown events.
// This is required for Samsung Smart Remote directional navigation.
// Must run after DOM is ready — use DOMContentLoaded to be safe.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    registerTizenKeys();
    registerWebOSKeys();
  });
} else {
  registerTizenKeys();
  registerWebOSKeys();
}

const root = ReactDOMClient.createRoot(
  document.querySelector('#app-scaler') as HTMLElement
);
root.render(<App />);
