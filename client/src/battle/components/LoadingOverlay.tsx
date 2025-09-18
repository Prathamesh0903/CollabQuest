import React from 'react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, message = 'Loading...' }) => {
  if (!show) return null;
  return (
    <div className="loading-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 60 }}>
      <div style={{ background: '#181a1b', color: '#ececec', border: '1px solid rgba(229,229,229,0.15)', borderRadius: 8, padding: '14px 18px' }}>
        {message}
      </div>
    </div>
  );
};


