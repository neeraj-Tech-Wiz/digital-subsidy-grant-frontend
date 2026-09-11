import { Routes, Route } from "react-router-dom";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Beneficiary Pages
import BeneficiaryLayout from "../layouts/BeneficiaryLayout";
import BeneficiaryDashboard from "../pages/beneficiary/BeneficiaryDashboard";
import Schemes from "../pages/beneficiary/Schemes";
import SchemeDetails from "../pages/beneficiary/SchemeDetails";
import MyApplications from "../pages/beneficiary/MyApplications";
import ApplicationDetails from "../pages/beneficiary/ApplicationDetails";
import BeneficiaryProfile from "../pages/beneficiary/BeneficiaryProfile";

// Admin & Officer Dashboards
import AdminDashboard from "../pages/admin/AdminDashboard";
import OfficerDashboard from "../pages/officer/OfficerDashboard";
import OfficerApplicationReview from "../pages/officer/OfficerApplicationReview";

// Common
import Unauthorized from "../pages/common/Unauthorized";
import NotFound from "../pages/common/NotFound";

// Routes Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";

// Home Page — Premium Government Portal Landing
function Home() {
  const features = [
    { icon: '🔍', label: 'blue', title: 'Scheme Discovery', desc: 'Browse all active government subsidy schemes filtered by category, region, and eligibility criteria.' },
    { icon: '⚡', label: 'green', title: 'Instant Eligibility', desc: 'Submit your details and receive an automated eligibility score within seconds — no waiting.' },
    { icon: '📄', label: 'purple', title: 'Digital Documents', desc: 'Upload and manage all required documents digitally with secure cloud storage and verification.' },
    { icon: '🔒', label: 'orange', title: 'Multi-Level Security', desc: 'All applications go through a rigorous 3-level officer verification with full audit trails.' },
  ];

  return (
    <div className="home-page">
      {/* Navbar */}
      <header className="home-navbar">
        <div className="brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2>Digital Subsidy <span>Platform</span></h2>
        </div>
        <nav className="home-nav-buttons">
          <a href="/login" className="login-btn">Sign In</a>
          <a href="/register" className="register-btn-home">Get Started</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-grid-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Trusted by Government Authorities
          </div>
          <h1>
            Transparent &amp; Efficient<br />
            <span>Subsidy Administration</span>
          </h1>
          <p className="hero-description">
            India's unified digital platform for citizens to discover, apply, and track government 
            subsidies — powered by secure JWT authentication and intelligent eligibility workflows.
          </p>
          <div className="hero-buttons">
            <a href="/register" className="primary-btn">Apply for a Scheme</a>
            <a href="/login" className="secondary-btn">Sign In to Portal</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">50+</div>
              <div className="hero-stat-label">Active Schemes</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">3-Level</div>
              <div className="hero-stat-label">Officer Verification</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">100%</div>
              <div className="hero-stat-label">Digital Process</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-eyebrow">How It Works</span>
          <h2>End-to-end Digital Subsidy Management</h2>
          <p className="features-subtitle">
            From discovery to disbursement — every step of the subsidy process is streamlined, 
            transparent, and fully digital.
          </p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <div className={`feature-icon-wrap ${f.label}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">₹2.4Cr+</div>
            <div className="stat-label">Subsidies Disbursed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">12,000+</div>
            <div className="stat-label">Applications Processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98.6%</div>
            <div className="stat-label">Processing Accuracy</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <span className="footer-brand">Digital Subsidy Platform</span>
        <p>© 2026 Government of India · Digital Subsidy &amp; Grant Administration System</p>
        <p style={{ marginTop: '4px' }}>All rights reserved · Powered by Spring Boot &amp; React.</p>
      </footer>
    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Beneficiary Routes */}
      <Route
        path="/beneficiary"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["BENEFICIARY"]}>
              <BeneficiaryLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BeneficiaryDashboard />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="schemes/:schemeId" element={<SchemeDetails />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="applications/:applicationId" element={<ApplicationDetails />} />
        <Route path="profile" element={<BeneficiaryProfile />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected Officer Routes */}
      <Route
        path="/officer/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute
              allowedRoles={[
                "LEVEL_1_OFFICER",
                "LEVEL_2_OFFICER",
                "LEVEL_3_OFFICER",
                "FINAL_APPROVAL_OFFICER",
              ]}
            >
              <OfficerDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/applications/:applicationId/review"
        element={
          <ProtectedRoute>
            <RoleBasedRoute
              allowedRoles={[
                "LEVEL_1_OFFICER",
                "LEVEL_2_OFFICER",
                "LEVEL_3_OFFICER",
                "FINAL_APPROVAL_OFFICER",
              ]}
            >
              <OfficerApplicationReview />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Catch All Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
