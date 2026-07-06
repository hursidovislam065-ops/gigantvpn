import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '8px 16px',
      background: 'rgba(255, 107, 107, 0.15)',
      borderBottom: '1px solid rgba(255, 107, 107, 0.3)',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: 500,
      color: '#FF6B6B',
      backdropFilter: 'blur(20px)',
    }}>
      📡 Нет подключения к интернету
    </div>
  );
}
