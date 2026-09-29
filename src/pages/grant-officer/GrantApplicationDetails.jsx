import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import grantService from "../../services/grantService";
import { documentService } from "../../services/documentService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

export default function GrantApplicationDetails() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    
    const [application, setApplication] = useState(null);
    const [schemeSummary, setSchemeSummary] = useState(null);
    const [plan, setPlan] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);
    const [downloadingEvidenceId, setDownloadingEvidenceId] = useState(null);
    const [reviewRemarks, setReviewRemarks] = useState({});

    const handleViewEvidence = async (evidenceId) => {
        setDownloadingEvidenceId(evidenceId);
        try {
            const res = await grantService.downloadMilestoneEvidence(evidenceId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            window.open(url, '_blank');
        } catch (err) {
            alert('Failed to view evidence.');
        } finally {
            setDownloadingEvidenceId(null);
        }
    };

    const handleViewPassbook = async (documentId) => {
        setDownloadingEvidenceId(documentId);
        try {
            const res = await documentService.downloadDocument(documentId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            window.open(url, '_blank');
        } catch (err) {
            alert('Failed to view passbook.');
        } finally {
            setDownloadingEvidenceId(null);
        }
    };

    const handleDownloadEvidence = async (evidenceId, filename) => {
        setDownloadingEvidenceId(evidenceId);
        try {
            const res = await grantService.downloadMilestoneEvidence(evidenceId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert('Failed to download evidence.');
        } finally {
            setDownloadingEvidenceId(null);
        }
    };
    const [error, setError] = useState("");
    const [evidenceData, setEvidenceData] = useState({});
    
    const loadEvidence = async (mId) => {
        try {
            const res = await grantService.getMilestoneEvidence(mId);
            setEvidenceData(prev => ({...prev, [mId]: res.data}));
        } catch (e) {
            console.error('Failed to load evidence', e);
        }
    };
    
    const handleVerify = async (mId, approve) => {
        try {
            setActioning(true);
            const remarks = reviewRemarks[`m_${mId}`] || "No remarks";
            await grantService.verifyMilestoneCompliance(mId, approve, remarks);
            setReviewRemarks(prev => ({...prev, [`m_${mId}`]: ""}));
            await fetchData();
        } catch (e) {
            setError(e.response?.data?.message || 'Verification failed');
        } finally {
            setActioning(false);
        }
    };
    
    const handleVerifyEvidence = async (mId, evidenceId, action) => {
        try {
            setActioning(true);
            const remarks = reviewRemarks[`ev_${evidenceId}`];
            if ((action === 'REJECTED' || action === 'NON_COMPLIANT') && (!remarks || !remarks.trim())) {
                setError('Remarks are mandatory for rejection or non-compliance.');
                setActioning(false);
                return;
            }
            await grantService.reviewMilestoneEvidence(mId, evidenceId, action, remarks || 'Verified');
            setReviewRemarks(prev => ({...prev, [`ev_${evidenceId}`]: ""}));
            await loadEvidence(mId);
            await fetchData();
        } catch (e) {
            setError(e.response?.data?.message || 'Evidence review failed');
        } finally {
            setActioning(false);
        }
    };

    const handleVerifyPassbook = async (applicationId, documentId, action) => {
        try {
            setActioning(true);
            const remarks = reviewRemarks[`doc_${documentId}`];
            if (action === 'REJECTED' && (!remarks || !remarks.trim())) {
                setError('Remarks are mandatory for rejection.');
                setActioning(false);
                return;
            }
            await grantService.verifyMilestonePassbook(applicationId, documentId, action, remarks || 'Verified');
            setReviewRemarks(prev => ({...prev, [`doc_${documentId}`]: ""}));
            await fetchData();
        } catch (e) {
            setError(e.response?.data?.message || 'Passbook verification failed');
        } finally {
            setActioning(false);
        }
    };
    
    // Plan creation state
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [milestones, setMilestones] = useState([]);

    useEffect(() => {
        if (showPlanForm && schemeSummary) {
            const approved = schemeSummary.grantAmount;
            const stage1 = Math.round(approved * 0.40);
            const stage2 = Math.round(approved * 0.30);
            const stage3 = approved - stage1 - stage2;
            
            setMilestones([
                { milestoneNumber: 1, milestoneName: 'Initial Documentation', complianceType: 'DOCUMENTATION', scheduledAmount: stage1, dueDateOffsetDays: 10 },
                { milestoneNumber: 2, milestoneName: 'Utilization Proof', complianceType: 'UTILIZATION_PROOF', scheduledAmount: stage2, dueDateOffsetDays: 30 },
                { milestoneNumber: 3, milestoneName: 'Final Release', complianceType: 'NONE', scheduledAmount: stage3, dueDateOffsetDays: 60 }
            ]);
        }
    }, [showPlanForm, schemeSummary]);

    useEffect(() => {
        fetchData();
    }, [applicationId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const appRes = await grantService.getGrantApplication(applicationId);
            const app = appRes.data;
            setApplication(app);
            
            try {
                const docsObj = await documentService.getApplicationDocuments(applicationId);
                setDocuments(docsObj || []);
            } catch (err) {
                console.error('Failed to load application documents', err);
            }

            // Fetch Scheme
            const schemesRes = await fetch('http://localhost:8080/api/schemes');
            const schemes = await schemesRes.json();
            const scheme = schemes.find(s => s.schemeName === app.schemeName);
            
            if (scheme) {
                const summaryRes = await grantService.getSchemeFinanceSummary(scheme.id);
                setSchemeSummary(summaryRes.data);
            }

            // Fetch Plan if it exists
            if (app.status !== 'APPROVED' && app.status !== 'REJECTED') {
                try {
                    const planRes = await grantService.getDisbursementPlan(applicationId);
                    setPlan(planRes.data);
                } catch (e) {
                    console.log('No plan exists yet');
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load application details.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        const total = milestones.reduce((sum, m) => sum + Number(m.scheduledAmount), 0);
        if (total !== schemeSummary.grantAmount) {
            setError(`Total milestones sum (${formatIndianCurrency(total)}) must equal approved grant (${formatIndianCurrency(schemeSummary.grantAmount)})`);
            return;
        }

        try {
            setActioning(true);
            await grantService.createDisbursementPlan(applicationId, { milestones });
            setShowPlanForm(false);
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create plan.");
        } finally {
            setActioning(false);
        }
    };

    const handleRelease = async (milestoneId) => {
        if (!window.confirm("Confirm release of funds for this milestone? This action cannot be reversed.")) return;
        try {
            setActioning(true);
            await grantService.releaseMilestone(milestoneId, applicationId);
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to release milestone funds.");
        } finally {
            setActioning(false);
        }
    };

    const handleNukePlan = async () => {
        if (!window.confirm("DANGER: This will delete the entire disbursement plan and all fund releases. Proceed?")) return;
        try {
            setActioning(true);
            await grantService.nukeDisbursementPlan(applicationId);
            setPlan(null);
            await fetchData();
            alert("Plan erased successfully. Please close and re-configure.");
        } catch (err) {
            alert('Failed to nuke plan');
        } finally {
            setActioning(false);
        }
    };

    const addMilestone = () => {
        setMilestones([...milestones, { 
            milestoneNumber: milestones.length + 1, 
            milestoneName: '', 
            complianceType: 'DOCUMENTATION', 
            scheduledAmount: 0, 
            dueDateOffsetDays: 30 
        }]);
    };

    const updateMilestone = (index, field, value) => {
        const updated = [...milestones];
        updated[index][field] = value;
        setMilestones(updated);
    };

    if (loading) return (
        <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748b' }}>Loading application profile...</p>
        </div>
    );
    if (!application) return <div style={{ padding: '40px', textAlign: 'center' }}>Application not found.</div>;

    const renderMilestoneBadge = (status) => {
        const colors = {
            COMPLETED: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
            RELEASED: { bg: '#f0fdfa', color: '#0f766e', border: '#ccfbf1' },
            PENDING: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
            DUE: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
            OVERDUE: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
            NON_COMPLIANT: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
            BLOCKED: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
        };
        const c = colors[status] || colors.PENDING;
        return (
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 0', fontFamily: "'Inter', sans-serif" }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Disbursement Details</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>APP-{application.applicationId}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                            {application.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {plan && (
                        <button onClick={handleNukePlan} disabled={actioning} style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>Reset Plan (Dev)</button>
                    )}
                    <button onClick={() => navigate('/grant-officer/pending')} style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Back to Queue</button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {/* Beneficiary Meta Info */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Beneficiary Profile</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Full Name</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.beneficiaryName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Scheme</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.schemeName}</div>
                        </div>
                    </div>
                </div>

                {/* Scheme & Finance Overview */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Grant Overview</h2>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Approved Amount</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#4ade80', letterSpacing: '-1px' }}>{schemeSummary ? formatIndianCurrency(schemeSummary.grantAmount) : '...'}</div>
                    </div>
                </div>
            </div>

            {application.status === 'APPROVED' && !showPlanForm && (
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No Disbursement Plan</h3>
                    <p style={{ color: '#475569', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>This application is approved but requires a staged disbursement schedule before funds can be released.</p>
                    <button onClick={() => setShowPlanForm(true)} style={{ padding: '12px 24px', background: '#1a56db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)' }}>Configure Disbursement Plan</button>
                </div>
            )}

            {showPlanForm && (
                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Disbursement Plan Configurator</h2>
                        <button onClick={() => setShowPlanForm(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {milestones.map((m, idx) => (
                            <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(100px, 1fr)', gap: '16px', alignItems: 'end', opacity: 0.9 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Milestone {m.milestoneNumber} Name</label>
                                    <input value={m.milestoneName} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', background: '#e2e8f0', cursor: 'not-allowed' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Compliance Proof</label>
                                    <select value={m.complianceType} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', background: '#e2e8f0', cursor: 'not-allowed' }}>
                                        <option value="DOCUMENTATION">Documentation</option>
                                        <option value="UTILIZATION_PROOF">Utilization Proof</option>
                                        <option value="NONE">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Amount (₹) {idx===0?'(40%)':idx===1?'(30%)':'(Rem)'}</label>
                                    <input type="number" value={m.scheduledAmount} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', background: '#e2e8f0', cursor: 'not-allowed', fontWeight: 700, color: '#0f172a' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Due Offset (Days)</label>
                                    <input type="number" value={m.dueDateOffsetDays} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', background: '#e2e8f0', cursor: 'not-allowed' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '14px', color: '#475569' }}>Total Configured: <strong>{formatIndianCurrency(milestones.reduce((sum, m) => sum + Number(m.scheduledAmount), 0))}</strong></div>
                            <button onClick={handleCreatePlan} disabled={actioning} style={{ padding: '12px 32px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: actioning ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
                                {actioning ? 'Saving Plan...' : 'Finalize Standard Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {plan && (
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>Staged Disbursement Schedule</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[...plan.milestones].sort((a,b) => a.number - b.number).map((m, index, arr) => (
                            <React.Fragment key={m.id}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ minWidth: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#475569', fontSize: '16px', marginRight: '24px' }}>
                                    {m.number}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{m.name || `Milestone ${m.number}`}</h3>
                                        {renderMilestoneBadge(m.status)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            Due: {new Date(m.dueDate).toLocaleDateString()}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            Proof: {m.complianceType.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {m.remarks && <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Note: {m.remarks}</div>}
                                </div>
                                <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>{formatIndianCurrency(m.amount)}</div>
                                    
                                    {(m.status === 'COMPLETED' || (m.status === 'PENDING' && m.complianceType === 'NONE')) && 
                                     (index === 0 || arr.slice(0, index).every(prev => prev.status === 'RELEASED')) ? (
                                        <button 
                                            onClick={() => handleRelease(m.id)}
                                            disabled={actioning}
                                            style={{ padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: actioning ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)' }}
                                        >
                                            Release Funds
                                        </button>
                                    ) : m.status === 'RELEASED' ? (
                                        <div style={{ color: '#059669', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            Actioned
                                        </div>
                                    ) : m.status === 'BLOCKED' ? (
                                        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, maxWidth: '120px', textAlign: 'right' }}>Mandatory condition unmet</div>
                                    ) : m.status === 'COMPLIANCE_SUBMITTED' ? (
                                        <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                            <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                                Pending Review
                                            </div>
                                            <button onClick={() => loadEvidence(m.id)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                                View Evidence
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Awaiting Proof</div>
                                    )}
                                </div>
                            </div>
                            {evidenceData[m.id] && m.status === 'COMPLIANCE_SUBMITTED' && (
                                <div style={{ background: '#f8fafc', padding: '16px 24px', margin: '-16px 0 16px 0', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ flex: 1, paddingRight: '24px' }}>
                                        <h4 style={{ fontSize: '13px', margin: '0 0 8px', color: '#475569', fontWeight: 700 }}>Submitted Utilization Proof:</h4>
                                        <ul style={{ fontSize: '13.5px', color: '#2563eb', margin: '0 0 12px', paddingLeft: '20px', lineHeight: '1.6' }}>
                                            {evidenceData[m.id].length > 0 ? evidenceData[m.id].map((ev, i) => (
                                                <li key={i}>
                                                    <span style={{ color: '#475569', fontWeight: 500, marginRight: '8px' }}>{ev.originalFileName}</span>
                                                    <span style={{ color: '#64748b', fontSize: '11px', marginRight: '12px' }}>({ev.evidenceType})</span>
                                                    <strong style={{ fontSize: '11px', color: ev.status==='VERIFIED'?'#10b981':ev.status==='REJECTED'?'#ef4444':'#f59e0b', marginRight: '8px' }}>[{ev.status}]</strong>
                                                </li>
                                            )) : <li>No files found</li>}
                                        </ul>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>Please review evidence in the Financial Document panel below first.</div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <input type="text" placeholder="Remarks" value={reviewRemarks[`m_${m.id}`]||''} onChange={e=>setReviewRemarks({...reviewRemarks, [`m_${m.id}`]: e.target.value})} style={{ padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                            <button onClick={() => handleVerify(m.id, true)} disabled={actioning} style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}>Approve Milestone</button>
                                            <button onClick={() => handleVerify(m.id, false)} disabled={actioning} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Reject Flow</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
            
            {plan && (
                <div style={{ marginTop: '40px', background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.5px' }}>
                        MODULE 3 — FINANCIAL DOCUMENT VERIFICATION
                    </h2>
                    
                    {/* STAGE 1: BANK PASSBOOK */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                            INITIAL BANKING DOCUMENTATION
                        </h3>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '32px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Bank Account</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Holder: {application.bankAccountHolderName || 'N/A'}</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Bank: {application.bankName || 'N/A'}</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>IFSC: {application.bankIfscCode || 'N/A'}</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Account Number: XXXX-XXXX-{application.bankAccountNumber ? application.bankAccountNumber.slice(-4) : 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Bank Passbook</div>
                                {documents && documents.filter(d => d.documentType === 'BANK_PASSBOOK').length > 0 ? (
                                    documents.filter(d => d.documentType === 'BANK_PASSBOOK').map(doc => (
                                        <div key={doc.id} style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <button onClick={() => handleViewPassbook(doc.id)} disabled={downloadingEvidenceId === doc.id} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                                    {downloadingEvidenceId === doc.id ? 'Loading...' : 'View Passbook'}
                                                </button>
                                                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '100px', background: doc.documentStatus === 'VERIFIED' ? '#dcfce7' : doc.documentStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: doc.documentStatus === 'VERIFIED' ? '#166534' : doc.documentStatus === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                                                    {doc.documentStatus}
                                                </span>
                                            </div>
                                            {doc.documentStatus !== 'VERIFIED' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                                                    <input type="text" placeholder="Remarks (Required for rejection)" value={reviewRemarks[`doc_${doc.id}`]||''} onChange={e=>setReviewRemarks({...reviewRemarks, [`doc_${doc.id}`]: e.target.value})} style={{ padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleVerifyPassbook(applicationId, doc.id, 'VERIFIED')} disabled={actioning} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>VERIFY</button>
                                                        <button onClick={() => handleVerifyPassbook(applicationId, doc.id, 'REJECTED')} disabled={actioning} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>REJECT</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Pending beneficiary upload.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* STAGE 2: UTILIZATION PROOFS */}
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                            UTILIZATION PROOF EVIDENCE
                        </h3>
                        {plan.milestones.filter(m => m.complianceType === 'UTILIZATION_PROOF').map(m => (
                            <div key={`evidence_review_${m.id}`} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Milestone: {m.name}</div>
                                {(!evidenceData[m.id] || evidenceData[m.id].length === 0) ? (
                                     <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No utilization evidence uploaded yet (or click "View Evidence" on the milestone above).</div>
                                ) : (
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                         {evidenceData[m.id].map(ev => (
                                             <div key={ev.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,2fr)', gap: '16px', padding: '12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.originalFileName}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Type: {ev.evidenceType}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button onClick={() => handleViewEvidence(ev.id)} disabled={downloadingEvidenceId === ev.id} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>VIEW</button>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '100px', background: ev.status === 'VERIFIED' ? '#dcfce7' : ev.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: ev.status === 'VERIFIED' ? '#166534' : ev.status === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                {ev.status !== 'VERIFIED' && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input type="text" placeholder="Remarks (Required for Non-Compliant)" value={reviewRemarks[`ev_${ev.id}`]||''} onChange={e=>setReviewRemarks({...reviewRemarks, [`ev_${ev.id}`]: e.target.value})} style={{ flex: 1, padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                        <button onClick={() => handleVerifyEvidence(m.id, ev.id, 'VERIFIED')} disabled={actioning} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>APPROVE</button>
                                                        <button onClick={() => handleVerifyEvidence(m.id, ev.id, 'NON_COMPLIANT')} disabled={actioning} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>NON-COMPLIANT</button>
                                                    </div>
                                                )}
                                             </div>
                                         ))}
                                     </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
