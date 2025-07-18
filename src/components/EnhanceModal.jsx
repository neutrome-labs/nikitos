import React, { useState, useEffect } from 'react';

const EnhanceModal = ({ isOpen, onClose, panelId, currentContent }) => {
  const [enhanceText, setEnhanceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnhanceText('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleEnhance = async () => {
    if (!enhanceText.trim()) return;

    setIsLoading(true);
    try {
      await window.electronAPI.enhancePanel(panelId, enhanceText.trim());
      onClose();
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleEnhance();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '500px',
        height: '400px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #404040'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Enhance Panel
          </h2>
          <p style={{
            margin: 0,
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            Describe how you want to improve the current panel content
          </p>
        </div>

        {/* Input Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px'
        }}>
          <textarea
            value={enhanceText}
            onChange={(e) => setEnhanceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your enhancement instructions here..."
            autoFocus
            disabled={isLoading}
            style={{
              flex: 1,
              background: '#2d2d2d',
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '15px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#404040';
            }}
          />
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#9ca3af',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #374151',
              borderTop: '2px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Enhancing panel...</span>
          </div>
        )}

        {/* Button Container */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              background: '#374151',
              color: '#ffffff',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#374151';
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleEnhance}
            disabled={!enhanceText.trim() || isLoading}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: (!enhanceText.trim() || isLoading) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              background: (!enhanceText.trim() || isLoading) ? '#374151' : '#2563eb',
              color: '#ffffff',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (enhanceText.trim() && !isLoading) {
                e.target.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (enhanceText.trim() && !isLoading) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
          >
            Enhance
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhanceModal;