import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GrantOfficerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="portal-layout">
            <aside className="portal-sidebar" id="desktop-sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                    </div>
                    <div className="sidebar-brand-text">
                        <h1>Finance Node</h1>
                        <p>Grant Officers</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <span className="sidebar-section-label">Navigation</span>
                    <NavLink to="/grant-officer/dashboard" end className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </NavLink>
                    <NavLink to="/grant-officer/pending" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Pending Grants
                    </NavLink>
                    <NavLink to="/grant-officer/history" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        Disbursement History
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-sm">
                        <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'O'}</div>
                        <div className="user-info">
                            <p className="user-name">{user?.name || 'Officer'}</p>
                            <p className="user-email">{user?.email}</p>
                        </div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="portal-main">
                <header className="mobile-header">
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <h2>Finance Node</h2>
                </header>

                <div className="content-container">
                    <Outlet />
                </div>
            </main>

            <style dangerouslySetInnerHTML={{__html: `
                @media (min-width: 768px) {
                    #desktop-sidebar { display: flex !important; }
                    .portal-main { margin-left: 260px; }
                }
                @media (max-width: 767px) {
                    .portal-main { margin-left: 0 !important; }
                }
            `}} />
        </div>
    );
}

export default GrantOfficerLayout;
