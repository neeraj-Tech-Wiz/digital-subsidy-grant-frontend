import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink, useParams } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { applicationService } from '../../services/applicationService';
import { schemeService } from '../../services/schemeService';
import { formatIndianCurrency } from '../../utils/currencyFormatting';

const STATUS_CONFIG = {
    DOCUMENTS_PENDING: { label: 'Documents Pending', cls: 'badge-yellow' },
    PENDING_VERIFICATION: { label: 'Pending Verification', cls: 'badge-purple' },
    UNDER_VERIFICATION: { label: 'Under Verification', cls: 'badge-blue' },
    ELIGIBLE: { label: 'Eligible', cls: 'badge-green' },
    NOT_ELIGIBLE: { label: 'Not Eligible', cls: 'badge-red' },
    APPROVED: { label: 'Approved', cls: 'badge-emerald' },
    REJECTED: { label: 'Rejected', cls: 'badge-red' },
    ESCALATED: { label: 'Escalated', cls: 'badge-orange' },
    RETURNED_TO_APPLICANT: { label: 'Action Required', cls: 'badge-orange' },
    GRANT_DISBURSED: { label: 'Grant Disbursed', cls: 'badge-emerald' }
};

const ApplicationDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { applicationId } = useParams();
    const [application, setApplication] = useState(location.state?.application || null);
    const [initializing, setInitializing] = useState(!application && !!applicationId);
    const [documents, setDocuments] = useState([]);
    const [schemeDocs, setSchemeDocs] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [eligibilityData, setEligibilityData] = useState({});
    const [history, setHistory] = useState([]);
    const [grantData, setGrantData] = useState(null);
    
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        if (!application && applicationId) {
            applicationService.getMyApplications()
                .then(apps => {
                    const found = apps.find(a => a.id.toString() === applicationId.toString());
                    if (found) setApplication(found);
                })
                .catch(err => console.error("Failed to fetch apps frontend bypass", err))
                .finally(() => setInitializing(false));
        }
    }, [application, applicationId]);

    useEffect(() => {
        if (!application) return;
        setLoadingDocs(true);
        Promise.all([
            documentService.getApplicationDocuments(application.id),
            application.schemeId ? schemeService.getSchemeDocuments(application.schemeId) : Promise.resolve([]),
            application.schemeId ? schemeService.getSchemeCriteria(application.schemeId, true) : Promise.resolve([]),
            applicationService.getApplicationAnswers(application.id).catch(() => ({})),
            applicationService.getApplicationHistory(application.id).catch(() => ([])),
            application.status === 'GRANT_DISBURSED' ? applicationService.getApplicationGrant(application.id).catch(() => null) : Promise.resolve(null)
        ])
        .then(([appDocs, reqDocs, critData, answers, histData, grant]) => {
            setDocuments(appDocs || []);
            setSchemeDocs(reqDocs || []);
            setCriteria(critData || []);
            setEligibilityData(answers || {});
            setHistory(histData || []);
            setGrantData(grant);
        })
        .catch(() => {})
        .finally(() => setLoadingDocs(false));
    }, [application]);

    const renderTimeline = () => {
        const timeline = [];
        
        const formatDate = (ds) => {
            if (!ds) return '';
            const d = new Date(ds);
            return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
        };

        timeline.push({
            title: 'Application Submitted',
            description: 'Application successfully submitted',
            timestamp: formatDate(application.applicationDate),
            state: 'COMPLETED'
        });

        history.forEach((h, idx) => {
            const time = formatDate(h.actionTimestamp);
            if (h.action === 'APPLICATION_REVIEWED' || h.action === 'FORWARDED') {
                if (h.verificationLevel === 'LEVEL_1') {
                    timeline.push({ title: 'Level 1 Verification', description: 'Documents verified by officer.', timestamp: time, state: 'COMPLETED' });
                }
            } else if (h.action === 'ELIGIBILITY_VERIFIED') {
                timeline.push({ title: 'Level 2 Eligibility Verification', description: 'Eligibility verified.', timestamp: time, state: 'COMPLETED' });
            } else if (h.action === 'RETURNED_TO_APPLICANT') {
                const isCurrentlyReturned = application.status === 'RETURNED_TO_APPLICANT' && idx === history.length - 1;
                timeline.push({
                    title: 'Returned to Applicant',
                    description: 'Additional information or documents are required from you.',
                    remarks: h.remarks,
                    timestamp: time,
                    state: 'WARNING',
                    actionRequired: isCurrentlyReturned
                });
                if (!isCurrentlyReturned) {
                    timeline.push({ title: 'Application Resubmitted', description: 'You have updated and resubmitted your application.', timestamp: '', state: 'COMPLETED' });
                }
            } else if (h.action === 'FINAL_APPROVED') {
                timeline.push({ 
                    title: 'APPROVED', 
                    description: 'Your application has been successfully approved.', 
                    timestamp: time, 
                    state: application.status === 'GRANT_DISBURSED' ? 'COMPLETED' : 'APPROVED' 
                });
            } else if (h.action === 'REJECTED') {
                timeline.push({ title: 'Application Rejected', description: 'Your application was unfortunately rejected.', remarks: h.remarks, timestamp: time, state: 'REJECTED' });
            } else if (h.action === 'ESCALATION_REVIEWED') {
                timeline.push({ title: 'Level 3 Escalation', description: 'Escalation review completed.', timestamp: time, state: 'COMPLETED' });
            }
        });

        if (application.status === 'DOCUMENTS_PENDING') {
            timeline.push({ title: 'Action Required', description: 'Upload all mandatory documents to officially submit.', state: 'CURRENT' });
        } else if (application.status === 'PENDING_VERIFICATION') {
            if (application.currentVerificationLevel === 'LEVEL_1') {
                timeline.push({ title: 'Level 1 Verification', description: 'Documents are being verified by the verification officer.', state: 'CURRENT' });
                if (application.verificationRoute === 'STANDARD') timeline.push({ title: 'Level 2 Verification', state: 'PENDING' });
                timeline.push({ title: 'Final Approval', state: 'PENDING' });
            } else if (application.currentVerificationLevel === 'LEVEL_2') {
                timeline.push({ title: 'Level 2 Eligibility Verification', description: 'Eligibility is being independently reviewed.', state: 'CURRENT' });
                timeline.push({ title: 'Final Approval', state: 'PENDING' });
            } else if (application.currentVerificationLevel === 'LEVEL_3') {
                timeline.push({ title: 'Level 3 Escalation', description: 'Application is being reviewed at Level 3.', state: 'CURRENT' });
                timeline.push({ title: 'Final Approval', state: 'PENDING' });
            } else if (application.currentVerificationLevel === 'FINAL_APPROVAL') {
                timeline.push({ title: 'Final Approval', description: 'Application is awaiting final supervisory approval.', state: 'CURRENT' });
            }
        } else if (application.status === 'APPROVED') {
            timeline.push({ title: 'Fund Disbursement', description: 'Your application is queued to the Finance department for fund disbursement.', state: 'CURRENT' });
        } else if (application.status === 'GRANT_DISBURSED') {
            timeline.push({ title: 'GRANT DISBURSED', description: 'Grant funds have been successfully transferred to your verified account via the Finance Node.', state: 'APPROVED', timestamp: grantData ? formatDate(grantData.disbursedAt) : '' });
        }
        
        if (application.status === 'REJECTED' && application.cooldownExpiresAt) {
            const reapplyDate = new Date(application.cooldownExpiresAt); 
            const isActive = application.cooldownActive;
            
            if (isActive) {
                timeline.push({ 
                    title: 'Cooldown Active', 
                    description: `You are in a mandatory cooling-off period until ${reapplyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`, 
                    state: 'CURRENT',
                    iconOverride: '🔒'
                });
                timeline.push({ 
                    title: 'Reapply Available', 
                    state: 'PENDING' 
                });
            } else {
                timeline.push({ 
                    title: 'Cooldown Expired', 
                    description: 'The mandatory cooling-off period has passed.', 
                    timestamp: reapplyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    state: 'COMPLETED' 
                });
                timeline.push({ 
                    title: 'Reapply Available', 
                    description: 'You may now submit a new application for this scheme.',
                    state: 'APPROVED'
                });
            }
        }

        return (
            <div className="portal-card" style={{ marginBottom: '20px' }}>
                <div className="portal-card-header">
                    <h2 style={{ fontSize: '15px' }}>APPLICATION STATUS</h2>
                </div>
                <div style={{ padding: '24px 28px' }}>
                    <div className="timeline-container" style={{ position: 'relative', paddingLeft: '24px' }}>
                        {/* Vertical line connecting nodes */}
                        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '20px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                        
                        {timeline.map((node, i) => {
                            let iconColor = '#cbd5e1'; // PENDING
                            let borderColor = '#e2e8f0';
                            let icon = '';
                            let titleColor = '#94a3b8'; // default pending text
                            
                            if (node.state === 'COMPLETED' || node.state === 'APPROVED') {
                                iconColor = '#10b981'; borderColor = '#10b981'; titleColor = '#0f172a';
                                icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
                            } else if (node.state === 'CURRENT') {
                                iconColor = '#1a56db'; borderColor = '#bfdbfe'; titleColor = '#1a56db';
                                icon = <div style={{width:'8px', height:'8px', background:'#fff', borderRadius:'50%'}}></div>;
                            } else if (node.state === 'WARNING') {
                                iconColor = '#f59e0b'; borderColor = '#fde68a'; titleColor = '#b45309';
                                icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
                            } else if (node.state === 'REJECTED') {
                                iconColor = '#ef4444'; borderColor = '#fecaca'; titleColor = '#991b1b';
                                icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
                            }
                            
                            if (node.iconOverride) {
                                icon = <span style={{fontSize: '10px'}}>{node.iconOverride}</span>;
                            }
                            
                            return (
                                <div key={i} style={{ display: 'flex', marginBottom: i === timeline.length - 1 ? '0' : '28px', position: 'relative', zIndex: 1 }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: iconColor, border: `3px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '-11px', marginTop: '3px' }}>
                                        {icon}
                                    </div>
                                    <div style={{ marginLeft: '16px', flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: titleColor }}>{node.title}</h4>
                                        {node.description && <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: node.state==='CURRENT' ? '#334155' : '#64748b' }}>{node.description}</p>}
                                        {node.remarks && <div style={{ marginTop: '8px', padding: '10px 14px', background: node.state==='WARNING'?'#fffbeb':'#fef2f2', border: `1px solid ${node.state==='WARNING'?'#fde68a':'#fecaca'}`, borderRadius: '6px', fontSize: '13px', color: '#475569' }}><strong>Officer remarks:</strong> {node.remarks}</div>}
                                        {node.timestamp && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{node.timestamp}</p>}
                                        {node.actionRequired && <div style={{ marginTop: '12px' }}><span style={{ display: 'inline-block', background: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>Action Required</span></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (initializing) {
        return (
            <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#1a56db', width: '32px', height: '32px', display: 'inline-block' }}></div>
                <h3 style={{ marginTop: '16px', color: '#64748b' }}>Reconstructing application context...</h3>
            </div>
        );
    }

    if (!application) {
        return (
            <div>
                <div className="portal-page-header"><h1>Application Details</h1></div>
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <h3>Application Context Lost</h3>
                    <p>
                        Application details could not be found or you do not have permission to view it.
                        Your data is securely saved in the database.
                    </p>
                    <NavLink to="/beneficiary/schemes" className="btn btn-primary">Browse Available Schemes</NavLink>
                </div>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[application.status] || { label: application.status, cls: 'badge-gray' };

    const handleUpload = async (e, docType) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(docType);
        try {
            await documentService.uploadDocument(application.id, docType, file);
            const docs = await documentService.getApplicationDocuments(application.id);
            setDocuments(docs || []);
        } catch (err) {
            alert(`Upload failed for ${docType}. Please try again.`);
        } finally {
            setUploading(null);
        }
    };

    const handleInput = (field, value) => {
        setEligibilityData(p => ({ ...p, [field]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitMsg(null);
        try {
            let updated;
            if (application.status === 'RETURNED_TO_APPLICANT') {
                updated = await applicationService.resubmitApplication(application.id, eligibilityData);
            } else {
                updated = await applicationService.submitDocuments(application.id);
            }
            setApplication(updated);
            setSubmitSuccess(true);
            setSubmitMsg('Application submitted successfully! Your application is now queued for Level 1 Officer Verification.');
        } catch (err) {
            setSubmitSuccess(false);
            setSubmitMsg(err.response?.data?.message || 'All mandatory documents must be uploaded before submission.');
        } finally {
            setSubmitting(false);
        }
    };

    const getDoc = (docType) => documents.find(d => d.documentType === docType);
    const mandatoryDocs = schemeDocs.filter(d => d.mandatory);
    const optionalDocs = schemeDocs.filter(d => !d.mandatory);
    const allMandatoryUploaded = mandatoryDocs.every(t => getDoc(t.documentType));
    
    // Only strictly allow conditionally if documents pending or action required
    const canUpload = application.status === 'DOCUMENTS_PENDING' || application.status === 'RETURNED_TO_APPLICANT';

    // If RETURNED_TO_APPLICANT, is the eligibility form filled out correctly so we can submit?
    // Actually HTML5 Validation runs when it's a <form>. But since it's just buttons on the page without form tags, we should let the backend reject empty answers or we check basic non-empty here.
    // For now we assume they fill it properly before clicking submit.

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#64748b' }}>
                <button onClick={() => navigate('/beneficiary/applications')} style={{ background: 'none', border: 'none', color: '#1a56db', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>My Applications</button>
                <span>›</span>
                <span>Application #{application.id}</span>
            </div>

            {/* Header Card */}
            <div className="portal-card" style={{ marginBottom: '20px' }}>
                <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Application ID</p>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>#{application.id}</h1>
                    </div>
                    <span className={`badge ${statusCfg.cls}`} style={{ fontSize: '13px', padding: '6px 14px' }}>{statusCfg.label}</span>
                </div>
                <div style={{ padding: '20px 28px', display: 'flex', gap: '0' }}>
                    {[
                        { label: 'Eligibility Score', value: `${application.eligibilityScore} / 100`, green: application.eligibilityScore >= 60 },
                        { label: 'Verification Route', value: application.verificationRoute || 'Pending Docs' },
                        { label: 'Verification Level', value: application.currentVerificationLevel || '—' },
                    ].map((item, i) => (
                        <div key={item.label} style={{ flex: 1, padding: '0 20px', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none', paddingLeft: i === 0 ? 0 : '20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: item.green !== undefined ? (item.green ? '#059669' : '#dc2626') : '#0f172a' }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {renderTimeline()}

            {/* Detailed Grant Payout Receipt */}
            {grantData && (
                <div className="portal-card" style={{ marginBottom: '20px', borderLeft: '4px solid #10b981' }}>
                    <div className="portal-card-header" style={{ paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#064e3b' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                OFFICIAL GRANT RECEIPT
                            </h2>
                        </div>
                    </div>
                    <div className="portal-card-body" style={{ background: '#f0fdf4', padding: '24px 28px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Amount Received</p>
                                <p style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', letterSpacing: '-0.5px' }}>{formatIndianCurrency(grantData.grantAmount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                <p style={{ display: 'inline-block', fontSize: '13px', fontWeight: '700', color: '#fff', background: '#10b981', padding: '4px 10px', borderRadius: '4px' }}>DISBURSED SUCCESSFULLY</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction Reference</p>
                                <p style={{ fontSize: '15px', fontFamily: 'monospace', color: '#064e3b', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{grantData.transactionReference}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Disbursed On</p>
                                <p style={{ fontSize: '15px', fontWeight: '600', color: '#064e3b' }}>{new Date(grantData.disbursedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Result */}
            {submitMsg && (
                <div className={`alert ${submitSuccess ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        {submitSuccess ? <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                    </svg>
                    {submitMsg}
                </div>
            )}

            {application.status === 'RETURNED_TO_APPLICANT' && criteria.length > 0 && (
                <div className="portal-card" style={{ marginBottom: '20px' }}>
                    <div className="portal-card-header">
                        <div>
                            <h2>Update Application Details</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Your application was returned. You can update your answers here before resubmitting.</p>
                        </div>
                    </div>
                    <div className="portal-card-body" style={{ background: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
                        <div className="portal-form-grid">
                            {criteria.map(c => (
                                <div key={c.id} className="portal-form-field">
                                    <label>
                                        {c.criterionName}
                                        {c.mandatory ? <span className="required">*</span> : <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OPTIONAL</span>}
                                    </label>
                                    {c.criterionType === 'BOOLEAN' ? (
                                        <select
                                            className="portal-input portal-select"
                                            value={eligibilityData[c.fieldName] || ''}
                                            onChange={e => handleInput(c.fieldName, e.target.value)}
                                            required={c.mandatory}
                                            style={{ background: '#fff' }}
                                        >
                                            <option value="" disabled>Select...</option>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={c.criterionType === 'NUMERIC' ? 'number' : 'text'}
                                            step={c.criterionType === 'NUMERIC' ? 'any' : undefined}
                                            className="portal-input"
                                            value={eligibilityData[c.fieldName] || ''}
                                            onChange={e => handleInput(c.fieldName, e.target.value)}
                                            required={c.mandatory}
                                            style={{ background: '#fff' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Document Upload */}
            <div className="portal-card">
                <div className="portal-card-header">
                    <div>
                        <h2>Required Documents</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            Upload mandatory and optional supporting documents. Accepted: PDF, JPG, PNG (max 5MB).
                        </p>
                    </div>
                </div>

                {loadingDocs ? (
                    <div className="loading-wrap"><div className="spinner" /><p className="loading-text">Loading documents...</p></div>
                ) : (
                    <div>
                        {/* MANDATORY DOCUMENTS */}
                        <div style={{ padding: '16px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                                Mandatory Documents ({mandatoryDocs.filter(d => getDoc(d.documentType)).length} / {mandatoryDocs.length})
                            </h3>
                        </div>
                        {mandatoryDocs.map(schemeDoc => {
                            const docType = schemeDoc.documentType;
                            const doc = getDoc(docType);
                            const isUploading = uploading === docType;
                            
                            return (
                                <div key={docType} className="doc-row">
                                    <div className="doc-info">
                                        <h4>{schemeDoc.documentName} <span className="required">*</span></h4>
                                        <p>Mandatory — PDF, JPG, PNG (Max 5MB)</p>
                                    </div>
                                    <div className="doc-actions">
                                        {doc ? (
                                            <span className="upload-success-badge">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                                Uploaded
                                            </span>
                                        ) : isUploading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a56db', fontWeight: '500' }}>
                                                <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                Uploading...
                                            </span>
                                        ) : (
                                            <>
                                                <input
                                                    type="file" id={`file-${docType}`} className="hidden"
                                                    accept=".pdf,.jpg,.jpeg,.png" disabled={!canUpload}
                                                    onChange={e => handleUpload(e, docType)} style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor={`file-${docType}`} className="upload-label"
                                                    style={!canUpload ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                    Choose File
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* OPTIONAL DOCUMENTS */}
                        {optionalDocs.length > 0 && (
                            <>
                                <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>Optional Supporting Documents</h3>
                                </div>
                                {optionalDocs.map(schemeDoc => {
                                    const docType = schemeDoc.documentType;
                                    const doc = getDoc(docType);
                                    const isUploading = uploading === docType;
                                    
                                    // Evaluate if the user selected YES for this criteria robustly
                                    const dName = schemeDoc.documentName.toLowerCase();
                                    const relatedCriterion = criteria.find(c => {
                                        const cName = c.criterionName.toLowerCase();
                                        const fName = c.fieldName.toLowerCase();
                                        return cName === dName || fName === dName || 
                                              (dName.includes('college') && cName.includes('college')) ||
                                              (dName.includes('bonafide') && cName.includes('bonafide'));
                                    });

                                    let userSelectedYes = false;
                                    const val = relatedCriterion ? eligibilityData[relatedCriterion.fieldName] : eligibilityData[schemeDoc.documentName];
                                    if (val && ['yes', 'true'].includes(String(val).toLowerCase().trim())) {
                                        userSelectedYes = true;
                                    }

                                    return (
                                        <div key={docType} className="doc-row">
                                            <div className="doc-info">
                                                <h4>
                                                    {schemeDoc.documentName} 
                                                    <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OPTIONAL</span>
                                                </h4>
                                                <p>Optional — Optional documents can add up to 20 points each to your eligibility score.</p>
                                            </div>
                                            <div className="doc-actions">
                                                {doc ? (
                                                    <span className="upload-success-badge">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                                        Uploaded ({schemeDoc.documentName} = YES)
                                                    </span>
                                                ) : isUploading ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a56db', fontWeight: '500' }}>
                                                        <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                        Uploading...
                                                    </span>
                                                ) : userSelectedYes ? (
                                                    <>
                                                        <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600', marginRight: '12px' }}>Selected but not uploaded</span>
                                                        <input
                                                            type="file" id={`file-${docType}`} className="hidden"
                                                            accept=".pdf,.jpg,.jpeg,.png" disabled={!canUpload}
                                                            onChange={e => handleUpload(e, docType)} style={{ display: 'none' }}
                                                        />
                                                        <label
                                                            htmlFor={`file-${docType}`} className="upload-label"
                                                            style={!canUpload ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                            Choose File
                                                        </label>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Optional — Not provided</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {(application.status === 'DOCUMENTS_PENDING' || application.status === 'RETURNED_TO_APPLICANT') && (
                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>
                                    {allMandatoryUploaded ? 'All mandatory documents uploaded. Ready to submit.' : `Upload all mandatory documents to proceed.`}
                                </p>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !allMandatoryUploaded}
                                    className={`btn btn-primary ${(!allMandatoryUploaded || submitting) ? 'btn-disabled' : ''}`}
                                    style={{ opacity: (!allMandatoryUploaded || submitting) ? 0.5 : 1, cursor: (!allMandatoryUploaded || submitting) ? 'not-allowed' : 'pointer' }}
                                >
                                    {submitting ? (
                                        <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                                    ) : '→ Submit for Verification'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationDetails;
