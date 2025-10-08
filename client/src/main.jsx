import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';

const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Root = (
  <React.StrictMode>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  pk ? (
    <ClerkProvider publishableKey={pk} afterSignOutUrl="/welcome">
      {Root}
    </ClerkProvider>
  ) : (
    Root
  )
);
