import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schemeService } from '../../services/schemeService';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

const SchemeDetails = () => {
    const { schemeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [scheme, setScheme] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eligibilityData, setEligibilityData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [eligibilityResult, setEligibilityResult] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [schemeData, criteriaData] = await Promise.all([
                    schemeService.getSchemeById(schemeId),
                    schemeService.getSchemeCriteria(schemeId, true)
                ]);
                setScheme(schemeData);
                setCriteria(criteriaData);
                const init = {};
                criteriaData.forEach(c => { init[c.fieldName] = ''; });
                setEligibilityData(init);
            } catch (err) {
                setError(err.message || 'Failed to load scheme details.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [schemeId]);

    const handleInput = (field, value) => setEligibilityData(p => ({ ...p, [field]: value }));

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        try {
            const application = await applicationService.applyForScheme(schemeId, eligibilityData);
            setEligibilityResult(application.status);
            if (application.status !== 'NOT_ELIGIBLE') {
                setTimeout(() => navigate(`/beneficiary/applications/${application.id}`, { state: { application } }), 1800);
            } else {
                setSubmitError(application.remarks || 'You did not meet the minimum eligibility requirements for this scheme.');
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || err.message || 'Application failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="loading-wrap">
            <div className="spinner" />
            <p className="loading-text">Loading scheme details...</p>
        </div>
    );

    if (error) return (
        <div>
            <div className="alert alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
            </div>
            <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => navigate(-1)}>← Back to Schemes</button>
        </div>
    );

    if (!scheme) return null;

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#64748b' }}>
                <button onClick={() => navigate('/beneficiary/schemes')} style={{ background: 'none', border: 'none', color: '#1a56db', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Available Schemes</button>
                <span>›</span>
                <span>{scheme.name}</span>
            </div>

            {/* Scheme Info Card */}
            <div className="portal-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '28px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc, #fff)' }}>
                    <span className="scheme-code">{scheme.schemeCode}</span>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '8px', marginBottom: '12px' }}>{scheme.schemeName}</h1>
                    <p style={{ color: '#475569', lineHeight: '1.75', fontSize: '14px' }}>{scheme.description}</p>
                </div>
                <div style={{ padding: '20px 28px', display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0' }}>
                    {[
                        { label: 'Target Category', value: scheme.beneficiaryCategory },
                        { label: 'Applicable Region', value: scheme.applicableRegion },
                        { label: 'Grant Amount', value: `₹${scheme.grantAmount?.toLocaleString('en-IN')}`, green: true },
                    ].map((item, i) => (
                        <div key={item.label} style={{ flex: 1, padding: '0 20px', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none', paddingLeft: i === 0 ? 0 : '20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '15px', fontWeight: '700', color: item.green ? '#059669' : '#0f172a' }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Eligibility Form */}
            <div className="portal-card">
                <div className="portal-card-header">
                    <div>
                        <h2>Eligibility Check & Application</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Fill in your details to check eligibility. Fields marked <span style={{ color: '#dc2626' }}>*</span> are mandatory.</p>
                    </div>
                </div>
                <div className="portal-card-body">
                    {eligibilityResult === 'ELIGIBLE' || eligibilityResult === 'DOCUMENTS_PENDING' ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', marginBottom: '8px' }}>You're Eligible!</h3>
                            <p style={{ color: '#047857', fontSize: '14px' }}>Application created successfully. Redirecting to document upload...</p>
                            <div className="spinner" style={{ margin: '20px auto 0', borderTopColor: '#059669' }} />
                        </div>
                    ) : (
                        <form onSubmit={handleApply}>
                            {submitError && (
                                <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    <div><strong>Not Eligible</strong><p style={{ fontWeight: 400, marginTop: '2px' }}>{submitError}</p></div>
                                </div>
                            )}

                            {criteria.length === 0 ? (
                                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                                    No eligibility criteria configured for this scheme. You can apply directly.
                                </div>
                            ) : (
                                <div className="portal-form-grid" style={{ marginBottom: '28px' }}>
                                    {criteria.map(c => (
                                        <div key={c.id} className="portal-form-field">
                                            <label>
                                                {c.criterionName}
                                                {c.mandatory && <span className="required">*</span>}
                                            </label>
                                            {c.criterionType === 'BOOLEAN' ? (
                                                <select
                                                    className="portal-input portal-select"
                                                    value={eligibilityData[c.fieldName]}
                                                    onChange={e => handleInput(c.fieldName, e.target.value)}
                                                    required={c.mandatory}
                                                >
                                                    <option value="" disabled>Select...</option>
                                                    <option value="true">Yes</option>
                                                    <option value="false">No</option>
                                                </select>
                                            ) : c.criterionType === 'NUMERIC' ? (
                                                <input
                                                    type="number" step="any"
                                                    className="portal-input"
                                                    value={eligibilityData[c.fieldName]}
                                                    onChange={e => handleInput(c.fieldName, e.target.value)}
                                                    placeholder={`e.g. ${c.expectedValue || '0'}`}
                                                    required={c.mandatory}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="portal-input"
                                                    value={eligibilityData[c.fieldName]}
                                                    onChange={e => handleInput(c.fieldName, e.target.value)}
                                                    placeholder={`Enter ${c.criterionName.toLowerCase()}`}
                                                    required={c.mandatory}
                                                />
                                            )}
                                            {c.description && <span className="portal-input-help">{c.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                                    ) : '✓ Submit Application'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchemeDetails;
