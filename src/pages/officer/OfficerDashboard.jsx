import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { verificationService } from "../../services/verificationService";

const STATUS_CONFIG = {
    DOCUMENTS_PENDING: { label: 'Documents Pending', cls: 'badge-yellow', color: '#eab308' },
    PENDING_VERIFICATION: { label: 'Pending Verification', cls: 'badge-purple', color: '#a855f7' },
    UNDER_VERIFICATION: { label: 'Under Verification', cls: 'badge-blue', color: '#3b82f6' },
    ELIGIBLE: { label: 'Eligible', cls: 'badge-green', color: '#22c55e' },
    NOT_ELIGIBLE: { label: 'Not Eligible', cls: 'badge-red', color: '#ef4444' },
    APPROVED: { label: 'Approved', cls: 'badge-emerald', color: '#10b981' },
    REJECTED: { label: 'Rejected', cls: 'badge-red', color: '#ef4444' },
    ESCALATED: { label: 'Escalated', cls: 'badge-orange', color: '#f97316' },
};

const formatDate = (ds) => {
    if (!ds) return 'N/A';
    const d = new Date(ds);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function OfficerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificationService.getQueue()
        .then(setQueue)
        .catch(err => {
            console.error("Failed to load queue", err);
            setError("Failed to fetch assigned verification queue.");
        })
        .finally(() => setLoading(false));
  }, []);

  const getRoleDisplayName = (role) => {
    switch(role) {
      case "LEVEL_1_OFFICER": return "Level 1 Verification Officer";
      case "LEVEL_2_OFFICER": return "Level 2 Verification Officer";
      case "LEVEL_3_OFFICER": return "Level 3 Verification Officer";
      case "FINAL_APPROVAL_OFFICER": return "Final Approval Officer";
      default: return "Officer";
    }
  };

  return (
    <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Dynamic Premium Header */}
      <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          borderRadius: '16px', 
          padding: '32px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          color: 'white'
      }}>
         <div>
             <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                 Officer Dashboard
             </h1>
             <p style={{ color: '#94a3b8', fontSize: '15px' }}>
                 Welcome back, <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user?.name}</span>
             </p>
         </div>
         <div style={{ textAlign: 'right' }}>
             <span style={{ 
                 padding: '6px 14px', 
                 backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                 color: '#93c5fd', 
                 borderRadius: '20px', 
                 fontSize: '12px', 
                 fontWeight: 700, 
                 letterSpacing: '0.5px',
                 textTransform: 'uppercase',
                 border: '1px solid rgba(59, 130, 246, 0.3)'
             }}>
                 {getRoleDisplayName(user?.role)}
             </span>
             <br />
             <button 
                 onClick={logout}
                 style={{ 
                     marginTop: '16px', 
                     background: 'transparent', 
                     border: '1px solid #475569', 
                     color: '#cbd5e1', 
                     padding: '6px 16px', 
                     borderRadius: '8px', 
                     fontSize: '13px', 
                     cursor: 'pointer',
                     transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#fff'; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#cbd5e1'; }}
             >
                Secure Logout
             </button>
         </div>
      </div>

      {/* Metrics Section */}
      <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div style={{ 
              padding: '32px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              background: 'white',
              borderRadius: '20px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              position: 'relative',
              overflow: 'hidden'
          }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }} />
              
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Assigned Applications
              </span>
              <span style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {loading ? '-' : queue.length}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {!loading && queue.length > 0 && (
                      <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '14px', color: loading || queue.length === 0 ? '#94a3b8' : '#10b981', fontWeight: 600 }}>
                      {loading ? 'Initializing queue...' : queue.length === 0 ? 'Queue is clear' : 'Pending Your Review'}
                  </span>
              </div>
          </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Verification Queue</h2>
          <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Showing oldest first</span>
      </div>

      {/* Queue List */}
      {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '30px', height: '30px', borderTopColor: '#3b82f6' }} />
              <p style={{ color: '#64748b', fontSize: '15px' }}>Syncing with central database...</p>
          </div>
      ) : error ? (
          <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
      ) : queue.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
             <h3 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '20px', fontWeight: 700 }}>You're all caught up!</h3>
             <p style={{ color: '#64748b', fontSize: '15px' }}>There are no applications currently assigned to your verification level.</p>
          </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '60px' }}>
              {queue.map((app, index) => (
                  <div 
                      key={app.id} 
                      style={{ 
                          padding: '24px 32px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: 'white',
                          borderRadius: '16px',
                          border: '1px solid #f1f5f9',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s forwards`,
                          opacity: 0,
                          transform: 'translateY(10px)'
                      }}
                      onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                  >
                      <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  APP-{String(app.id).padStart(5, '0')}
                              </span>
                              <span style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 10px', 
                                  backgroundColor: `${STATUS_CONFIG[app.status]?.color}15`, 
                                  color: STATUS_CONFIG[app.status]?.color || '#3b82f6', 
                                  borderRadius: '20px', 
                                  fontWeight: 700 
                              }}>
                                  {STATUS_CONFIG[app.status]?.label || app.status}
                              </span>
                              <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '20px', fontWeight: 700 }}>
                                  SCORE: {app.eligibilityScore}
                              </span>
                          </div>
                          
                          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>
                              {app.beneficiaryName} 
                              <span style={{ color: '#cbd5e1', margin: '0 10px', fontWeight: 400 }}>|</span> 
                              <span style={{ color: '#475569', fontWeight: 600 }}>{app.schemeName}</span>
                          </h3>
                          
                          <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span><strong style={{ color: '#94a3b8', fontWeight: 500 }}>Applied:</strong> {formatDate(app.applicationDate)}</span>
                              {app.verificationDueDate && (
                                  <span>
                                      <strong style={{ color: '#94a3b8', fontWeight: 500 }}>Deadline:</strong>{' '}
                                      <span style={{ color: '#ea580c', fontWeight: 600 }}>{formatDate(app.verificationDueDate)}</span>
                                  </span>
                              )}
                          </p>
                      </div>
                      <div style={{ flexShrink: 0, paddingLeft: '24px' }}>
                          <button 
                              onClick={() => navigate(`/officer/applications/${app.id}/review`)}
                              style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  padding: '12px 24px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                                  transition: 'background 0.2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                          >
                              Review & Verify →
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .pulse-dot {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}} />
    </div>
  );
}

export default OfficerDashboard;
