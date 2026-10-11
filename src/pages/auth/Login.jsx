import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import '../../App.css';

function Login() {
  const navigate = useNavigate();
  const { login, loginOtp, verifyOtp, resendOtp } = useAuth();
  
  const [authMethod, setAuthMethod] = useState("PASSWORD"); // PASSWORD or OTP
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [otpStage, setOtpStage] = useState("REQUEST"); // REQUEST or VERIFY
  const [challengeData, setChallengeData] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      if (authMethod === "PASSWORD") {
        const user = await login(formData);
        navigate(getDashboardRoute(user.role), { replace: true });
      } else {
        const response = await loginOtp(formData);
        setChallengeData(response);
        setOtpStage("VERIFY");
        setResendCooldown(60);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const user = await verifyOtp({
        challengeId: challengeData.challengeId,
        otp: otpCode
      });
      navigate(getDashboardRoute(user.role), { replace: true });
    } catch (error) {
       setError(error.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const response = await resendOtp({ challengeId: challengeData.challengeId });
      setChallengeData(response);
      setResendCooldown(60);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const renderOtpVerify = () => (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <div className="auth-form-header">
        <h2>Verify Your Email</h2>
        <p>We sent a 6-digit OTP to:</p>
        <p><strong>{challengeData?.maskedEmail}</strong></p>
      </div>

      {error && (
        <div className="auth-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleVerifyOtp}>
        <div className="form-field">
          <label>6-Digit OTP</label>
          <input
            type="text"
            pattern="\d{6}"
            maxLength="6"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            required
            autoFocus
            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }}
          />
        </div>

        <button type="submit" className="form-submit-btn" disabled={loading || otpCode.length !== 6}>
          {loading ? "Verifying..." : "Verify & Sign In"}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', textAlign: 'center' }}>
        <button 
          type="button" 
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || loading}
          style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
        >
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>

        <button 
          type="button" 
          onClick={() => { setOtpStage("REQUEST"); setOtpCode(""); setError(""); }}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
        >
           Back to Login
        </button>
      </div>
    </div>
  );

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
        {otpStage === "VERIFY" ? renderOtpVerify() : (
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="form-submit-btn" style={{ flex: 1 }} onClick={() => setAuthMethod("OTP")} disabled={loading}>
                  {loading && authMethod === "OTP" ? "Generating OTP..." : "Sign in with Email OTP"}
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#9ca3af', fontSize: '14px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                <span style={{ padding: '0 10px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              </div>

              <button type="submit" onClick={() => setAuthMethod("PASSWORD")} disabled={loading} style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #d1d5db', 
                backgroundColor: 'white', 
                color: '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}>
                {loading && authMethod === "PASSWORD" ? "Signing in..." : "Sign in with Password"}
              </button>
            </form>

            <p className="auth-footer-text" style={{ marginTop: '30px' }}>
              Don't have an account? <Link to="/register">Create one here</Link>
            </p>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/" className="back-home-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
