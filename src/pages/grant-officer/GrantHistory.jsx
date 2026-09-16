import { useEffect, useState } from "react";
import grantService from "../../services/grantService";
import { formatIndianCurrency } from "../../utils/currencyFormatting";

export default function GrantHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        grantService.getAllDisbursements()
            .then(res => setHistory(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Financial Audit Ledger</h1>
                    <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Immutable record of all successfully cleared grant disbursements.</p>
                </div>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                    {history.length} Transactions
                </div>
            </div>
            
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b' }}>Pulling transaction records...</p>
                </div>
            ) : history.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>Ledger Empty</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No funds have been disbursed yet.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App ID</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Cleared</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authorized By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record, i) => (
                                    <tr key={record.id} style={{ borderBottom: i === history.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                {record.transactionReference}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                                            APP-{record.applicationId}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                                            {formatIndianCurrency(record.grantAmount)}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                                            {new Date(record.disbursedAt).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                            Finance Officer
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
