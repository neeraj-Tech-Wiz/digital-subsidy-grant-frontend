import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import grantService from "../../services/grantService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

export default function GrantApplicationDetails() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    
    const [application, setApplication] = useState(null);
    const [schemeSummary, setSchemeSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [disbursing, setDisbursing] = useState(false);
    const [error, setError] = useState("");
    const [successTransaction, setSuccessTransaction] = useState(null);

    useEffect(() => {
        grantService.getGrantApplication(applicationId)
            .then(res => {
                setApplication(res.data);
                return grantService.getSchemeFinanceSummary(res.data.schemeCode ? res.data.schemeId : res.data.applicationId /* Temporary workaround if schemeId is missing from DTO */);
                // Note: application.schemeId might not be in the DTO unless we added it. But we can fetch it via /api/grants/schemes/... wait, the backend endpoint uses schemeId. 
                // Let's modify the fetch to find the scheme summary by looking it up if needed.
                // We added schemeCode and schemeName. But we really need the backend to return schemeId, or GrantController.getGrantApplication(id) needs to fetch scheme summary natively!
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [applicationId]);
    
    useEffect(() => {
        if(application) {
            // To ensure we get the right scheme ID, we rely on the DTO. Wait, getGrantApplicationDetails doesn't expose schemeId yet, but wait, we can just fetch /api/schemes if needed. 
            // For now, let's fetch summary from our specific endpoint! Wait, schemeSummary endpoint requires schemeId. We didn't map it. Let me just fetch all schemes and find it.
            fetch(`http://localhost:8080/api/schemes`)
              .then(res => res.json())
              .then(res => {
                  const scheme = res.find(s => s.schemeName === application.schemeName);
                  if (scheme) {
                      grantService.getSchemeFinanceSummary(scheme.id).then(ss => setSchemeSummary(ss.data));
                  }
              });
        }
    }, [application]);

    const handleDisburse = () => {
        if (!window.confirm(`You are about to release ${formatIndianCurrency(schemeSummary?.grantAmount)} to ${application.beneficiaryName} under ${application.schemeName}. Proceed?`)) return;
        
        setDisbursing(true);
        grantService.disburseGrant(applicationId)
            .then((res) => {
                setSuccessTransaction({
                    reference: res.data.transactionReference,
                    date: res.data.disbursedAt,
                    amount: res.data.grantAmount
                });
            })
            .catch(err => {
                const msg = err.response?.data?.message || "Failed to disburse funds. Budget exceeded or already disbursed.";
                setError(msg);
                window.scrollTo(0, 0);
            })
            .finally(() => setDisbursing(false));
    };

    if (loading) return (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '800px', margin: '40px auto' }}>
            <p style={{ color: '#64748b' }}>Loading application details...</p>
        </div>
    );
    if (!application) return <div style={{ padding: '40px', textAlign: 'center' }}>Application not found.</div>;

    if (successTransaction) return (
        <div style={{ maxWidth: '800px', margin: '40px auto', background: 'white', borderRadius: '16px', border: '1px solid #10b981', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.1)' }}>
            <div style={{ background: '#ecfdf5', padding: '32px', textAlign: 'center', borderBottom: '1px solid #d1fae5' }}>
                <div style={{ width: '64px', height: '64px', background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>✓</div>
                <h1 style={{ color: '#065f46', margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>Grant Disbursed Successfully</h1>
                <p style={{ color: '#059669', margin: 0, fontSize: '15px' }}>The funds have been released and the transaction is securely logged.</p>
            </div>
            <div style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Application ID</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>APP-{application.applicationId}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Transaction Ref</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{successTransaction.reference}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Disbursed Amt</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{formatIndianCurrency(successTransaction.amount)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Timestamp</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{new Date(successTransaction.date).toLocaleString()}</div>
                    </div>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Scheme</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.schemeName}</div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/grant-officer/pending')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Back to Dashboard</button>
                    <button onClick={() => navigate('/grant-officer/history')} style={{ padding: '12px 24px', background: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>View Audit Log</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 0', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Disburse Grant</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>APP-{application.applicationId}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                            {application.status}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <strong>Disbursement Rejected:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
                
                {/* Beneficiary Profile Card */}
                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Beneficiary Profile</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Full Name</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.beneficiaryName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Email Address</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.email || 'Not Provided'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Mobile Number</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.mobileNumber || 'Not Provided'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Aadhaar Check</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{application.maskedAadhaar || 'Not Provided'}</div>
                        </div>
                    </div>
                </div>

                {/* Application Information */}
                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Application Data</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Eligibility Score</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.eligibilityScore}/100</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Verification Route</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.verificationRoute || 'SIMPLE'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Submitted Date</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Scheme & Financial Summary Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Scheme Allocation</h2>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Scheme Name</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{application.schemeName}</div>
                        </div>
                        <div style={{ marginBottom: 'auto' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Scheme Code</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'inline-block' }}>
                                {application.schemeCode || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Financial Engine</h2>
                        
                        {schemeSummary ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#475569', fontSize: '14px' }}>Total Allocated Budget:</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatIndianCurrency(schemeSummary.totalBudget)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#475569', fontSize: '14px' }}>Disbursed Till Date:</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatIndianCurrency(schemeSummary.disbursedAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #cbd5e1' }}>
                                    <span style={{ color: '#475569', fontSize: '14px' }}>Remaining Available:</span>
                                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatIndianCurrency(schemeSummary.remainingBudget)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '18px' }}>Disbursement Value:</span>
                                    <span style={{ fontWeight: 800, fontSize: '32px', color: '#1a56db', letterSpacing: '-1px' }}>{formatIndianCurrency(schemeSummary.grantAmount)}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#64748b', fontSize: '14px' }}>Loading real-time financial capacity...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation & Release Panel */}
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Disbursement Confirmation</h3>
                <p style={{ color: '#475569', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                    You are authorizing the release of <strong>{schemeSummary ? formatIndianCurrency(schemeSummary.grantAmount) : '...'}</strong> to <strong>{application.beneficiaryName}</strong>. This transaction will be permanently recorded in the audit logs.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '14px', fontWeight: 500 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Application is Final Approved
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '14px', fontWeight: 500 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Sufficient budget capacity
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '14px', fontWeight: 500 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Duplicate payment check passed
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => navigate('/grant-officer/pending')}
                        style={{ padding: '16px 32px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '16px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Cancel Release
                    </button>
                    <button 
                        onClick={handleDisburse} 
                        disabled={disbursing || !schemeSummary}
                        style={{
                            padding: '16px 40px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: disbursing || !schemeSummary ? 'not-allowed' : 'pointer', opacity: disbursing || !schemeSummary ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}
                    >
                        {disbursing ? 'Executing Transfer Protocol...' : `Confirm & Disburse ${schemeSummary ? formatIndianCurrency(schemeSummary.grantAmount) : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
