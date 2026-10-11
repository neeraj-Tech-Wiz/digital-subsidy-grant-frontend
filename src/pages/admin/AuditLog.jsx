import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../../services/adminAuditService';
import { Link } from 'react-router-dom';
import { 
    FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight, 
    FiInfo, FiCheckCircle, FiXCircle, FiGrid, FiShield,
    FiActivity, FiCheck, FiX, FiAlertTriangle, FiDatabase
} from 'react-icons/fi';
import './AuditLog.css';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    const [filters, setFilters] = useState({
        eventType: '', actor: '', role: '', applicationId: '', success: '', fromDate: '', toDate: ''
    });

    const [selectedLog, setSelectedLog] = useState(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchAuditLogs(filters, page, 25);
            setLogs(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLogs(); }, [page]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => { setPage(0); loadLogs(); };

    const clearFilters = () => {
        setFilters({ eventType: '', actor: '', role: '', applicationId: '', success: '', fromDate: '', toDate: '' });
        setPage(0);
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleString();
    };

    // Calculate Current Page Metrics
    const pageSuccess = logs.filter(l => l.success).length;
    const pageFailed = logs.filter(l => !l.success).length;
    const pageSecurity = logs.filter(l => 
        (l.eventType || l.action)?.includes('LOGIN') || 
        (l.eventType || l.action)?.includes('DENIED') || 
        (l.eventType || l.action)?.includes('SECURITY')
    ).length;

    const getEventStyle = (eventStr = '') => {
        const e = eventStr.toUpperCase();
        if (e.includes('LOGIN_SUCCESS') || e.includes('APPROVED')) return 'event-success';
        if (e.includes('LOGIN_FAILED') || e.includes('DENIED')) return 'event-security';
        if (e.includes('RELEASED') || e.includes('DISBURSE')) return 'event-financial';
        if (e.includes('NON_COMPLIANT') || e.includes('REJECTED')) return 'event-warning';
        return 'event-default';
    };

    return (
        <div className="audit-layout">
            
            {/* SIDEBAR PRESERVED FOR NAVIGATION */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="brand-icon">
                        <FiShield size={20} color="white" />
                    </div>
                    <h2>Admin Portal</h2>
                </div>
                
                <div className="admin-sidebar-nav">
                    <div className="nav-section-title">OVERVIEW</div>
                    <Link to="/admin/dashboard" className="admin-nav-item">
                        <FiGrid className="nav-icon" /> Dashboard
                    </Link>

                    <div className="nav-section-title mt-4">OPERATIONS</div>
                    <Link to="/admin/schemes" className="admin-nav-item">
                        <FiDatabase className="nav-icon" /> Scheme Management
                    </Link>

                    <div className="nav-section-title mt-4">MONITORING</div>
                    <Link to="/admin/audit" className="admin-nav-item active">
                        <FiActivity className="nav-icon" /> Activity & Audit Log
                    </Link>
                </div>
            </aside>

            <main className="admin-main">
                <div className="audit-header">
                    <div>
                        <h1>Activity & Audit Log</h1>
                        <p>Platform-wide chronological record of authentications, workflows, and administration.</p>
                    </div>
                    <button onClick={loadLogs} className="btn-refresh">
                        <FiRefreshCw className={loading ? "spin" : ""} /> Refresh Activity
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                <div className="audit-summary-cards">
                    <div className="a-card primary">
                        <div className="a-icon"><FiActivity /></div>
                        <div className="a-info">
                            <span className="a-val">{totalElements}</span>
                            <span className="a-lbl">Total Events (Filtered Query)</span>
                        </div>
                    </div>
                    <div className="a-card success">
                        <div className="a-icon"><FiCheckCircle /></div>
                        <div className="a-info">
                            <span className="a-val">{pageSuccess}</span>
                            <span className="a-lbl">Successful (Current Page)</span>
                        </div>
                    </div>
                    <div className="a-card danger">
                        <div className="a-icon"><FiXCircle /></div>
                        <div className="a-info">
                            <span className="a-val">{pageFailed}</span>
                            <span className="a-lbl">Failed (Current Page)</span>
                        </div>
                    </div>
                    <div className="a-card warning">
                        <div className="a-icon"><FiAlertTriangle /></div>
                        <div className="a-info">
                            <span className="a-val">{pageSecurity}</span>
                            <span className="a-lbl">Security Actions (Current Page)</span>
                        </div>
                    </div>
                </div>

                <div className="audit-filters-panel">
                    <div className="filters-title">
                        <FiFilter /> Advanced Tracking Filters
                    </div>
                    <div className="filters-grid">
                        <input type="text" name="actor" placeholder="Search Actor Email or Resource ID..." value={filters.actor} onChange={handleFilterChange} className="filter-input" />
                        
                        <select name="eventType" value={filters.eventType} onChange={handleFilterChange} className="filter-input">
                            <option value="">All Event Categories</option>
                            <option value="AUTHENTICATION">Authentication Events</option>
                            <option value="APPLICATION">Application Flow</option>
                            <option value="VERIFICATION">Verification Flow</option>
                            <option value="COMPLIANCE">Compliance & Audits</option>
                            <option value="FINANCIAL">Financial Releases</option>
                            <option value="ADMINISTRATION">Administration</option>
                            <option value="SECURITY">Security Violations</option>
                        </select>

                        <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-input">
                            <option value="">All Roles (Any)</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="GRANT_OFFICER">GRANT_OFFICER</option>
                            <option value="LEVEL_1_OFFICER">L1 VERIFIER</option>
                            <option value="LEVEL_2_OFFICER">L2 VERIFIER</option>
                            <option value="LEVEL_3_OFFICER">L3 VERIFIER</option>
                            <option value="FINAL_APPROVAL_OFFICER">FINAL APPROVAL OFFICER</option>
                            <option value="BENEFICIARY">BENEFICIARY</option>
                        </select>
                        
                        <select name="success" value={filters.success} onChange={handleFilterChange} className="filter-input">
                            <option value="">Result (Any)</option>
                            <option value="true">Successful Operations</option>
                            <option value="false">Failed/Denied Operations</option>
                        </select>

                        <input type="text" name="applicationId" placeholder="Application ID..." value={filters.applicationId} onChange={handleFilterChange} className="filter-input" />
                        <input type="text" name="resourceType" placeholder="Resource Type (e.g USER)" disabled className="filter-input bg-gray-100 placeholder-gray-400" title="Auto-detects from Event Category" />
                        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="filter-input" title="Date From" />
                        <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="filter-input" title="Date To" />
                    </div>
                    <div className="filters-actions">
                        <button onClick={clearFilters} className="btn-clear text-slate-500">Clear Filters</button>
                        <button onClick={applyFilters} className="btn-primary-action"><FiSearch /> Apply Filters</button>
                    </div>
                </div>

                <div className="audit-table-wrapper">
                    <div className="table-responsive">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>TIMESTAMP</th>
                                    <th>ACTOR</th>
                                    <th>ROLE</th>
                                    <th>EVENT</th>
                                    <th>RESOURCE</th>
                                    {filters.eventType === 'FINANCIAL' && <th className="text-right">AMOUNT DISBURSED</th>}
                                    <th className="text-center">RESULT</th>
                                    <th className="text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={filters.eventType === 'FINANCIAL' ? "8" : "7"} className="table-state-msg">Loading secure platform records...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={filters.eventType === 'FINANCIAL' ? "8" : "7"} className="table-state-msg">No audit records found matching your parameters.</td></tr>
                                ) : (
                                    logs.map((log) => {
                                        const eStr = log.eventTypeStr || log.eventType || log.action;
                                        return (
                                        <tr key={`${log.sourceTable}-${log.id}`}>
                                            <td className="time-col">{formatDate(log.timestamp)}</td>
                                            <td className="actor-email">{log.actorEmail || 'SYSTEM'}</td>
                                            <td><span className="role-badge">{log.actorRole?.replace('ROLE_', '') || 'INTERNAL'}</span></td>
                                            <td><span className={`event-val-badge ${getEventStyle(eStr)}`}>{eStr}</span></td>
                                            <td>
                                                {log.applicationId ? (
                                                    <span className="resource-app">App #{log.applicationId}</span>
                                                ) : (
                                                    <span className="resource-sys">{log.resourceType || 'SYSTEM'} {log.resourceId ? `#${log.resourceId}` : ''}</span>
                                                )}
                                            </td>
                                            {filters.eventType === 'FINANCIAL' && (
                                                <td className="text-right font-semibold text-green-700">
                                                    {log.amount != null ? `₹${log.amount.toLocaleString()}` : '-'}
                                                </td>
                                            )}
                                            <td className="text-center">
                                                {log.success ? (
                                                    <span className="status-badge ok"><FiCheck /></span>
                                                ) : (
                                                    <span className="status-badge fail"><FiX /></span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <button onClick={() => setSelectedLog(log)} className="btn-details" title="Deep Inspection">
                                                    <FiGrid />
                                                </button>
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {!loading && totalPages > 0 && (
                        <div className="audit-pagination">
                            <span className="page-info">
                                Showing <strong>{(page * 25) + 1} – {Math.min((page + 1) * 25, totalElements)}</strong> of <strong>{totalElements}</strong> events
                            </span>
                            <div className="page-controls">
                                <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn-page"><FiChevronLeft /></button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Complex quick pagination logic to show nearest 5 pages
                                    let pNum = page < 3 ? i : (page >= totalPages - 2 ? totalPages - 5 + i : page - 2 + i);
                                    if (pNum < 0) pNum = i; 
                                    if (pNum >= totalPages) return null;
                                    return (
                                        <button key={pNum} className={`btn-page ${page === pNum ? 'active-page' : ''}`} onClick={() => setPage(pNum)}>
                                            {pNum + 1}
                                        </button>
                                    );
                                })}
                                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="btn-page"><FiChevronRight /></button>
                            </div>
                        </div>
                    )}
                </div>

                {selectedLog && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2><FiInfo className="modal-icon" /> Event Details: {selectedLog.eventTypeStr || selectedLog.eventType || selectedLog.action}</h2>
                                <button onClick={() => setSelectedLog(null)} className="modal-close"><FiXCircle /></button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-grid">
                                    <div className="m-group">
                                        <label>Timestamp</label>
                                        <div className="m-val">{formatDate(selectedLog.timestamp)}</div>
                                    </div>
                                    <div className="m-group">
                                        <label>Actor</label>
                                        <div className="m-val highlight">{selectedLog.actorEmail || 'SYSTEM SERVICE'}</div>
                                    </div>
                                    <div className="m-group">
                                        <label>Role</label>
                                        <div className="m-val">{selectedLog.actorRole || 'INTERNAL'}</div>
                                    </div>
                                    <div className="m-group">
                                        <label>Resource / Object Type</label>
                                        <div className="m-val">{selectedLog.resourceType || 'APPLICATION/SYSTEM'}</div>
                                    </div>
                                    
                                    {selectedLog.applicationId && (
                                        <div className="m-group">
                                            <label>Application ID</label>
                                            <div className="m-val text-blue-600">#{selectedLog.applicationId}</div>
                                        </div>
                                    )}
                                    {selectedLog.resourceId && !selectedLog.applicationId && (
                                        <div className="m-group">
                                            <label>Resource ID</label>
                                            <div className="m-val">#{selectedLog.resourceId}</div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Status State Transition details if available */}
                                {(selectedLog.previousStatus || selectedLog.newStatus || selectedLog.amount) && (
                                     <div className="m-panel neutral-panel">
                                          <div className="grid grid-cols-3 gap-4">
                                               {selectedLog.previousStatus && (
                                                    <div>
                                                        <label>Previous Status</label>
                                                        <span className="stat-pill text-slate-500">{selectedLog.previousStatus}</span>
                                                    </div>
                                               )}
                                               {selectedLog.newStatus && (
                                                    <div>
                                                        <label>New Status</label>
                                                        <span className="stat-pill font-bold text-slate-800">{selectedLog.newStatus}</span>
                                                    </div>
                                               )}
                                               {selectedLog.amount && (
                                                    <div>
                                                        <label>Transaction Amount</label>
                                                        <span className="stat-pill font-bold text-green-700">₹{selectedLog.amount.toLocaleString()}</span>
                                                    </div>
                                               )}
                                          </div>
                                     </div>
                                )}
                                
                                {(selectedLog.remarks || selectedLog.description) && (
                                    <div className="m-panel">
                                        <label>Detailed Remarks</label>
                                        <div className="m-text">{selectedLog.remarks || selectedLog.description}</div>
                                    </div>
                                )}

                                <div className={`m-panel mt-4 ${selectedLog.success ? 'success-panel' : 'danger'}`}>
                                    <label>Action Result: {selectedLog.success ? 'SUCCESSFUL' : 'FAILED'}</label>
                                    {!selectedLog.success && selectedLog.failureReason ? (
                                        <div className="m-text code mt-2">{selectedLog.failureReason}</div>
                                    ) : (
                                        <div className="m-text text-sm">System accepted and recorded the operation successfully.</div>
                                    )}
                                </div>

                                <div className="modal-footer-metrics">
                                    <div>
                                        <label>IP Address</label>
                                        <code>{selectedLog.ipAddress || 'Internal Network'}</code>
                                    </div>
                                    <div>
                                        <label>User Agent</label>
                                        <code className="truncate" title={selectedLog.userAgent}>{selectedLog.userAgent || 'Headless/Service'}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AuditLog;
