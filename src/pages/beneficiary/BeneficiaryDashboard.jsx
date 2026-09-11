import React, { useEffect, useState } from 'react';
import { schemeService } from '../../services/schemeService';
import { beneficiaryService } from '../../services/beneficiaryService';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BeneficiaryDashboard = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileExists, setProfileExists] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Check profile status
                try {
                    const profile = await beneficiaryService.getMyProfile();
                    setProfileExists(profile.profileExists !== false);
                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        setProfileExists(false);
                    } else {
                        console.error('Error checking profile:', err);
                    }
                }

                // 2. Load schemes
                const activeSchemes = await schemeService.getActiveSchemes();
                setSchemes(activeSchemes);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            {/* Page Header */}
            <div className="portal-page-header">
                <h1>Dashboard</h1>
                <p>Overview of your beneficiary account and available government schemes.</p>
            </div>

            {!profileExists && (
                <div className="alert alert-warning" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                        </svg>
                        <div>
                            <strong>Profile Incomplete</strong>
                            <p style={{ marginTop: '2px', color: '#b45309' }}>Complete your profile to apply for government schemes.</p>
                        </div>
                    </div>
                    <NavLink to="/beneficiary/profile" className="btn btn-primary btn-sm" style={{ background: '#d97706', borderColor: '#d97706' }}>
                        Complete Profile
                    </NavLink>
                </div>
            )}

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}. Make sure the backend is running on port 8080.
                </div>
            )}

            {/* Stats Row */}
            <div className="stat-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                    </div>
                    <div className="dash-stat-body">
                        <div className="dash-stat-number">{loading ? '—' : schemes.length}</div>
                        <div className="dash-stat-label">Active Schemes</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div className="dash-stat-body">
                        <div className="dash-stat-number">3</div>
                        <div className="dash-stat-label">Verification Levels</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div className="dash-stat-body">
                        <div className="dash-stat-number">100%</div>
                        <div className="dash-stat-label">Digital Process</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Browse Schemes */}
                <div className="portal-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', border: 'none', overflow: 'visible' }}>
                    <div style={{ padding: '28px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(26,86,219,0.3)', border: '1px solid rgba(26,86,219,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                        <h3 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '17px', marginBottom: '8px' }}>Browse Schemes</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Explore {schemes.length} active government subsidy programs and check if you qualify.
                        </p>
                        <NavLink to="/beneficiary/schemes" className="btn btn-primary btn-sm">
                            View All Schemes →
                        </NavLink>
                    </div>
                </div>

                {/* Track Applications */}
                <div className="portal-card">
                    <div style={{ padding: '28px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <line x1="10" y1="9" x2="8" y2="9"/>
                            </svg>
                        </div>
                        <h3 style={{ color: '#0f172a', fontWeight: '700', fontSize: '17px', marginBottom: '8px' }}>My Applications</h3>
                        <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Track the status of your submitted applications and manage document uploads.
                        </p>
                        <NavLink to="/beneficiary/applications" className="btn btn-outline btn-sm">
                            View Applications →
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Process Overview */}
            <div className="portal-card">
                <div className="portal-card-header">
                    <h2>Application Process</h2>
                </div>
                <div className="portal-card-body">
                    <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
                        {[
                            { step: '01', title: 'Browse Schemes', desc: 'Find active government schemes matching your eligibility criteria.', color: '#eff6ff', accent: '#1a56db' },
                            { step: '02', title: 'Check Eligibility', desc: 'Fill out the dynamic eligibility form. Get an instant score.', color: '#ecfdf5', accent: '#059669' },
                            { step: '03', title: 'Upload Documents', desc: 'Submit all required supporting documents digitally.', color: '#f5f3ff', accent: '#7c3aed' },
                            { step: '04', title: 'Officer Review', desc: 'Your application goes through multi-level officer verification.', color: '#fff7ed', accent: '#d97706' },
                        ].map((s, i) => (
                            <div key={s.step} style={{ flex: 1, padding: '20px', position: 'relative' }}>
                                {i < 3 && <div style={{ position: 'absolute', top: '32px', right: '-1px', width: '2px', height: '32px', background: '#e2e8f0', zIndex: 1 }} />}
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: s.accent }}>{s.step}</span>
                                </div>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>{s.title}</h4>
                                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeneficiaryDashboard;
