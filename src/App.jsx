import React, { useState, useRef, useEffect } from 'react';
import { Plus, Grid3X3, Send, X } from 'lucide-react';

const App = () => {
  const [applets, setApplets] = useState([]);
  const [newAppletName, setNewAppletName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // Load applets from main process
    window.electronAPI.onAppletsUpdate((newApplets) => {
      console.log('Received applets update:', newApplets);
      setApplets(newApplets);
    });

    // Request initial applets
    window.electronAPI.getApplets();
  }, []);

  // Dotted background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const dots = [];
    const spacing = 30;
    const cols = Math.ceil(canvas.width / spacing);
    const rows = Math.ceil(canvas.height / spacing);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const baseOpacity = Math.random() * 0.2 + 0.05;
        dots.push({
          x: i * spacing + spacing / 2,
          y: j * spacing + spacing / 2,
          opacity: baseOpacity,
          baseOpacity,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      dots.forEach((dot) => {
        dot.opacity = dot.baseOpacity + Math.sin(time * dot.pulseSpeed) * 0.1;
        
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(156, 163, 175, ${Math.max(0, dot.opacity)})`;
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleAppletClick = (applet) => {
    console.log("Applet clicked:", applet.id);
    // Reopen the applet (which will open its first panel)
    window.electronAPI.reopenApplet(applet.id);
  };

  const handleDeleteApplet = async (e, appletId) => {
    e.stopPropagation(); // Prevent applet click when clicking delete
    try {
      const result = await window.electronAPI.deleteApplet(appletId);
      if (result.error) {
        console.error('Error deleting applet:', result.error);
      }
      // Applet will be removed from the list via the applets-updated event
    } catch (error) {
      console.error('Error deleting applet:', error);
    }
  };

  const handleCreateApplet = async (e) => {
    e.preventDefault();
    if (newAppletName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        // Use the AI metadata generation to create panel and applet
        const result = await window.electronAPI.addPanel(newAppletName.trim());
        if (result && !result.error) {
          // Applet will be added to the list via the applets-updated event
          setNewAppletName("");
        } else {
          console.error('Error creating applet:', result?.error);
        }
      } catch (error) {
        console.error('Error creating applet:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Transform applets to match the display format
  const displayApplets = applets.filter(applet => applet && applet.caption).map(applet => {
    return {
      id: applet.id,
      name: applet.caption,
      letter: applet.caption.charAt(0).toUpperCase(),
      color: applet.color
    };
  });

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Dotted background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          paddingTop: '8px'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#ffffff',
            margin: 0
          }}>Applets</h1>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '4px 0 0 0'
          }}>NikitOS</p>
        </div>

        {/* Center content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '320px' }}>
            {displayApplets.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                {displayApplets.map((applet, index) => (
                  <div
                    key={applet.id}
                    onClick={() => handleAppletClick(applet)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transform: 'scale(1)',
                      transition: 'transform 0.2s',
                      animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                      if (deleteBtn) deleteBtn.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                      if (deleteBtn) deleteBtn.style.opacity = '0';
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: applet.color,
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.3)',
                          transition: 'box-shadow 0.2s'
                        }}
                      >
                        {applet.letter}
                      </div>
                      {/* Delete button */}
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteApplet(e, applet.id)}
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          border: '2px solid #000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: '0',
                          transition: 'opacity 0.2s, transform 0.1s',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }}
                      >
                        <X size={10} color="#ffffff" />
                      </button>
                    </div>
                    <span style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: '#d1d5db',
                      transition: 'color 0.2s',
                      textAlign: 'center',
                      maxWidth: '70px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {applet.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.5)',
                  border: '2px dashed #374151',
                  borderRadius: '12px',
                  padding: '32px 24px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'all 0.5s'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      backgroundColor: '#111827',
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.3)',
                      border: '1px solid #374151'
                    }}>
                      <Grid3X3 size={20} color="#9ca3af" />
                    </div>
                  </div>
                  <h2 style={{
                    color: '#ffffff',
                    fontWeight: '500',
                    fontSize: '14px',
                    marginBottom: '6px'
                  }}>No Applets Yet</h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>Create your first applet below</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add applet bar at bottom */}
        <div style={{
          paddingTop: '16px'
        }}>
          <div style={{
            animation: 'slideUp 0.5s ease-out 0.2s both'
          }}>
            <form onSubmit={handleCreateApplet}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '9999px',
                border: '1px solid rgba(55, 65, 81, 0.5)',
                boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.3)'
              }}>
                <Plus style={{
                  position: 'absolute',
                  left: '12px',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder={isLoading ? "Generating applet..." : "Create new applet..."}
                  value={newAppletName}
                  onChange={(e) => setNewAppletName(e.target.value)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '9999px',
                    paddingLeft: '36px',
                    paddingRight: '48px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    color: isLoading ? '#9ca3af' : '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newAppletName.trim() || isLoading}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    backgroundColor: isLoading ? '#f59e0b' : (newAppletName.trim() ? '#2563eb' : '#374151'),
                    borderRadius: '9999px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: isLoading ? 'wait' : (newAppletName.trim() ? 'pointer' : 'not-allowed'),
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (newAppletName.trim() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newAppletName.trim() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    } else if (isLoading) {
                      e.currentTarget.style.backgroundColor = '#f59e0b';
                    }
                  }}
                >
                  {isLoading ? (
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <Send size={14} color="#ffffff" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input::placeholder {
          color: #9ca3af;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
