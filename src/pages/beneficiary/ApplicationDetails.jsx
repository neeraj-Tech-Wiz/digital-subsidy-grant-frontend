import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink, useParams } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { applicationService } from '../../services/applicationService';
import { schemeService } from '../../services/schemeService';
import { formatIndianCurrency } from '../../utils/currencyFormatting';
import grantService from '../../services/grantService';
import { beneficiaryService } from '../../services/beneficiaryService';

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
    GRANT_DISBURSED: { label: 'Grant Disbursed', cls: 'badge-emerald' },
    PLAN_CONFIGURED: { label: 'Plan Configured', cls: 'badge-blue' },
    MILESTONE_PENDING: { label: 'Milestone Pending', cls: 'badge-purple' },
    PARTIALLY_DISBURSED: { label: 'Partially Disbursed', cls: 'badge-blue' },
    MILESTONE_OVERDUE: { label: 'Milestone Overdue', cls: 'badge-orange' },
    NON_COMPLIANT: { label: 'Non Compliant', cls: 'badge-red' },
    FULLY_DISBURSED: { label: 'Fully Disbursed', cls: 'badge-emerald' }
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
    const [disbursementPlan, setDisbursementPlan] = useState(null);
    
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadingMilestone, setUploadingMilestone] = useState(null);
    const [receiptModal, setReceiptModal] = useState(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [bankingDetails, setBankingDetails] = useState({
        bankAccountHolderName: '',
        bankName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        bankAccountType: 'SAVINGS'
    });
    const [savingBanking, setSavingBanking] = useState(false);

    const viewReceipt = async (milestoneId) => {
        setLoadingReceipt(true);
        try {
            const res = await grantService.getMilestoneReceipt(milestoneId);
            setReceiptModal(res.data);
        } catch (err) {
            alert('Could not fetch receipt details. It might not be available yet.');
        } finally {
            setLoadingReceipt(false);
        }
    };

    const handleMilestoneFilesChange = (e, milestoneId) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(f => ({
            file: f,
            type: 'INVOICE'
        }));
        setUploadingMilestone(prev => {
            if (prev?.id === milestoneId) {
                return { id: milestoneId, staging: [...(prev.staging || []), ...newFiles] };
            }
            return { id: milestoneId, staging: newFiles };
        });
        e.target.value = null; // reset input
    };

    const removeMilestoneFile = (index) => {
        setUploadingMilestone(prev => ({
            ...prev,
            staging: prev.staging.filter((_, i) => i !== index)
        }));
    };

    const updateMilestoneFileType = (index, type) => {
        setUploadingMilestone(prev => {
            const newStaging = [...prev.staging];
            newStaging[index].type = type;
            return { ...prev, staging: newStaging };
        });
    };

    const submitMilestoneEvidence = async (milestoneId) => {
        if (!uploadingMilestone || !uploadingMilestone.staging || uploadingMilestone.staging.length === 0) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            uploadingMilestone.staging.forEach(f => {
                formData.append('files', f.file);
                formData.append('evidenceTypes', f.type);
            });
            await grantService.uploadComplianceEvidenceFiles(milestoneId, formData);
            alert('Evidences uploaded successfully!');
            setUploadingMilestone(null);
            
            // refresh plan
            const p = await grantService.getDisbursementPlan(application.id);
            setDisbursementPlan(p.data);
        } catch (err) {
            alert('Upload failed.');
        } finally {
            setSubmitting(false);
        }
    };

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
            ['APPROVED', 'PLAN_CONFIGURED', 'MILESTONE_PENDING', 'PARTIALLY_DISBURSED', 'MILESTONE_OVERDUE', 'NON_COMPLIANT', 'FULLY_DISBURSED', 'GRANT_DISBURSED'].includes(application.status) ? applicationService.getFinancialSummary(application.id).catch(() => null) : Promise.resolve(null),
            ['PLAN_CONFIGURED', 'MILESTONE_PENDING', 'PARTIALLY_DISBURSED', 'MILESTONE_OVERDUE', 'NON_COMPLIANT', 'FULLY_DISBURSED'].includes(application.status) 
                ? grantService.getDisbursementPlan(application.id).then(r => r.data).catch(() => null) 
                : Promise.resolve(null),
            beneficiaryService.getMyProfile().catch(() => null)
        ])
        .then(([appDocs, reqDocs, critData, answers, histData, grant, plan, profile]) => {
            setDocuments(appDocs || []);
            setSchemeDocs(reqDocs || []);
            setCriteria(critData || []);
            setEligibilityData(answers || {});
            setHistory(histData || []);
            setGrantData(grant);
            setDisbursementPlan(plan);
            if (profile) {
                setBankingDetails({
                    bankAccountHolderName: profile.bankAccountHolderName || '',
                    bankName: profile.bankName || '',
                    bankAccountNumber: profile.bankAccountNumberMasked || profile.bankAccountNumber || '',
                    bankIfscCode: profile.bankIfscCode || '',
                    bankAccountType: profile.bankAccountType || 'SAVINGS'
                });
            }
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
        } else if (['PLAN_CONFIGURED', 'MILESTONE_PENDING', 'PARTIALLY_DISBURSED'].includes(application.status)) {
            const blockedMilestone = disbursementPlan?.milestones?.find(m => m.status === 'NON_COMPLIANT');
            if (blockedMilestone) {
                timeline.push({ 
                    title: 'Compliance Issue', 
                    description: 'A scheduled milestone is non-compliant and requires your action.', 
                    state: 'WARNING',
                    actionRequired: true,
                    remarks: blockedMilestone.remarks || 'Please upload corrected evidence.'
                });
            } else {
                timeline.push({ title: 'Staged Disbursement Ongoing', description: 'Your grant funds are being released via milestone-based planned schedule.', state: 'CURRENT' });
            }
        } else if (application.status === 'MILESTONE_OVERDUE' || application.status === 'NON_COMPLIANT') {
            timeline.push({ title: 'Compliance Issue', description: 'A scheduled milestone is overdue or non-compliant.', state: 'WARNING' });
        } else if (application.status === 'FULLY_DISBURSED') {
            timeline.push({ title: 'FULLY DISBURSED', description: 'All scheduled milestones have been successfully disbursed.', state: 'APPROVED' });
        } else if (application.status === 'GRANT_DISBURSED') {
            timeline.push({ title: 'GRANT DISBURSED', description: 'Grant funds have been successfully transferred to your verified account via the Finance Node.', state: 'APPROVED' });
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

    const handleSaveBanking = async () => {
        setSavingBanking(true);
        try {
            await beneficiaryService.updateBankingDetails(bankingDetails);
            alert('Banking details saved successfully.');
            // Update masked view properly
            const p = await beneficiaryService.getMyProfile();
            setBankingDetails(prev => ({ ...prev, bankAccountNumber: p.bankAccountNumberMasked || p.bankAccountNumber }));
        } catch (err) {
            alert('Failed to save banking details. ensure all fields are correct.');
        } finally {
            setSavingBanking(false);
        }
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

    const nonCompliantMilestone = disbursementPlan?.milestones?.find(m => m.status === 'NON_COMPLIANT');

    // If RETURNED_TO_APPLICANT, is the eligibility form filled out correctly so we can submit?
    // Actually HTML5 Validation runs when it's a <form>. But since it's just buttons on the page without form tags, we should let the backend reject empty answers or we check basic non-empty here.
    // For now we assume they fill it properly before clicking submit.

    return (
        <div style={{ maxWidth: '900px' }}>
            {nonCompliantMilestone && (
                <div style={{ marginBottom: '20px', padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🔴 ACTION REQUIRED
                    </h3>
                    <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#7f1d1d' }}>
                        Your utilization proof requires correction. Please upload corrected evidence for {nonCompliantMilestone.name || `Stage ${nonCompliantMilestone.number}`} before the next fund release.
                    </p>
                </div>
            )}

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

            {/* Financial Summary */}
            {grantData && (
                <div className="portal-card" style={{ marginBottom: '20px', borderLeft: '4px solid #10b981' }}>
                    <div className="portal-card-header" style={{ paddingBottom: '16px' }}>
                        <div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#064e3b' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                FINANCIAL SUMMARY
                            </h2>
                        </div>
                    </div>
                    <div className="portal-card-body" style={{ background: '#f0fdf4', padding: '24px 28px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Approved Amount</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{formatIndianCurrency(grantData.approvedAmount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Released</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{formatIndianCurrency(grantData.releasedAmount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{formatIndianCurrency(grantData.remainingAmount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px' }}>Utilization</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{grantData.utilizationPercentage}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Initial Banking Details */}
            {(() => {
                const m1 = disbursementPlan?.milestones?.find(m => m.number === 1);
                return m1 && m1.complianceType === 'DOCUMENTATION' && 
                 ['PENDING', 'DUE', 'BLOCKED'].includes(m1.status) && (
                    <div className="portal-card" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div className="portal-card-header" style={{ paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="16" r="2"></circle><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    INITIAL BANKING DETAILS
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Banking details and a verified passbook are required before the initial grant installment can be released.</p>
                            </div>
                        </div>
                        <div className="portal-card-body" style={{ background: '#fffbeb', padding: '24px 28px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Account Holder Name</label>
                                    <input type="text" value={bankingDetails.bankAccountHolderName} onChange={e => setBankingDetails({...bankingDetails, bankAccountHolderName: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bank Name</label>
                                    <input type="text" value={bankingDetails.bankName} onChange={e => setBankingDetails({...bankingDetails, bankName: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Account Number</label>
                                    <input type="text" value={bankingDetails.bankAccountNumber} onChange={e => setBankingDetails({...bankingDetails, bankAccountNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} placeholder="Enter full account number" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>IFSC Code</label>
                                    <input type="text" placeholder="e.g. SBIN0001234" value={bankingDetails.bankIfscCode} onChange={e => setBankingDetails({...bankingDetails, bankIfscCode: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Account Type</label>
                                    <select value={bankingDetails.bankAccountType} onChange={e => setBankingDetails({...bankingDetails, bankAccountType: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                        <option value="SAVINGS">Savings</option>
                                        <option value="CURRENT">Current</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button onClick={handleSaveBanking} disabled={savingBanking} style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: savingBanking ? 'not-allowed' : 'pointer' }}>
                                        {savingBanking ? 'Saving...' : 'Save Banking Details'}
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ borderTop: '1px dashed #fcd34d', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#b45309' }}>Bank Passbook Photo</h4>
                                    <p style={{ fontSize: '12px', color: '#92400e' }}>Upload a clear photo of your bank passbook (PDF, JPG, PNG)</p>
                                </div>
                                <div>
                                    {getDoc('BANK_PASSBOOK') ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '13px', background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '100px', fontWeight: 'bold' }}>✓ Uploaded</span>
                                            <span style={{ fontSize: '12px', color: getDoc('BANK_PASSBOOK').status === 'VERIFIED' ? '#166534' : (getDoc('BANK_PASSBOOK').status === 'REJECTED' ? '#991b1b' : '#b45309'), fontWeight: 'bold' }}>
                                                {getDoc('BANK_PASSBOOK').status === 'VERIFIED' ? '✓ VERIFIED' : (getDoc('BANK_PASSBOOK').status === 'REJECTED' ? '✗ REJECTED' : '⏳ PENDING VERIFICATION')}
                                            </span>
                                        </div>
                                    ) : uploading === 'BANK_PASSBOOK' ? (
                                        <span style={{ fontSize: '13px', color: '#1a56db', fontWeight: '500' }}>Uploading...</span>
                                    ) : (
                                        <>
                                            <input type="file" id="passbook-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleUpload(e, 'BANK_PASSBOOK')} style={{ display: 'none' }} />
                                            <label htmlFor="passbook-upload" style={{ display: 'inline-block', padding: '8px 16px', background: 'white', border: '1px solid #fcd34d', color: '#b45309', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                                                Choose File
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Staged Disbursement Schedule (Read-Only) */}
            {disbursementPlan && (
                <div className="portal-card" style={{ marginBottom: '20px' }}>
                    <div className="portal-card-header" style={{ paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                                STAGED DISBURSEMENT SCHEDULE
                            </h2>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a' }}>
                            {formatIndianCurrency(disbursementPlan.releasedAmount)} / {formatIndianCurrency(disbursementPlan.plannedAmount)} Released
                        </div>
                    </div>
                    <div className="portal-card-body" style={{ background: '#f8fafc', padding: '24px 28px' }}>
                        {[...(disbursementPlan.milestones || [])].sort((a, b) => a.number - b.number).map((m, index, arr) => {
                            const prevReleased = index === 0 || arr[index - 1].status === 'RELEASED';
                            return (
                            <div key={m.id} style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748b' }}>
                                            {m.number}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{m.name || `Milestone ${m.number}`}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Due: {new Date(m.dueDate).toLocaleDateString()} • Required: {m.complianceType.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{formatIndianCurrency(m.amount)}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px',
                                                background: m.status === 'RELEASED' ? '#dcfce7' : (m.status === 'COMPLETED' ? '#e0f2fe' : '#f1f5f9'),
                                                color: m.status === 'RELEASED' ? '#166534' : (m.status === 'COMPLETED' ? '#0369a1' : '#475569')
                                            }}>
                                                {m.status}
                                            </div>
                                            {m.status === 'RELEASED' && (
                                                <button onClick={() => viewReceipt(m.id)} disabled={loadingReceipt} style={{ marginTop: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                    {loadingReceipt ? 'Loading...' : 'VIEW RECEIPT'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {m.complianceType === 'UTILIZATION_PROOF' && prevReleased && (m.status === 'PENDING' || m.status === 'DUE' || m.status === 'OVERDUE' || m.status === 'NON_COMPLIANT') && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                                        {m.status === 'NON_COMPLIANT' && (
                                            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                                                <p style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>🔴 ACTION REQUIRED: Utilization Proof Requires Correction</p>
                                                <p style={{ fontSize: '13px', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
                                                    <strong>Reason:</strong> <br />
                                                    {m.remarks || 'The uploaded evidence was marked non-compliant by the Grant Officer.'}
                                                </p>
                                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginTop: '12px' }}>Next Step: Please submit corrected utilization evidence.</p>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div>
                                                {m.status !== 'NON_COMPLIANT' && (
                                                    <>
                                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '2px' }}>Action Required: Utilization Proof Evidences</p>
                                                        <p style={{ fontSize: '12px', color: '#64748b' }}>Please stage your invoices or bank statements to proceed to the next disbursement round.</p>
                                                    </>
                                                )}
                                                {m.status === 'NON_COMPLIANT' && (
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Upload new evidence to lift the block.</p>
                                                )}
                                            </div>
                                            <label style={{ display: 'inline-block', padding: '6px 12px', background: m.status === 'NON_COMPLIANT' ? '#ef4444' : '#e0f2fe', color: m.status === 'NON_COMPLIANT' ? 'white' : '#0369a1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                                {m.status === 'NON_COMPLIANT' ? '+ UPLOAD CORRECTED EVIDENCE' : '+ ADD FILES'}
                                                <input type="file" multiple onChange={(e) => handleMilestoneFilesChange(e, m.id)} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                        
                                        {uploadingMilestone?.id === m.id && uploadingMilestone.staging?.length > 0 && (
                                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>Staged Evidence Files</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {uploadingMilestone.staging.map((s, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.file.name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                                <select 
                                                                    value={s.type} 
                                                                    onChange={(e) => updateMilestoneFileType(idx, e.target.value)}
                                                                    style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                                >
                                                                    <option value="INVOICE">Invoice / Bill</option>
                                                                    <option value="BANK_STATEMENT">Bank Statement</option>
                                                                    <option value="PHOTOGRAPH">Site Photograph</option>
                                                                    <option value="OTHER">Other Proof</option>
                                                                </select>
                                                                <button onClick={() => removeMilestoneFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => submitMilestoneEvidence(m.id)} disabled={submitting} style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                                        {submitting ? 'UPLOADING...' : `SUBMIT ${uploadingMilestone.staging.length} EVIDENCE(S)`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {receiptModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="portal-card" style={{ width: '400px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#10b981', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                Milestone Receipt
                            </h3>
                            <button onClick={() => setReceiptModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Amount Released</p>
                                <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{formatIndianCurrency(receiptModal.amount)}</p>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Date</p>
                                <p style={{ fontSize: '15px', color: '#334155', fontWeight: 600 }}>{new Date(receiptModal.releasedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction ID</p>
                                <p style={{ fontSize: '14px', fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', display: 'inline-block', borderRadius: '4px' }}>{receiptModal.transactionReference}</p>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{receiptModal.status}</span>
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
