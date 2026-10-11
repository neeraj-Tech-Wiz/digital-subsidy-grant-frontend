import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { 
    FiSettings, FiActivity, FiUsers, FiBox, FiLogOut, 
    FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiClock,
    FiFileText, FiDollarSign, FiShield, FiDatabase, FiArrowRight
} from "react-icons/fi";
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { fetchAdminDashboardStats } from "../../services/adminDashboardService";
import "./Admin.css";

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4', '#d946ef', '#f97316'];

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to load dashboard metrics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (val) => {
      if (!val) return '₹0';
      return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const timeAgo = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderStatusChart = () => {
      if (!stats || !stats.applicationStatusDistribution) return null;
      const data = Object.entries(stats.applicationStatusDistribution).map(([name, value]) => ({ name, value }));
      return (
          <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                  <Pie data={data} cx="50%" cy="40%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend 
                      verticalAlign="bottom" 
                      layout="horizontal" 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingBottom: '10px', lineHeight: '18px' }}
                  />
              </PieChart>
          </ResponsiveContainer>
      );
  };

  const renderFundFlowChart = () => {
    if (!stats || !stats.fundFlow) return null;
    const data = [
        { name: 'Allocated', amount: stats.fundFlow.Allocated },
        { name: 'Planned/Reserved', amount: stats.fundFlow.Planned },
        { name: 'Released', amount: stats.fundFlow.Released }
    ];
    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
        </ResponsiveContainer>
    );
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">
             <FiShield size={20} color="white" />
          </div>
          <h2>Admin Portal</h2>
        </div>
        
        <div className="admin-sidebar-nav">
          <div className="nav-section-title">OVERVIEW</div>
          <Link to="/admin/dashboard" className="admin-nav-item active">
            <FiSettings className="nav-icon" /> Dashboard
          </Link>

          <div className="nav-section-title mt-4">OPERATIONS</div>
          <Link to="/admin/schemes" className="admin-nav-item">
            <FiDatabase className="nav-icon" /> Scheme Management
          </Link>

          <div className="nav-section-title mt-4">MONITORING</div>
          <Link to="/admin/audit" className="admin-nav-item">
            <FiActivity className="nav-icon" /> Activity & Audit Log
          </Link>
        </div>
        
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="user-details">
              <strong>{user?.name || 'Administrator'}</strong>
              <span>{user?.email} • {user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <FiLogOut /> Secure Logout
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div className="header-titles">
            <h1>Operational Command Center</h1>
            <p>Monitor platform operations, applications, grants and security activity.</p>
          </div>
          <div className="header-actions">
            <span className="last-updated">Last updated: {lastUpdated || 'Loading...'}</span>
            <button className="btn-primary-action" onClick={loadStats} disabled={loading}>
                <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        {loading ? (
            <div className="loading-state">Synchronizing secure data...</div>
        ) : (
            <>
              {/* Quick Actions (Scheme / Logging) */}
              <div className="quick-actions-grid">
                 {/* Scheme Management Card */}
                 <div className="action-card scheme-card">
                      <div className="action-card-header">
                          <div>
                              <h3 className="action-title">
                                  <FiDatabase style={{ color: '#2563eb' }} /> Scheme Management
                              </h3>
                              <p className="action-desc">Manage schemes & eligibility criteria</p>
                          </div>
                      </div>
                      <Link to="/admin/schemes" className="action-link scheme-link">
                          Manage Schemes <FiArrowRight className="arrow-icon" />
                      </Link>
                 </div>

                 {/* System Audit Log Action Link */}
                 <div className="action-card audit-card">
                      <div className="action-card-header">
                          <div>
                              <h3 className="action-title">
                                  <FiShield style={{ color: '#f59e0b' }} /> System Audit Log
                              </h3>
                              <p className="action-desc">Review platform activity</p>
                          </div>
                      </div>
                      <Link to="/admin/audit" className="action-link audit-link">
                          View Activity <FiArrowRight className="arrow-icon" />
                      </Link>
                 </div>
              </div>
                {/* KPIs GRID */}
                <div className="admin-kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon blue"><FiUsers /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{stats.totalBeneficiaries}</span>
                            <span className="kpi-lbl">Total Beneficiaries</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon green"><FiBox /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{stats.activeSchemes}</span>
                            <span className="kpi-lbl">Active Schemes</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon orange"><FiClock /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{stats.pendingApplications}</span>
                            <span className="kpi-lbl">Pending Applications</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon teal"><FiCheckCircle /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{stats.approvedApplications}</span>
                            <span className="kpi-lbl">Approved Applications</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon indigo"><FiDollarSign /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{formatCurrency(stats.totalFundsReleased)}</span>
                            <span className="kpi-lbl">Total Funds Released</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon purple"><FiActivity /></div>
                        <div className="kpi-data">
                            <span className="kpi-val">{stats.activityToday}</span>
                            <span className="kpi-lbl">Activity Today</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content-grid">
                    {/* LEFT COLUMN: Actions & Activity */}
                    <div className="left-col">
                        
                        {/* ATTENTION REQUIRED */}
                        <div className="dashboard-panel alert-panel">
                            <h3 className="panel-title"><FiAlertTriangle className="text-amber-500 mr-2 inline" /> Attention Required</h3>
                            <ul className="alert-list">
                                {stats.attentionRequired?.verificationPending > 0 && (
                                    <li>
                                        <div className="alert-info">
                                            <strong>{stats.attentionRequired.verificationPending} Applications</strong> awaiting verification
                                        </div>
                                    </li>
                                )}
                                {stats.attentionRequired?.finalApprovalPending > 0 && (
                                    <li>
                                        <div className="alert-info">
                                            <strong>{stats.attentionRequired.finalApprovalPending} Applications</strong> awaiting final approval
                                        </div>
                                    </li>
                                )}
                                {stats.attentionRequired?.nonCompliantMilestones > 0 && (
                                    <li>
                                        <div className="alert-info">
                                            <strong>{stats.attentionRequired.nonCompliantMilestones} Non-compliant milestones</strong> demanding intervention
                                        </div>
                                    </li>
                                )}
                                {stats.attentionRequired?.complianceReviewsPending > 0 && (
                                    <li>
                                        <div className="alert-info">
                                            <strong>{stats.attentionRequired.complianceReviewsPending} Compliance reviews</strong> pending
                                        </div>
                                    </li>
                                )}
                                {stats.attentionRequired?.failedSecurityEvents > 0 && (
                                    <li>
                                        <div className="alert-info text-rose-600">
                                            <strong>{stats.attentionRequired.failedSecurityEvents} Failed security/login events</strong> today
                                        </div>
                                        <Link to="/admin/audit" className="alert-action">Review Audits</Link>
                                    </li>
                                )}
                                
                                {Object.values(stats.attentionRequired || {}).every(v => v === 0) && (
                                    <li className="text-gray-500 text-sm py-4">No critical interventions required at this time.</li>
                                )}
                            </ul>
                        </div>

                        {/* RECENT ACTIVITY */}
                        <div className="dashboard-panel">
                            <div className="panel-header-row">
                                <h3 className="panel-title">Recent Activity</h3>
                                <Link to="/admin/audit" className="header-link">View all activity &rarr;</Link>
                            </div>
                            <div className="activity-timeline">
                                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                                    stats.recentActivity.map((event, idx) => (
                                        <div className="activity-item" key={idx}>
                                            <div className="activity-time">{timeAgo(event.timestamp)}</div>
                                            <div className="activity-content">
                                                <div className="activity-event">{event.eventTypeStr || event.eventType || event.action}</div>
                                                <div className="activity-meta">
                                                    By <strong>{event.actorEmail || 'SYSTEM'}</strong> 
                                                    {event.applicationId && ` on App #${event.applicationId}`}
                                                </div>
                                            </div>
                                            <div className="activity-status">
                                                {event.success ? (
                                                    <span className="act-success">OK</span>
                                                ) : (
                                                    <span className="act-failed">FAIL</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 text-sm py-4">No recent activity detected.</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Analytics */}
                    <div className="right-col">
                        <div className="dashboard-panel">
                            <h3 className="panel-title">Application Status Distribution</h3>
                            <div className="chart-container">
                                {renderStatusChart()}
                            </div>
                        </div>
                        
                        <div className="dashboard-panel">
                            <h3 className="panel-title">Fund Flow Tracking (₹)</h3>
                            <div className="chart-container">
                                {renderFundFlowChart()}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
