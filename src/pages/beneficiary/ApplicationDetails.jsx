import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { applicationService } from '../../services/applicationService';

const STATUS_CONFIG = {
    DOCUMENTS_PENDING: { label: 'Documents Pending', cls: 'badge-yellow' },
    PENDING_VERIFICATION: { label: 'Pending Verification', cls: 'badge-purple' },
    UNDER_VERIFICATION: { label: 'Under Verification', cls: 'badge-blue' },
    ELIGIBLE: { label: 'Eligible', cls: 'badge-green' },
    NOT_ELIGIBLE: { label: 'Not Eligible', cls: 'badge-red' },
    APPROVED: { label: 'Approved', cls: 'badge-emerald' },
    REJECTED: { label: 'Rejected', cls: 'badge-red' },
    ESCALATED: { label: 'Escalated', cls: 'badge-orange' },
};

const requiredDocs = ['AADHAAR_CARD', 'INCOME_CERTIFICATE', 'MARKSHEET'];

const ApplicationDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [application, setApplication] = useState(location.state?.application || null);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        if (!application) return;
        setLoadingDocs(true);
        documentService.getApplicationDocuments(application.id)
            .then(d => setDocuments(d || []))
            .catch(() => {})
            .finally(() => setLoadingDocs(false));
    }, [application]);

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
                        Application details are not available after page refresh because the backend 
                        does not yet expose a GET application by ID endpoint. Your data is securely 
                        saved in the database.
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

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitMsg(null);
        try {
            const updated = await applicationService.submitDocuments(application.id);
            setApplication(updated);
            setSubmitSuccess(true);
            setSubmitMsg('Documents submitted successfully! Your application is now queued for Level 1 Officer Verification.');
        } catch (err) {
            setSubmitSuccess(false);
            setSubmitMsg(err.response?.data?.message || 'All mandatory documents must be uploaded before submission.');
        } finally {
            setSubmitting(false);
        }
    };

    const getDoc = (docType) => documents.find(d => d.documentType === docType);
    const allUploaded = requiredDocs.every(t => getDoc(t));

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#64748b' }}>
                <button onClick={() => navigate('/beneficiary/schemes')} style={{ background: 'none', border: 'none', color: '#1a56db', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Schemes</button>
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

            {/* Submit Result */}
            {submitMsg && (
                <div className={`alert ${submitSuccess ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        {submitSuccess ? <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                    </svg>
                    {submitMsg}
                </div>
            )}

            {/* Document Upload */}
            <div className="portal-card">
                <div className="portal-card-header">
                    <div>
                        <h2>Required Documents</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            Upload all mandatory supporting documents. Accepted: PDF, JPG, PNG (max 5MB).
                        </p>
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                        {documents.length} / {requiredDocs.length} uploaded
                    </span>
                </div>

                {loadingDocs ? (
                    <div className="loading-wrap"><div className="spinner" /><p className="loading-text">Loading documents...</p></div>
                ) : (
                    <div>
                        {requiredDocs.map(docType => {
                            const doc = getDoc(docType);
                            const isUploading = uploading === docType;
                            const canUpload = application.status === 'DOCUMENTS_PENDING';
                            return (
                                <div key={docType} className="doc-row">
                                    <div className="doc-info">
                                        <h4>{docType.replace(/_/g, ' ')}</h4>
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
                                                    type="file"
                                                    id={`file-${docType}`}
                                                    className="hidden"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    disabled={!canUpload}
                                                    onChange={e => handleUpload(e, docType)}
                                                    style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor={`file-${docType}`}
                                                    className="upload-label"
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

                        {application.status === 'DOCUMENTS_PENDING' && (
                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>
                                    {allUploaded ? 'All documents uploaded. Ready to submit.' : `Upload all ${requiredDocs.length} documents to proceed.`}
                                </p>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !allUploaded}
                                    className={`btn btn-primary ${(!allUploaded || submitting) ? 'btn-disabled' : ''}`}
                                    style={{ opacity: (!allUploaded || submitting) ? 0.5 : 1, cursor: (!allUploaded || submitting) ? 'not-allowed' : 'pointer' }}
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
