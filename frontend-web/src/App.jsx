import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

import MapPage from './pages/MapPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import PWAInstall from './components/PWAInstall.jsx';
import Navigation from './components/Navigation.jsx';
import LocationPermission from './components/LocationPermission.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import { LocationProvider, useLocation as useLocationContext } from './context/LocationContext.jsx';

function AppContent() {
  const location = useLocation();
  const { showLocationPermission, handleLocationAllow, handleLocationDeny } = useLocationContext();
  const showNavigation = !['/login', '/register', '/welcome'].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/map"
          element={
            <PrivateRoute>
              <MapPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <PrivateRoute>
              <JournalPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/welcome" />} />
      </Routes>
      {showNavigation && <Navigation />}
      <PWAInstall />
      
      {/* Location Permission Overlay */}
      {showLocationPermission && (
        <LocationPermission
          onAllow={handleLocationAllow}
          onDeny={handleLocationDeny}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
}
