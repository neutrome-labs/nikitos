import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const ErrorScreen = ({ 
  title = 'Error Building Panel',
  message = 'An unexpected error occurred.',
  details = 'Please try again or check the console for more details.',
  onRetry
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={30} color="#ef4444" />
          </div>
        </div>

        <h2 style={{
          color: '#ef4444',
          fontSize: '24px',
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>
          {title}
        </h2>

        <p style={{
          color: '#666666',
          fontSize: '16px',
          lineHeight: '1.5',
          margin: '0 0 12px 0'
        }}>
          {message}
        </p>

        <p style={{
          color: '#999999',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 0 24px 0'
        }}>
          {details}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
          >
            <RotateCcw size={16} />
            Try Again
          </button>
        )}

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            color: '#9ca3af',
            fontSize: '12px',
            margin: 0,
            fontWeight: '500'
          }}>
            Need help? Check the console for technical details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;