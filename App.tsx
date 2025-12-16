import React from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import HandTracker from './components/HandTracker';

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Scene />
      <UIOverlay />
      <HandTracker />
    </div>
  );
}

export default App;
