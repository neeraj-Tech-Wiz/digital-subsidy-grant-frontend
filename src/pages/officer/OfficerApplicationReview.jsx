import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verificationService } from '../../services/verificationService';

const STATUS_CONFIG = {
    DOCUMENTS_PENDING: { label: 'Documents Pending', color: '#eab308' },
    PENDING_VERIFICATION: { label: 'Pending Verification', color: '#a855f7' },
    UNDER_VERIFICATION: { label: 'Under Verification', color: '#3b82f6' },
    ELIGIBLE: { label: 'Eligible', color: '#22c55e' },
    NOT_ELIGIBLE: { label: 'Not Eligible', color: '#ef4444' },
    APPROVED: { label: 'Approved', color: '#10b981' },
    REJECTED: { label: 'Rejected', color: '#ef4444' },
    ESCALATED: { label: 'Escalated', color: '#f97316' },
};

const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function OfficerApplicationReview() {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        verificationService.getApplicationDetails(applicationId)
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(err => {
                const status = err.response?.status;
                if (status === 403) setError("You are not authorized to verify this application at its current level.");
                else if (status === 404) setError("Application not found.");
                else if (status === 409) setError("Application has already been processed or is no longer assigned to you.");
                else setError("An error occurred while fetching application details.");
                setLoading(false);
            });
    }, [applicationId]);

    const handleAction = async (approved) => {
        if (!remarks.trim()) {
            alert('Please provide remarks before submitting your decision.');
            return;
        }

        setSubmitting(true);
        try {
            await verificationService.verifyApplication(applicationId, approved, remarks);
            setSuccessMessage(approved ? 'Application verified successfully.' : 'Application rejected successfully.');
            setTimeout(() => {
                navigate('/officer/dashboard');
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Verification action failed.');
            setSubmitting(false);
        }
    };

    const handleDocumentAction = async (documentId, fileName, action) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/documents/${documentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch document");
            }

            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            const blob = await response.blob();
            const typedBlob = new Blob([blob], { type: contentType });
            const url = window.URL.createObjectURL(typedBlob);
            
            if (action === 'view') {
                window.open(url, '_blank');
                setTimeout(() => window.URL.revokeObjectURL(url), 10000);
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName || `document_${documentId}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            alert('Error accessing document: ' + err.message);
        }
    };

    const handleVerifyDocument = async (documentId, action) => {
        let remarksStr = "";
        if (action === 'REJECTED') {
            remarksStr = window.prompt("Enter rejection reason (Required):");
            if (!remarksStr || remarksStr.trim() === '') return;
        } else {
            remarksStr = window.prompt("Enter remarks (Optional):", "Document verified successfully");
            if (remarksStr === null) return;
        }

        setSubmitting(true);
        try {
            await verificationService.verifyDocument(applicationId, documentId, action, remarksStr);
            const updatedDetails = await verificationService.getApplicationDetails(applicationId);
            setDetails(updatedDetails);
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={styles.centerContainer}>Loading Application Details...</div>;
    if (error) return (
        <div style={styles.centerContainer}>
            <div style={styles.errorBox}>{error}</div>
            <button onClick={() => navigate('/officer/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
        </div>
    );
    if (!details) return null;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <button onClick={() => navigate('/officer/dashboard')} style={styles.backBtnHeader}>← Back</button>
                    <h1 style={styles.pageTitle}>
                        Review Application <span style={styles.appIdBadge}>APP-{String(details.applicationId).padStart(5, '0')}</span>
                    </h1>
                </div>
            </div>

            {successMessage && (
                <div style={styles.successAlert}>
                    {successMessage} Redirecting...
                </div>
            )}

            <div style={styles.grid}>
                {/* Application Summary & Scheme */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Application & Scheme Summary</h2>
                    <div style={styles.dataGrid}>
                        <DataRow label="Scheme Name" value={details.schemeName} />
                        <DataRow label="Scheme Code" value={details.schemeCode} />
                        <DataRow label="Current Status" value={
                            <span style={{...styles.statusBadge, color: STATUS_CONFIG[details.status]?.color, backgroundColor: STATUS_CONFIG[details.status]?.color + '15'}}>
                                {STATUS_CONFIG[details.status]?.label || details.status}
                            </span>
                        } />
                        <DataRow label="Verification Route" value={details.verificationRoute} />
                        <DataRow label="Current Level" value={details.currentVerificationLevel} />
                        <DataRow label="Eligibility Score" value={details.eligibilityScore} bold />
                        <DataRow label="Application Date" value={formatDate(details.applicationDate)} />
                        {details.verificationDueDate && <DataRow label="Verification Deadline" value={formatDate(details.verificationDueDate)} highlight />}
                    </div>
                </div>

                {/* Beneficiary Details */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Beneficiary Details</h2>
                    <div style={styles.dataGrid}>
                        <DataRow label="Name" value={details.beneficiaryName} bold />
                        <DataRow label="Father's Name" value={details.fatherName} />
                        <DataRow label="Age / Gender" value={`${details.age} yrs / ${details.gender}`} />
                        <DataRow label="Mobile" value={details.mobileNumber} />
                        <DataRow label="Email" value={details.email} />
                        <DataRow label="Address" value={details.address} />
                        <DataRow label="Aadhaar ID" value={<span style={styles.secureText}>{details.maskedAadhaar}</span>} />
                    </div>
                </div>
            </div>

            {/* Documents */}
            <div style={styles.cardFull}>
                <h2 style={styles.cardTitle}>Submitted Documents</h2>
                {details.documents && details.documents.length > 0 ? (
                    <div style={styles.docList}>
                        {details.documents.map(doc => (
                            <div key={doc.documentId} style={{ ...styles.docItem, borderLeft: doc.documentStatus === 'VERIFIED' ? '4px solid #10b981' : doc.documentStatus === 'REJECTED' ? '4px solid #ef4444' : '4px solid #eab308' }}>
                                <div>
                                    <h4 style={styles.docType}>
                                        {doc.documentType} 
                                        <span style={{
                                            ...styles.docStatusBadge,
                                            background: doc.documentStatus === 'VERIFIED' ? '#d1fae5' : doc.documentStatus === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                                            color: doc.documentStatus === 'VERIFIED' ? '#047857' : doc.documentStatus === 'REJECTED' ? '#b91c1c' : '#a16207'
                                        }}>
                                            {doc.documentStatus}
                                        </span>
                                    </h4>
                                    <p style={styles.docName}>{doc.originalFileName}</p>
                                    {doc.documentStatus === 'REJECTED' && doc.remarks && (
                                        <p style={styles.docRemarks}>Reason: {doc.remarks}</p>
                                    )}
                                </div>
                                <div style={styles.docActionsContainer}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleDocumentAction(doc.documentId, doc.originalFileName, 'view')} style={styles.viewBtn}>View</button>
                                        <button onClick={() => handleDocumentAction(doc.documentId, doc.originalFileName, 'download')} style={styles.downloadBtn}>Download</button>
                                    </div>
                                    {doc.documentStatus === 'UPLOADED' && (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleVerifyDocument(doc.documentId, 'VERIFIED')} 
                                                disabled={submitting}
                                                style={styles.verifyBtn}>✓ Verify Document</button>
                                            <button 
                                                onClick={() => handleVerifyDocument(doc.documentId, 'REJECTED')} 
                                                disabled={submitting}
                                                style={styles.rejectDocBtn}>✗ Reject</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={styles.emptyText}>No documents found for this application.</p>
                )}
            </div>

            {/* Officer Action Panel */}
            <div style={styles.actionPanel}>
                <h2 style={styles.cardTitle}>Officer Decision</h2>
                <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Verification Remarks (Required)</label>
                    <textarea 
                        style={styles.textarea} 
                        rows="4" 
                        placeholder="Enter justification for approval or rejection..."
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        disabled={submitting || successMessage}
                    />
                </div>
                <div style={styles.btnGroup}>
                    <button 
                        style={styles.rejectBtn} 
                        onClick={() => handleAction(false)}
                        disabled={submitting || successMessage}
                    >
                        ❌ Reject Application
                    </button>
                    <button 
                        style={styles.approveBtn} 
                        onClick={() => handleAction(true)}
                        disabled={submitting || successMessage}
                    >
                        ✅ Approve & Verify
                    </button>
                </div>
            </div>
        </div>
    );
}

const DataRow = ({ label, value, bold, highlight }) => (
    <div style={styles.dataRow}>
        <span style={styles.dataLabel}>{label}</span>
        <span style={{
            ...styles.dataValue, 
            fontWeight: bold ? 700 : 500,
            color: highlight ? '#ea580c' : '#0f172a'
        }}>{value || 'N/A'}</span>
    </div>
);

const styles = {
    page: { padding: '0 24px 60px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: {
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '32px 40px',
        color: 'white',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    pageTitle: { fontSize: '26px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '16px' },
    appIdBadge: { fontSize: '14px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', letterSpacing: '0.5px' },
    backBtnHeader: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', marginBottom: '8px', padding: 0 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' },
    card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
    cardFull: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginBottom: '24px' },
    cardTitle: { fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' },
    dataGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    dataRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' },
    dataLabel: { fontSize: '13px', color: '#64748b', fontWeight: 500 },
    dataValue: { fontSize: '14px', textAlign: 'right' },
    secureText: { fontFamily: 'monospace', letterSpacing: '2px', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' },
    statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 },
    docList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    docItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
    docType: { display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' },
    docName: { fontSize: '13px', color: '#64748b', margin: 0 },
    docStatusBadge: { marginLeft: '12px', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
    docRemarks: { fontSize: '12px', color: '#b91c1c', margin: '6px 0 0 0', fontStyle: 'italic' },
    docActionsContainer: { display: 'flex', flexDirection: 'column' },
    viewBtn: { background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    downloadBtn: { background: 'white', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' },
    verifyBtn: { background: '#10b981', color: 'white', border: '1px solid #059669', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    rejectDocBtn: { background: '#ef4444', color: 'white', border: '1px solid #dc2626', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    actionPanel: { background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #cbd5e1' },
    label: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' },
    textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' },
    btnGroup: { display: 'flex', justifyContent: 'flex-end', gap: '16px' },
    rejectBtn: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    approveBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' },
    centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' },
    errorBox: { padding: '24px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '12px', fontWeight: 600, maxWidth: '400px', textAlign: 'center' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    emptyText: { color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' },
    successAlert: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, textAlign: 'center' }
};

export default OfficerApplicationReview;
