import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TripTrackingPage from './pages/TripTrackingPage';
import DemoMapPage from './pages/DemoMapPage';
import DriverSchedulePage from './pages/DriverSchedulePage';
function App() {
    return (<BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/trip/:code" element={<TripTrackingPage />}/>
        <Route path="/demo-map" element={<DemoMapPage />}/>
        <Route path="/driver/schedule" element={<DriverSchedulePage />}/>
        <Route path="/driver" element={<Navigate to="/driver/schedule" replace/>}/>
        <Route path="/driver/login" element={<Navigate to="/driver/schedule" replace/>}/>
      </Routes>
    </BrowserRouter>);
}
export default App;
