import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import grantService from "../../services/grantService";
import { schemeService } from "../../services/schemeService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [nonCompliant, setNonCompliant] = useState([]);
  const [compliancePending, setCompliancePending] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All Regions');

  const fetchDashboardData = async () => {
    try {
        const [pendingRes, historyRes, schemesRes, plansRes, regionalRes, nonCompliantRes, pendingCompRes] = await Promise.all([
            grantService.getPendingGrants(),
            grantService.getAllDisbursements(),
            schemeService.getActiveSchemes(),
            grantService.getAllDisbursementPlans(),
            grantService.getRegionalAnalytics(),
            grantService.getNonCompliantMilestones(),
            grantService.getPendingComplianceMilestones()
        ]);

        let alloc = 0;
        let disb = 0;
        schemesRes.forEach(scheme => {
            alloc += scheme.totalBudget;
            disb += scheme.disbursedAmount;
        });
        const rem = Math.max(0, alloc - disb);
        const util = alloc > 0 ? ((disb / alloc) * 100) : 0;

        setMetrics({
            pendingCount: pendingRes.data.length || 0,
            totalDisbursedCount: historyRes.data.length || 0,
            globalAllocated: alloc,
            globalDisbursed: disb,
            globalRemaining: rem,
            utilization: util
        });
        setActiveSchemes(schemesRes || []);
        
        const sortedPlans = (plansRes.data || []).sort((a, b) => b.applicationId - a.applicationId);
        setPlans(sortedPlans);
        
        setRegionalData(regionalRes.data || []);
        setNonCompliant(nonCompliantRes.data || []);
        setCompliancePending(pendingCompRes.data || []);
    } catch (err) {
        console.error("Failed to load metrics", err);
    }
  };

  useEffect(() => {
      fetchDashboardData();
  }, []);

  const getFilteredPlans = () => {
      let filtered = plans;
      if (statusFilter !== 'All') {
          if (statusFilter === 'Due Soon') {
              const now = new Date();
              const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              filtered = filtered.filter(p => p.nextMilestoneDueDate && new Date(p.nextMilestoneDueDate) <= threeDays && new Date(p.nextMilestoneDueDate) > now);
          } else if (statusFilter === 'Overdue') {
              filtered = filtered.filter(p => p.overdueMilestones > 0);
          } else {
              filtered = filtered.filter(p => p.status === statusFilter);
          }
      }
      if (searchTerm.trim() !== '') {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(p => p.applicationReference.toLowerCase().includes(lower) || p.beneficiaryName.toLowerCase().includes(lower) || p.schemeName.toLowerCase().includes(lower) || p.schemeCode.toLowerCase().includes(lower));
      }
      return filtered;
  };

  const filteredPlans = getFilteredPlans();
  const totalPlannedAmt = plans.reduce((acc, p) => acc + p.plannedAmount, 0);
  const totalReleasedAmt = plans.reduce((acc, p) => acc + p.releasedAmount, 0);
  const totalApprovedAmt = plans.reduce((acc, p) => acc + p.approvedAmount, 0);

  // Chart Data Preparation
  const donutData = [
    { name: 'Disbursed', value: metrics.globalDisbursed, color: '#10b981' },
    { name: 'Remaining', value: metrics.globalRemaining, color: '#94a3b8' }
  ];

  const schemeData = activeSchemes.map(s => {
    const allocated = s.totalBudget || 0;
    const disbursed = s.disbursedAmount || 0;
    return {
      name: s.schemeName,
      Allocated: allocated,
      Disbursed: disbursed,
      Remaining: Math.max(0, allocated - disbursed),
      Utilization: allocated > 0 ? (disbursed / allocated) * 100 : 0
    };
  });

  const chartRegionalData = regionalData
    .filter(r => regionFilter === 'All Regions' || r.region === regionFilter)
    .map(r => ({
      region: r.region,
      Approved: r.approvedAmount,
      Planned: r.plannedAmount,
      Released: r.releasedAmount,
      Remaining: r.remainingAmount,
      Apps: r.applicationCount,
      Utilization: r.utilizationPercentage,
      FullyDisbursed: r.fullyDisbursedCount,
      Pending: r.pendingCount,
      Overdue: r.overdueCount,
      PartiallyDisbursed: r.partiallyDisbursedCount,
      NonCompliant: r.nonCompliantCount
    }));

  let appStatusCounts = { 'Fully Disbursed': 0, 'Partially Disbursed': 0, 'Pending': 0, 'Overdue': 0, 'Non-Compliant': 0 };
  let totalAppsCount = 0;
  chartRegionalData.forEach(r => {
     appStatusCounts['Fully Disbursed'] += r.FullyDisbursed || 0;
     appStatusCounts['Partially Disbursed'] += r.PartiallyDisbursed || 0;
     appStatusCounts['Pending'] += r.Pending || 0;
     appStatusCounts['Overdue'] += r.Overdue || 0;
     appStatusCounts['Non-Compliant'] += r.NonCompliant || 0;
     totalAppsCount += r.Apps || 0;
  });

  const appStatusData = Object.keys(appStatusCounts)
    .filter(key => appStatusCounts[key] > 0)
    .map(key => ({ name: key, value: appStatusCounts[key] }));

  const statusColors = {
    'Fully Disbursed': '#10b981',
    'Partially Disbursed': '#3b82f6',
    'Pending': '#f59e0b',
    'Overdue': '#dc2626',
    'Non-Compliant': '#991b1b'
  };

  const CustomTooltipCurrency = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: '700', fontSize: '13px' }}>{label}</p>
          {payload.map((entry, index) => (
             <div key={index} style={{ color: entry.color, fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>{entry.name}:</span> {formatIndianCurrency(entry.value)}
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const SchemeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const scheme = schemeData.find(s => s.name === label);
      return (
        <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: '700', fontSize: '13px' }}>{label}</p>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}><span style={{ fontWeight: 600 }}>Allocated:</span> {formatIndianCurrency(scheme.Allocated)}</div>
          <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '4px' }}><span style={{ fontWeight: 600 }}>Disbursed:</span> {formatIndianCurrency(scheme.Disbursed)}</div>
          <div style={{ color: '#60a5fa', fontSize: '12px', marginBottom: '4px' }}><span style={{ fontWeight: 600 }}>Remaining:</span> {formatIndianCurrency(scheme.Remaining)}</div>
          <div style={{ color: '#0f172a', fontSize: '12px', marginTop: '8px', fontWeight: 700 }}>Utilization: {scheme.Utilization.toFixed(2)}%</div>
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: payload[0].payload.fill, fontSize: '13px', fontWeight: 700 }}>
             {payload[0].name}: {formatIndianCurrency(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  const AppStatusTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: payload[0].payload.fill, fontSize: '13px', fontWeight: 700 }}>
             {payload[0].name}: {payload[0].value} Applications ({(payload[0].value / totalAppsCount * 100).toFixed(1)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '0 24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif", paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
         <div>
             <h1 style={{ marginBottom: '4px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Financial Analytics Dashboard</h1>
             <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Grant Officer: <span style={{ fontWeight: 600 }}>{user?.name}</span></p>
         </div>
         <div>
             <button onClick={logout} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
         </div>
      </div>

      {/* 1. TOP KPI SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Total Allocated Capacity</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>{formatIndianCurrency(metrics.globalAllocated)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Aggregate active scheme capacity</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Total Disbursed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', wordBreak: 'break-word' }}>{formatIndianCurrency(metrics.globalDisbursed)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Successfully released funds</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Remaining Capacity</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6', wordBreak: 'break-word' }}>{formatIndianCurrency(metrics.globalRemaining)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Available across all schemes</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Overall Utilization</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#a855f7', wordBreak: 'break-word' }}>{(metrics.utilization).toFixed(2)}%</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Percentage of total allocation</div>
          </div>
          <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>🔴 Non-Compliant Blocks</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#991b1b', wordBreak: 'break-word' }}>{nonCompliant.length}</div>
              <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '8px' }}>Milestones requiring attention</div>
          </div>
          <div style={{ background: '#fefce8', padding: '20px', borderRadius: '16px', border: '1px solid #fde047', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderLeft: '4px solid #eab308' }}>
              <div style={{ fontSize: '12px', color: '#eab308', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>🔶 Pending Verification</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#854d0e', wordBreak: 'break-word' }}>{compliancePending.length}</div>
              <div style={{ fontSize: '12px', color: '#a16207', marginTop: '8px' }}>Evidence waiting for review</div>
          </div>
      </div>

      {nonCompliant.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔴 Compliance Attention Required
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {nonCompliant.map((nc) => (
              <div key={`${nc.applicationId}-${nc.milestoneId}`} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>{nc.applicationReference}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: '#fecaca', color: '#7f1d1d' }}>{nc.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{nc.beneficiaryName}</span> • {nc.schemeName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#991b1b' }}>
                    <span style={{ fontWeight: 'bold' }}>Milestone:</span> Stage {nc.milestoneNumber} ({nc.milestoneName}) — {formatIndianCurrency(nc.amount)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>Rejection Reason:</span> {nc.remarks}
                  </div>
                </div>
                <div>
                  <button onClick={() => navigate(`/grant-officer/applications/${nc.applicationId}/disburse`)} style={{ padding: '8px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}>
                    Review Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {compliancePending.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#eab308', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔶 Compliance Validations Pending
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {compliancePending.map((cp) => (
              <div key={`${cp.applicationId}-${cp.milestoneId}`} style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #eab308', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#854d0e' }}>{cp.applicationReference}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: '#fef08a', color: '#854d0e' }}>{cp.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#a16207', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{cp.beneficiaryName}</span> • {cp.schemeName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#854d0e' }}>
                    <span style={{ fontWeight: 'bold' }}>Milestone:</span> Stage {cp.milestoneNumber} ({cp.milestoneName}) — {formatIndianCurrency(cp.amount)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#854d0e', marginTop: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>Submitted At:</span> {new Date(cp.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' })}
                  </div>
                </div>
                <div>
                  <button onClick={() => navigate(`/grant-officer/applications/${cp.applicationId}/disburse`)} style={{ padding: '8px 20px', background: '#eab308', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(234, 179, 8, 0.2)' }}>
                    Verify Evidence
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 2fr)', gap: '24px', marginBottom: '32px' }}>
         
         {/* 2. OVERALL FUND UTILIZATION — DONUT CHART */}
         <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>Overall Fund Utilization</h2>
            <div style={{ height: '240px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={donutData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                            {donutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{(metrics.utilization).toFixed(2)}%</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Utilized</span>
                </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Allocated:</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatIndianCurrency(metrics.globalAllocated)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Disbursed:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{formatIndianCurrency(metrics.globalDisbursed)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Remaining:</span>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>{formatIndianCurrency(metrics.globalRemaining)}</span>
                </div>
            </div>
         </div>

         {/* 3. SCHEME-WISE FINANCIAL COMPARISON */}
         <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>Scheme-wise Fund Distribution</h2>
            <div style={{ height: '320px' }}>
               <ResponsiveContainer width="100%" height="100%">
                   <BarChart layout="vertical" data={schemeData} barSize={12} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} stroke="#94a3b8" fontSize={12} />
                       <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={180} tick={{fill: '#475569'}} />
                       <Tooltip cursor={{fill: '#f8fafc'}} content={<SchemeTooltip />} />
                       <Legend wrapperStyle={{ fontSize: '12px' }} />
                       <Bar dataKey="Allocated" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                       <Bar dataKey="Disbursed" fill="#10b981" radius={[0, 4, 4, 0]} />
                       <Bar dataKey="Remaining" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                   </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '24px', marginBottom: '32px' }}>
         
         {/* 4. SCHEME UTILIZATION ANALYTICS */}
         <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>Scheme Utilization</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {schemeData.map(scheme => (
                    <div key={scheme.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{scheme.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{scheme.Utilization.toFixed(2)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, scheme.Utilization)}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #6366f1)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                        </div>
                    </div>
                ))}
            </div>
         </div>

         {/* 6. DISBURSEMENT STATUS DISTRIBUTION */}
         <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Application Disbursement Status</h2>
            <div style={{ height: '260px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={appStatusData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                            {appStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip content={<AppStatusTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{totalAppsCount}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Applications</span>
                </div>
            </div>
         </div>
      </div>

      {/* 5. REGIONAL FUND UTILIZATION */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Regional Fund Utilization</h2>
              <select 
                  value={regionFilter} 
                  onChange={(e) => setRegionFilter(e.target.value)} 
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#f8fafc' }}
              >
                  <option value="All Regions">All Regions</option>
                  {regionalData.map(r => (
                      <option key={r.region} value={r.region}>{r.region}</option>
                  ))}
              </select>
          </div>
          <div style={{ height: `${Math.max(300, chartRegionalData.length * 60)}px`, minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <BarChart layout="vertical" data={chartRegionalData} barSize={20} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} stroke="#94a3b8" fontSize={12} />
                      <YAxis type="category" dataKey="region" stroke="#94a3b8" fontSize={12} width={120} tick={{fill: '#475569', fontWeight: 600}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltipCurrency />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Approved" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} />
                      <Bar dataKey="Planned" stackId="a" fill="#a855f7" />
                      <Bar dataKey="Released" stackId="a" fill="#10b981" />
                      <Bar dataKey="Remaining" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* 8. FUND FLOW */}
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Aggregate Fund Flow</h2>
      <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '40px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '800px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>Allocated</div>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#94a3b8' }}>{formatIndianCurrency(metrics.globalAllocated)}</div>
                  </div>
              </div>
              <div style={{ color: '#cbd5e1', padding: '0 16px' }}>➔</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>Approved</div>
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'inline-block' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>{formatIndianCurrency(totalApprovedAmt)}</div>
                  </div>
              </div>
              <div style={{ color: '#cbd5e1', padding: '0 16px' }}>➔</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>Planned</div>
                  <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', display: 'inline-block' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#a855f7' }}>{formatIndianCurrency(totalPlannedAmt)}</div>
                  </div>
              </div>
              <div style={{ color: '#cbd5e1', padding: '0 16px' }}>➔</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>Released</div>
                  <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', display: 'inline-block' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{formatIndianCurrency(totalReleasedAmt)}</div>
                  </div>
              </div>
          </div>
      </div>

      {/* 7. STAGED DISBURSEMENT ANALYTICS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Staged Disbursement Analytics</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search application..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredPlans.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>No disbursement plans found matching criteria.</div>
          ) : (
              filteredPlans.map(plan => (
                  <div key={plan.applicationId} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                          <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{plan.applicationReference}</h3>
                                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>{plan.status.replace('_', ' ')}</span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}><span style={{ fontWeight: 600, color: '#334155' }}>{plan.beneficiaryName}</span> • {plan.schemeName}</div>
                          </div>
                          <div>
                              <button onClick={() => navigate(`/grant-officer/applications/${plan.applicationId}/disburse`)} style={{ padding: '8px 20px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>View Details</button>
                          </div>
                      </div>

                      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9' }}>
                          {/* Timeline Representation */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                              
                              {/* Connector Line Base */}
                              <div style={{ position: 'absolute', top: '24px', left: '16.66%', right: '16.66%', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                              
                              {/* Connector Line Progress */}
                              <div style={{ position: 'absolute', top: '24px', left: '16.66%', height: '2px', background: '#10b981', zIndex: 0, width: `calc(66.66% * ${plan.progressPercentage} / 100)`, transition: 'width 0.5s' }}></div>

                              {/* Stage 1: Documentation / Approved */}
                              <div style={{ zIndex: 1, textAlign: 'center', width: '33.33%', background: 'transparent' }}>
                                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: plan.approvedAmount > 0 ? '#10b981' : '#e2e8f0', margin: '16px auto', border: '4px solid #f8fafc', boxSizing: 'content-box' }}></div>
                                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Stage 1 — Documentation</div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{formatIndianCurrency(plan.approvedAmount)}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Scheduled</div>
                              </div>
                              
                              {/* Stage 2: Utilization Proof / Released */}
                              <div style={{ zIndex: 1, textAlign: 'center', width: '33.33%', background: 'transparent' }}>
                                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: plan.releasedAmount > 0 ? '#10b981' : '#e2e8f0', margin: '16px auto', border: '4px solid #f8fafc', boxSizing: 'content-box' }}></div>
                                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Stage 2 — Utilization Proof</div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{formatIndianCurrency(plan.releasedAmount)}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Released</div>
                              </div>

                              {/* Stage 3: Final Release / Remaining */}
                              <div style={{ zIndex: 1, textAlign: 'center', width: '33.33%', background: 'transparent' }}>
                                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: plan.remainingAmount === 0 && plan.progressPercentage === 100 ? '#10b981' : '#e2e8f0', margin: '16px auto', border: '4px solid #f8fafc', boxSizing: 'content-box' }}></div>
                                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Stage 3 — Final Release</div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>{formatIndianCurrency(plan.remainingAmount)}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pending</div>
                              </div>

                          </div>

                          {plan.nextMilestone && plan.progressPercentage < 100 && (
                              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Next Milestone:</span> <span style={{ fontWeight: 600, color: '#334155' }}>{plan.nextMilestone}</span>
                                  {plan.nextMilestoneDueDate && <span style={{ marginLeft: '8px', color: plan.overdueMilestones > 0 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>Due {new Date(plan.nextMilestoneDueDate).toLocaleDateString()}</span>}
                              </div>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>

    </div>
  );
}
