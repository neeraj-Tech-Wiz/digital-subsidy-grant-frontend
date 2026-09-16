import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import grantService from "../../services/grantService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

export default function PendingGrants() {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        grantService.getPendingGrants()
            .then(res => setGrants(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Pending Checkouts</h1>
                    <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Approved applications ready for financial clearing.</p>
                </div>
                <div style={{ background: '#eff6ff', color: '#1a56db', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                    {grants.length} Pending
                </div>
            </div>
            
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b' }}>Loading pending applications...</p>
                </div>
            ) : grants.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ opacity: 0.5, marginBottom: '16px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Inbox Empty</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No pending applications waiting for disbursement.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application ID</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beneficiary</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheme</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grants.map((grant, i) => (
                                    <tr key={grant.id} style={{ borderBottom: i === grants.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>APP-{grant.id}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{grant.beneficiaryName || 'Unknown'}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                                {grant.schemeName || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{grant.eligibilityScore}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>/100</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                {grant.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => navigate(`/grant-officer/applications/${grant.id}/disburse`)}
                                                style={{
                                                    background: 'transparent',
                                                    color: '#1a56db',
                                                    border: '1px solid #bfdbfe',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                                            >
                                                Review & Release
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
