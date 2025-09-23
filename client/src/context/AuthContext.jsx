import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ua-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    setUser(data);
    localStorage.setItem('ua-user', JSON.stringify(data));
  };

  const register = async (name, email, password) => {
    const data = await authAPI.signup({ name, email, password });
    setUser(data);
    localStorage.setItem('ua-user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ua-user');
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('ua-user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
