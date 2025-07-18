import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

const TrayMenu = ({ isOpen, onClose, onShowHide, onExit, position = { x: 0, y: 0 } }) => {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleShowHide = () => {
    onShowHide();
    onClose();
  };

  const handleExit = () => {
    onExit();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        borderRadius: '8px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.5)',
        minWidth: '150px',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
        overflow: 'hidden'
      }}
    >
      <div
        onClick={handleShowHide}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(55, 65, 81, 0.3)',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isVisible ? (
          <EyeOff size={14} color="#9ca3af" />
        ) : (
          <Eye size={14} color="#9ca3af" />
        )}
        <span style={{
          fontSize: '13px',
          color: '#ffffff',
          fontWeight: '500'
        }}>
          {isVisible ? 'Hide' : 'Show'}
        </span>
      </div>

      <div
        onClick={handleExit}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={14} color="#ef4444" />
        <span style={{
          fontSize: '13px',
          color: '#ef4444',
          fontWeight: '500'
        }}>
          Exit
        </span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TrayMenu;