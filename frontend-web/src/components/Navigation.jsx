import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const HomeIcon = ({ isActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

const MapIcon = ({ isActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const ChatIcon = ({ isActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

const BookmarkIcon = ({ isActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
);

const ProfileIcon = ({ isActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const navItems = [
  { path: '/home', icon: HomeIcon, text: 'HOME' },
  { path: '/map', icon: MapIcon, text: 'EXPLORE' },
  { path: '/chat', icon: ChatIcon, text: 'CHAT' },
  { path: '/bookmarks', icon: BookmarkIcon, text: 'SAVED' },
  { path: '/profile', icon: ProfileIcon, text: 'PROFILE' },
];

const Navigation = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink key={item.path} to={item.path} className="nav-item">
          {({ isActive }) => (
            <>
              <div className="nav-icon">
                <item.icon isActive={isActive} />
              </div>
              <span className="nav-text">{item.text}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
