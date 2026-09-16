import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import '../../App.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case "BENEFICIARY": return "/beneficiary/dashboard";
      case "ADMIN": return "/admin/dashboard";
      case "LEVEL_1_OFFICER":
      case "LEVEL_2_OFFICER":
      case "LEVEL_3_OFFICER":
      case "FINAL_APPROVAL_OFFICER":
        return "/officer/dashboard";
      case "GRANT_OFFICER":
        return "/grant-officer/dashboard";
      default: return "/unauthorized";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(formData);
      navigate(getDashboardRoute(user.role), { replace: true });
    } catch (error) {
      setError(error.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-panel-brand">
            <div className="auth-panel-brand-dot">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2>Digital Subsidy Platform</h2>
          </div>
          
          <h1>Access your <span>Beneficiary Portal</span></h1>
          
          <p className="auth-panel-desc">
            Securely access government subsidy schemes, submit applications, and 
            track your eligibility status in real-time.
          </p>

          <ul className="auth-panel-features">
            <li><span className="check">✓</span> Discover active government schemes</li>
            <li><span className="check">✓</span> Automated eligibility evaluation</li>
            <li><span className="check">✓</span> Digital document submission</li>
            <li><span className="check">✓</span> Real-time verification tracking</li>
          </ul>
        </div>

        <p className="auth-panel-footer">
          © 2026 Digital Subsidy & Grant Administration Platform. All rights reserved.
        </p>
      </div>

      {/* Right Form Side */}
      <div className="auth-form-side">
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your subsidy portal</p>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="form-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 0.8s linear infinite', width:'18px', height:'18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Create one here</Link>
          </p>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/" className="back-home-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
