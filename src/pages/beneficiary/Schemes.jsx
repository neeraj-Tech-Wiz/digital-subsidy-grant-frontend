import React, { useEffect, useState } from 'react';
import { schemeService } from '../../services/schemeService';
import { NavLink } from 'react-router-dom';

const Schemes = () => {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        schemeService.getActiveSchemes()
            .then(setSchemes)
            .catch(e => setError(e.message || 'Failed to load schemes from backend.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = schemes.filter(s =>
        s.schemeName?.toLowerCase().includes(search.toLowerCase()) ||
        s.schemeCode?.toLowerCase().includes(search.toLowerCase()) ||
        s.beneficiaryCategory?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="portal-page-header" style={{ marginBottom: 0 }}>
                    <h1>Available Schemes</h1>
                    <p>Explore active government subsidy programs and apply for ones you qualify for.</p>
                </div>
                {!loading && !error && (
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search schemes..."
                            className="portal-input"
                            style={{ paddingLeft: '38px', width: '240px' }}
                        />
                    </div>
                )}
            </div>

            {loading && (
                <div className="loading-wrap">
                    <div className="spinner" />
                    <p className="loading-text">Loading active government schemes...</p>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                        <strong>Connection Error</strong>
                        <p style={{ marginTop: '2px', fontWeight: 400 }}>{error}. Ensure the Spring Boot backend is running on port 8080.</p>
                    </div>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </div>
                    <h3>{search ? 'No matching schemes found' : 'No active schemes available'}</h3>
                    <p>{search ? `No results for "${search}". Try a different keyword.` : 'There are currently no active government schemes accepting applications.'}</p>
                    {search && <button className="btn btn-outline" onClick={() => setSearch('')}>Clear Search</button>}
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="schemes-grid">
                    {filtered.map((scheme) => (
                        <div key={scheme.id} className="scheme-card">
                            <div className="scheme-card-top">
                                <span className="scheme-code">{scheme.schemeCode}</span>
                                <h3>{scheme.schemeName}</h3>
                            </div>
                            <div className="scheme-card-body">
                                <p className="scheme-desc">{scheme.description}</p>
                                <div className="scheme-meta">
                                    <div className="scheme-meta-row">
                                        <span className="scheme-meta-label">Category</span>
                                        <span className="scheme-meta-value">{scheme.beneficiaryCategory}</span>
                                    </div>
                                    <div className="scheme-meta-row">
                                        <span className="scheme-meta-label">Region</span>
                                        <span className="scheme-meta-value">{scheme.applicableRegion}</span>
                                    </div>
                                    <div className="scheme-meta-row">
                                        <span className="scheme-meta-label">Grant Amount</span>
                                        <span className="scheme-meta-value green">
                                            ₹{scheme.grantAmount?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                                <NavLink to={`/beneficiary/schemes/${scheme.id}`} className="scheme-apply-btn">
                                    View Details &amp; Apply →
                                </NavLink>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Schemes;
