import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ title = 'Loading...', panelId, onStreamData, onStreamEnd }) => {
  const [rawData, setRawData] = useState('');

  useEffect(() => {
    if (panelId && onStreamData) {
      const handleStreamData = (data) => {
        setRawData(prev => prev + data);
        if (onStreamData) onStreamData(data);
      };

      const handleStreamEnd = () => {
        if (onStreamEnd) onStreamEnd(rawData);
        if (window.electronAPI && window.electronAPI.saveContent) {
          window.electronAPI.saveContent(panelId, rawData);
        }
      };

      // Listen for stream data if available
      if (window.electronAPI && window.electronAPI.onStreamData) {
        window.electronAPI.onStreamData(handleStreamData);
      }

      if (window.electronAPI && window.electronAPI.onStreamEnd) {
        window.electronAPI.onStreamEnd(handleStreamEnd);
      }

      return () => {
        // Cleanup listeners if needed
      };
    }
  }, [panelId, onStreamData, onStreamEnd, rawData]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      <h1 style={{
        fontSize: '24px',
        color: '#333333',
        fontWeight: '400',
        margin: 0,
        textAlign: 'center'
      }}>
        {title}
      </h1>

      {rawData && (
        <div style={{
          maxWidth: '80%',
          maxHeight: '200px',
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: '#6c757d',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          {rawData}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;