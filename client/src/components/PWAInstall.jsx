import { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'var(--color-primary)',
      color: 'white',
      padding: '1rem',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000
    }}>
      <div>
        <strong>Install Urban Aid</strong>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
          Add to home screen for quick access
        </p>
      </div>
      <div>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'white',
            color: 'var(--color-primary)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: '600',
            marginRight: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Install
        </button>
        <button
          onClick={() => setShowInstall(false)}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
