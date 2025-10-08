import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import MapPage from './pages/MapPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ReportIssue from './pages/ReportIssue.jsx';
import ReportSafety from './pages/ReportSafety.jsx';
import ReportAccessibility from './pages/ReportAccessibility.jsx';
import IssuesPage from './pages/IssuesPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import HomePage from './pages/HomePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';

import PWAInstall from './components/PWAInstall.jsx';
import Navigation from './components/Navigation.jsx';
import LocationPermission from './components/LocationPermission.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import { LocationProvider, useLocation as useLocationContext } from './context/LocationContext.jsx';

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
};

function AppContent() {
  const location = useLocation();
  const { showLocationPermission, handleLocationAllow, handleLocationDeny } = useLocationContext();
  const showNavigation = !['/sign-in', '/sign-up', '/welcome'].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        <Route path="/map" element={<MapPage />} />

        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/issues" element={<ProtectedRoute><IssuesPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
        <Route path="/report-safety" element={<ProtectedRoute><ReportSafety /></ProtectedRoute>} />
        <Route path="/report-accessibility" element={<ProtectedRoute><ReportAccessibility /></ProtectedRoute>} />

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
