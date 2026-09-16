import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { formatIndianCurrency } from '../../utils/currencyFormatting';

const STATUS_CONFIG = {
    DOCUMENTS_PENDING: { label: 'Documents Pending', cls: 'badge-yellow', step: 1 },
    PENDING_VERIFICATION: { label: 'Pending Verification', cls: 'badge-purple', step: 2 },
    UNDER_VERIFICATION: { label: 'Under Verification', cls: 'badge-blue', step: 2 },
    ELIGIBLE: { label: 'Eligible', cls: 'badge-green', step: 1 },
    NOT_ELIGIBLE: { label: 'Not Eligible', cls: 'badge-red', step: 3 },
    APPROVED: { label: 'Approved', cls: 'badge-emerald', step: 3 },
    REJECTED: { label: 'Rejected', cls: 'badge-red', step: 3 },
    ESCALATED: { label: 'Escalated', cls: 'badge-orange', step: 2 },
    RETURNED_TO_APPLICANT: { label: 'Action Required', cls: 'badge-orange', step: 2 },
    GRANT_DISBURSED: { label: 'Grant Disbursed', cls: 'badge-emerald', step: 3 },
};

const formatDate = (ds) => {
    if (!ds) return 'N/A';
    const d = new Date(ds);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grantsMap, setGrantsMap] = useState({});

    useEffect(() => {
        Promise.all([
            applicationService.getMyApplications(),
            applicationService.getMyGrants().catch(() => [])
        ])
            .then(([apps, grants]) => {
                setApplications(apps);
                const gMap = {};
                grants.forEach(g => gMap[g.applicationId] = g);
                setGrantsMap(gMap);
            })
            .catch(err => {
                // If profile missing, they shouldn't even have apps, but just handle it
                if (err.response?.status !== 404) {
                    setError('Failed to fetch your applications.');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b' }}>Loading applications...</p>
        </div>
    );

    return (
        <div>
            <div className="portal-page-header">
                <h1>My Applications</h1>
                <p>Track and manage your submitted subsidy applications.</p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                </div>
            )}

            {applications.length === 0 && !error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <h3>No Application History Available</h3>
                    <p>You haven't applied to any government schemes yet. Browse available schemes to securely apply and track their status here.</p>
                    <NavLink to="/beneficiary/schemes" className="btn btn-primary">
                        Browse Available Schemes
                    </NavLink>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {applications.map(app => (
                        <div 
                            key={app.id} 
                            className="portal-card" 
                            style={{ 
                                padding: '24px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/beneficiary/applications/${app.id}`, { state: { application: app } })}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        APP-{String(app.id).padStart(5, '0')}
                                    </span>
                                    <span className={`portal-status-badge ${STATUS_CONFIG[app.status]?.cls || 'badge-blue'}`}>
                                        {STATUS_CONFIG[app.status]?.label || app.status}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                                    Scheme Application #{app.id}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>
                                    Applied on {formatDate(app.applicationDate)} 
                                    {app.verificationDueDate && ` • Verification due by ${formatDate(app.verificationDueDate)}`}
                                </p>
                                {app.status === 'GRANT_DISBURSED' && grantsMap[app.id] && (
                                    <div style={{ marginTop: '12px', background: '#ecfdf5', border: '1px solid #10b981', padding: '8px 12px', borderRadius: '6px', display: 'inline-block' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#047857', marginBottom: '2px', textTransform: 'uppercase' }}>Amount Successfully Disbursed</p>
                                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{formatIndianCurrency(grantsMap[app.id].grantAmount)}</p>
                                        <p style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                                            Transaction: {grantsMap[app.id].transactionReference} • Disbursed: {formatDate(grantsMap[app.id].disbursedAt)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <button className="btn btn-outline btn-sm">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyApplications;
