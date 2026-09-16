import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import grantService from "../../services/grantService";
import { schemeService } from "../../services/schemeService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

function GrantOfficerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
      pendingCount: 0,
      totalDisbursedCount: 0,
      globalAllocated: 0,
      globalDisbursed: 0,
      globalRemaining: 0,
      utilization: 0
  });
  const [activeSchemes, setActiveSchemes] = useState([]);

  useEffect(() => {
    Promise.all([
        grantService.getPendingGrants(),
        grantService.getAllDisbursements(),
        schemeService.getActiveSchemes()
    ]).then(([pendingRes, historyRes, schemesRes]) => {
        let alloc = 0;
        let disb = 0;
        schemesRes.forEach(scheme => {
            alloc += scheme.totalBudget;
            disb += scheme.disbursedAmount;
        });
        const rem = Math.max(0, alloc - disb);
        const util = alloc > 0 ? ((disb / alloc) * 100).toFixed(1) : 0;

        setMetrics({
            pendingCount: pendingRes.data.length || 0,
            totalDisbursedCount: historyRes.data.length || 0,
            globalAllocated: alloc,
            globalDisbursed: disb,
            globalRemaining: rem,
            utilization: util
        });
        setActiveSchemes(schemesRes || []);
    }).catch(err => {
        console.error("Failed to load metrics", err);
    });
  }, []);

  return (
    <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          borderRadius: '16px', 
          padding: '32px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px',
          marginBottom: '32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          color: 'white'
      }}>
         <div>
             <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                 Finance & Grant Outflow Node
             </h1>
             <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
                 Logged in as <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user?.name} (Grant Officer)</span>
             </p>
         </div>
         <div style={{ textAlign: 'right' }}>
             <button 
                 onClick={logout}
                 style={{ 
                     background: 'transparent', 
                     border: '1px solid #475569', 
                     color: '#cbd5e1', 
                     padding: '8px 20px', 
                     borderRadius: '8px', 
                     fontSize: '14px', 
                     fontWeight: 600,
                     cursor: 'pointer',
                     transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#fff'; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#cbd5e1'; }}
             >
                Secure Terminal Logout
             </button>
         </div>
      </div>

      {/* Global Finances */}
      <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Aggregate Scheme Finances</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Total Allocated Capacity</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{formatIndianCurrency(metrics.globalAllocated)}</div>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Total Outflow (Disbursed)</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }}>{formatIndianCurrency(metrics.globalDisbursed)}</div>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Remaining Capacity</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.5px' }}>{formatIndianCurrency(metrics.globalRemaining)}</div>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Asset Utilization</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.5px' }}>{metrics.utilization}%</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>of capacity</span>
                  </div>
                  <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, metrics.utilization)}%`, background: '#f59e0b', height: '100%', borderRadius: '4px' }} />
                  </div>
              </div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          <div 
            onClick={() => navigate('/grant-officer/pending')}
            style={{ 
              padding: '32px', cursor: 'pointer', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }} />
              <div style={{ position: 'absolute', bottom: '24px', right: '24px', opacity: 0.1, color: '#3b82f6' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Checkouts</span>
              <span style={{ display: 'block', fontSize: '56px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginTop: '12px' }}>{metrics.pendingCount}</span>
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#1a56db', fontWeight: 600 }}>Execute scheduled transfers →</div>
          </div>

          <div 
            onClick={() => navigate('/grant-officer/history')}
            style={{ 
              padding: '32px', cursor: 'pointer', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }} />
              <div style={{ position: 'absolute', bottom: '24px', right: '24px', opacity: 0.1, color: '#10b981' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Immutable Ledger</span>
              <span style={{ display: 'block', fontSize: '56px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginTop: '12px' }}>{metrics.totalDisbursedCount}</span>
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>Review audit history →</div>
          </div>

      </div>

      {/* Scheme-wise finances */}
      {activeSchemes.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Individual Scheme Status</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {activeSchemes.map(scheme => {
                      const schemeAlloc = scheme.totalBudget || 0;
                      const schemeDisb = scheme.disbursedAmount || 0;
                      const schemeRem = Math.max(0, schemeAlloc - schemeDisb);
                      const schemeUtil = schemeAlloc > 0 ? ((schemeDisb / schemeAlloc) * 100).toFixed(1) : 0;

                      return (
                          <div key={scheme.id} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                              <div>
                                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{scheme.schemeName}</div>
                                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{scheme.schemeCode}</div>
                              </div>
                              <div>
                                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Allocated</div>
                                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{formatIndianCurrency(schemeAlloc)}</div>
                              </div>
                              <div>
                                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Disbursed</div>
                                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{formatIndianCurrency(schemeDisb)}</div>
                              </div>
                              <div>
                                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Remaining</div>
                                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>{formatIndianCurrency(schemeRem)}</div>
                              </div>
                              <div>
                                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Utilization ({schemeUtil}%)</div>
                                  <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ width: `${Math.min(100, schemeUtil)}%`, background: '#f59e0b', height: '100%', borderRadius: '4px' }} />
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

    </div>
  );
}

export default GrantOfficerDashboard;
