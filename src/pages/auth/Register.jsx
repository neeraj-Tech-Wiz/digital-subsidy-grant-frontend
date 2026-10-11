import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import '../../App.css';

function Register() {
  const navigate = useNavigate();
  const { register, verifyRegistrationOtp, resendOtp } = useAuth();
  
  // Phase 1 (Registration Details)
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  
  // Wizard states
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Phase 2 (OTP Verification)
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await register(formData);
      setChallengeId(res.challengeId);
      setMaskedEmail(res.maskedEmail);
      setTimer(res.expiresInSeconds || 300);
      setCanResend(false);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyRegistrationOtp({ challengeId, otp });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await resendOtp({ challengeId });
      setChallengeId(res.challengeId);
      setTimer(res.expiresInSeconds || 300);
      setCanResend(false);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-page">
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
          
          <h1>Join the <span>National Grant System</span></h1>
          
          <p className="auth-panel-desc">
            Register as a beneficiary and unlock access to hundreds of government 
            subsidy programs designed for citizens like you.
          </p>

          <ul className="auth-panel-features">
            <li><span className="check">✓</span> Free & instant registration</li>
            <li><span className="check">✓</span> Access all active schemes</li>
            <li><span className="check">✓</span> Mandatory OTP Security</li>
            <li><span className="check">✓</span> Secure document management</li>
          </ul>
        </div>
        <p className="auth-panel-footer">
          © 2026 Digital Subsidy & Grant Administration Platform.
        </p>
      </div>

      <div className="auth-form-side">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          
          {step === 1 && (
            <>
              <div className="auth-form-header">
                <h2>Create your account</h2>
                <p>Register as a beneficiary to get started</p>
              </div>

              {error && (
                <div className="auth-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

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
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="6"
                    required
                    autoComplete="new-password"
                  />
                  <small>Use at least 6 characters with a mix of letters and numbers</small>
                </div>

                <button type="submit" className="form-submit-btn" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg style={{ animation: 'spin 0.8s linear infinite', width:'18px', height:'18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Verifying details...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>

              <p className="auth-footer-text">
                Already have an account? <Link to="/login">Sign in here</Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-form-header">
                <h2>Verify your email</h2>
                <p>We've sent a 6-digit code to <strong>{maskedEmail}</strong></p>
              </div>

              {error && (
                <div className="auth-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                  </svg>
                  Registration complete! Redirecting to login...
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="form-field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Verification Code</span>
                    <span style={{ fontSize: '0.85rem', color: timer < 60 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                      {formatTime(timer)}
                    </span>
                  </label>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 6) setOtp(val);
                    }}
                    pattern="\d{6}"
                    title="Please enter exactly 6 digits"
                    required
                    style={{ fontSize: '1.2rem', padding: '12px', letterSpacing: '2px', textAlign: 'center' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="form-submit-btn" 
                  disabled={loading || success || otp.length < 6}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg style={{ animation: 'spin 0.8s linear infinite', width:'18px', height:'18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Verifying...
                    </span>
                  ) : "Complete Registration"}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Didn't receive the code?
                </p>
                <button 
                  type="button" 
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                  className="auth-link-btn"
                  style={{ 
                    background: 'none', border: 'none', color: canResend ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontWeight: '600', cursor: canResend ? 'pointer' : 'not-allowed', padding: '0', fontSize: '0.9rem' 
                  }}
                >
                  {canResend ? "Resend OTP" : `Resend available in ${formatTime(timer)}`}
                </button>

                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="auth-link-btn"
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}
                >
                  Change email address
                </button>
              </div>
            </>
          )}

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

export default Register;
