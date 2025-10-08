import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './WelcomeScreen.css';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate image loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleExploreMap = () => {
    navigate('/map');
  };

  return (
    <div className="welcome-screen">
        {/* Background (keep black, no hero-photo) */}
        <div className="hero-background">
          {/* Coimbatore cityscape with animated elements */}
          <div className="city-image">
            <div className="city-skyline">
              <div className="building-silhouette building-1"></div>
              <div className="building-silhouette building-2"></div>
              <div className="building-silhouette building-3"></div>
              <div className="building-silhouette building-4"></div>
              <div className="building-silhouette building-5"></div>
            </div>
            {/* Floating service icons */}
            <div className="floating-services">
              <div className="service-icon service-1">🍽️</div>
              <div className="service-icon service-2">🏠</div>
              <div className="service-icon service-3">🚻</div>
              <div className="service-icon service-4">📚</div>
              <div className="service-icon service-5">🏥</div>
              <div className="service-icon service-6">🚌</div>
            </div>
          </div>
          {/* Dark gradient overlay */}
          <div className="hero-overlay"></div>
          {/* Animated particles */}
          <div className="particles">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
            <div className="particle particle-6"></div>
          </div>
        </div>

        {/* Content */}
        <div className={`hero-content ${isLoaded ? 'loaded' : ''}`}>
          {/* Main content */}
          <div className="main-content">
            <div className="content-wrapper">
              {/* App branding */}
              <div className="app-branding">
                <div className="brand-row">
                  <img
                    src="/images/namma-city-logo.png"
                    alt="Namma City logo"
                    className="logo-img"
                  />
                  <span className="brand-name">Namma City</span>
                </div>
              </div>

              {/* Hero text */}
              <div className="hero-text">
                <h1 className="hero-title">
                  <span className="brand-orange">Discover Coimbatore</span> with <span className="brand-highlight">Namma City</span>
                </h1>
                <p className="hero-subtitle">
                  Your essential companion for finding food, shelter, restrooms, and study spaces across the city.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="cta-row">
                <SignInButton mode="modal" afterSignInUrl="/home">
                  <button className="cta-button">Get Started</button>
                </SignInButton>
                <button className="cta-button cta-secondary" onClick={handleExploreMap}>
                  Explore Map
                </button>
              </div>

              {/* Sign up option */}
              <div className="signup-option">
                <p className="signup-text">
                  New to the city?{' '}
                  <SignUpButton mode="modal" afterSignUpUrl="/home">
                    <button className="signup-btn">Create Account</button>
                  </SignUpButton>
                </p>
              </div>

              {/* City badge */}
              <div className="city-badge">
                <span className="badge-text">Proudly serving Coimbatore</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
