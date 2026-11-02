import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TripTrackingPage from './pages/TripTrackingPage';
import DemoMapPage from './pages/DemoMapPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trip/:code" element={<TripTrackingPage />} />
        <Route path="/demo-map" element={<DemoMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
