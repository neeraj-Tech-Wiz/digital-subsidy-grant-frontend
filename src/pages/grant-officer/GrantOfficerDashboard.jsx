import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import grantService from "../../services/grantService";
import { schemeService } from "../../services/schemeService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

export default function GrantOfficerDashboard() {
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
  const [plans, setPlans] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All Regions');

  const fetchDashboardData = async () => {
    try {
        const [pendingRes, historyRes, schemesRes, plansRes, regionalRes] = await Promise.all([
            grantService.getPendingGrants(),
            grantService.getAllDisbursements(),
            schemeService.getActiveSchemes(),
            grantService.getAllDisbursementPlans(),
            grantService.getRegionalAnalytics()
        ]);

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
        
        // Plans sorting: put ones needing action first
        const sortedPlans = (plansRes.data || []).sort((a, b) => b.applicationId - a.applicationId);
        setPlans(sortedPlans);
        
        setRegionalData(regionalRes.data || []);
    } catch (err) {
        console.error("Failed to load metrics", err);
    }
  };

  useEffect(() => {
      fetchDashboardData();
  }, []);

  const getFilteredPlans = () => {
      let filtered = plans;
      
      // Status Filter
      if (statusFilter !== 'All') {
          if (statusFilter === 'Due Soon') {
              // Custom logic for Due Soon (next milestone due within 3 days and not overdue)
              const now = new Date();
              const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              filtered = filtered.filter(p => p.nextMilestoneDueDate && new Date(p.nextMilestoneDueDate) <= threeDays && new Date(p.nextMilestoneDueDate) > now);
          } else if (statusFilter === 'Overdue') {
              filtered = filtered.filter(p => p.overdueMilestones > 0);
          } else {
              filtered = filtered.filter(p => p.status === statusFilter);
          }
      }
      
      // Search Box Filter
      if (searchTerm.trim() !== '') {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(p => 
              p.applicationReference.toLowerCase().includes(lower) ||
              p.beneficiaryName.toLowerCase().includes(lower) ||
              p.schemeName.toLowerCase().includes(lower) ||
              p.schemeCode.toLowerCase().includes(lower)
          );
      }
      
      return filtered;
  };

  const filteredPlans = getFilteredPlans();

  // Summary Metrics Derived from Plans
  const plansConfigured = plans.length;
  const pendingMilestonesCount = plans.reduce((acc, p) => acc + p.pendingMilestones, 0);
  const overdueCount = plans.reduce((acc, p) => acc + p.overdueMilestones, 0);
  const totalPlannedAmt = plans.reduce((acc, p) => acc + p.plannedAmount, 0);
  const totalReleasedAmt = plans.reduce((acc, p) => acc + p.releasedAmount, 0);
  const totalRemainingAmt = plans.reduce((acc, p) => acc + p.remainingAmount, 0);

  const getStatusBadge = (status) => {
    const cfgs = {
        'PLAN_CONFIGURED': { bg: '#e0f2fe', color: '#0369a1', label: 'Plan Configured' },
        'MILESTONE_PENDING': { bg: '#f3e8ff', color: '#7e22ce', label: 'Milestone Pending' },
        'PARTIALLY_DISBURSED': { bg: '#dbeafe', color: '#1d4ed8', label: 'Partially Disbursed' },
        'MILESTONE_OVERDUE': { bg: '#ffedd5', color: '#c2410c', label: 'Overdue' },
        'NON_COMPLIANT': { bg: '#fee2e2', color: '#b91c1c', label: 'Non Compliant' },
        'FULLY_DISBURSED': { bg: '#dcfce7', color: '#15803d', label: 'Fully Disbursed' }
    };
    const c = cfgs[status] || { bg: '#f1f5f9', color: '#475569', label: status };
    return (
        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', background: c.bg, color: c.color }}>
            {c.label}
        </span>
    );
  };

  return (
    <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>
      
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
                     background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', 
                     padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                 }}
             >
                Secure Terminal Logout
             </button>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div onClick={() => navigate('/grant-officer/pending')} style={{ padding: '24px', cursor: 'pointer', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Awaiting Plan Setup</span>
              <span style={{ display: 'block', fontSize: '40px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginTop: '8px' }}>{metrics.pendingCount}</span>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#1a56db', fontWeight: 600 }}>Execute scheduled transfers →</div>
          </div>

          <div style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Plans Configured</span>
              <span style={{ display: 'block', fontSize: '40px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginTop: '8px' }}>{plansConfigured}</span>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>Total Planned: {formatIndianCurrency(totalPlannedAmt)}</div>
          </div>

          <div style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Actionable Milestones</span>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <div>
                      <span style={{ display: 'block', fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{pendingMilestonesCount}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Pending</span>
                  </div>
                  <div>
                      <span style={{ display: 'block', fontSize: '32px', fontWeight: 800, color: overdueCount > 0 ? '#dc2626' : '#10b981' }}>{overdueCount}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Overdue</span>
                  </div>
              </div>
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


      {/* REGIONAL FUND UTILIZATION */}
      {regionalData.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Regional Fund Utilization</h2>
                  <select 
                      value={regionFilter} 
                      onChange={(e) => setRegionFilter(e.target.value)} 
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  >
                      <option value="All Regions">All Regions</option>
                      {regionalData.map(r => (
                          <option key={r.region} value={r.region}>{r.region}</option>
                      ))}
                  </select>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Region</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Apps</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Approved</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Planned</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Released</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Remaining</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Utilization</th>
                              <th style={{ padding: '16px 20px', fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Status Distribution</th>
                          </tr>
                      </thead>
                      <tbody>
                          {regionalData.filter(r => regionFilter === 'All Regions' || r.region === regionFilter).map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{r.region}</td>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: '#334155' }}>{r.applicationCount}</td>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{formatIndianCurrency(r.approvedAmount)}</td>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{formatIndianCurrency(r.plannedAmount)}</td>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{formatIndianCurrency(r.releasedAmount)}</td>
                                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{formatIndianCurrency(r.remainingAmount)}</td>
                                  <td style={{ padding: '16px 20px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', minWidth: '35px' }}>{r.utilizationPercentage}%</div>
                                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                              <div style={{ width: `${Math.min(100, r.utilizationPercentage)}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
                                          </div>
                                      </div>
                                  </td>
                                  <td style={{ padding: '16px 20px', fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      {r.fullyDisbursedCount > 0 && <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>{r.fullyDisbursedCount} Fully Disbursed</span>}
                                      {r.partiallyDisbursedCount > 0 && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>{r.partiallyDisbursedCount} Partially</span>}
                                      {r.pendingCount > 0 && <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>{r.pendingCount} Pending</span>}
                                      {r.overdueCount > 0 && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>{r.overdueCount} Overdue</span>}
                                      {r.nonCompliantCount > 0 && <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>{r.nonCompliantCount} Non-Compliant</span>}
                                      
                                      {r.applicationCount > 0 && r.fullyDisbursedCount === 0 && r.partiallyDisbursedCount === 0 && r.pendingCount === 0 && r.overdueCount === 0 && r.nonCompliantCount === 0 && (
                                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>No Actionable State</span>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Disbursement Plans Section */}
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>Staged Disbursement Plans</h2>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
              <input 
                  type="text" 
                  placeholder="Search by APP-ID, Beneficiary, or Scheme..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
          </div>
          <div>
              <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: 'white' }}
              >
                  <option value="All">All Plans</option>
                  <option value="PLAN_CONFIGURED">Plan Configured</option>
                  <option value="MILESTONE_PENDING">Milestone Pending</option>
                  <option value="PARTIALLY_DISBURSED">Partially Disbursed</option>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Overdue">Overdue</option>
                  <option value="NON_COMPLIANT">Non-Compliant</option>
                  <option value="FULLY_DISBURSED">Fully Disbursed</option>
              </select>
          </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {filteredPlans.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b' }}>No disbursement plans found matching criteria.</p>
              </div>
          ) : (
              filteredPlans.map(plan => (
                  <div key={plan.applicationId} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{plan.applicationReference}</h3>
                                  {getStatusBadge(plan.status)}
                                  {plan.overdueMilestones > 0 && <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>CRITICAL: OVERDUE</span>}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                  <span style={{ fontWeight: 600, color: '#334155' }}>{plan.beneficiaryName}</span> • {plan.schemeName} ({plan.schemeCode})
                              </div>
                          </div>
                          <div>
                              <button 
                                  onClick={() => navigate(`/grant-officer/applications/${plan.applicationId}/disburse`)}
                                  style={{ padding: '8px 20px', background: '#1a56db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                              >
                                  VIEW PLAN →
                              </button>
                          </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '16px', padding: '20px 24px', background: '#f8fafc' }}>
                          <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Approved</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{formatIndianCurrency(plan.approvedAmount)}</div>
                          </div>
                          <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Released</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{formatIndianCurrency(plan.releasedAmount)}</div>
                          </div>
                          <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Remaining</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6' }}>{formatIndianCurrency(plan.remainingAmount)}</div>
                          </div>
                          <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Progress ({plan.progressPercentage}%)</div>
                              <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                                  <div style={{ width: `${plan.progressPercentage}%`, background: '#10b981', height: '100%', borderRadius: '4px' }} />
                              </div>
                          </div>
                          <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Next Action</div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {plan.nextMilestone}
                              </div>
                              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                                  {plan.nextMilestoneDueDate ? `Due: ${new Date(plan.nextMilestoneDueDate).toLocaleDateString()}` : ''}
                              </div>
                          </div>
                      </div>
                      
                      <div style={{ padding: '12px 24px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '24px', fontSize: '12px', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#cbd5e1'}}></div> Total: {plan.milestoneCount}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981'}}></div> Completed: {plan.completedMilestones}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b'}}></div> Pending: {plan.pendingMilestones}</span>
                      </div>
                  </div>
              ))
          )}
      </div>

    </div>
  );
}
