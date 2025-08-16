import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  
  // If no user, redirect to welcome screen instead of login
  return user ? children : <Navigate to="/welcome" replace />;
}
