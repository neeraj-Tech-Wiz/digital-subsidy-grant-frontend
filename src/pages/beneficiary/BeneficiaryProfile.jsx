import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { beneficiaryService } from '../../services/beneficiaryService';
import { useAuth } from '../../context/AuthContext';

const BeneficiaryProfile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        gender: '',
        age: '',
        mobileNumber: '',
        aadhaarNumber: '',
        address: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                email: user.email
            };
            
            await beneficiaryService.createProfile(payload);
            setSuccess(true);
            setTimeout(() => {
                navigate('/beneficiary/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create profile. Please check your details.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="portal-page-header" style={{ marginBottom: '24px' }}>
                <h1>Complete Your Profile</h1>
                <p>Please provide your personal details to apply for government schemes.</p>
            </div>

            <div className="portal-card">
                <div className="portal-card-header">
                    <h2>Personal Information</h2>
                </div>
                <div className="portal-card-body">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', marginBottom: '8px' }}>Profile Created Successfully!</h3>
                            <p style={{ color: '#047857', fontSize: '14px' }}>Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {error}
                                </div>
                            )}

                            <div className="portal-form-grid" style={{ marginBottom: '24px' }}>
                                <div className="portal-form-field">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" 
                                        className="portal-input" 
                                        value={user?.email || ''} 
                                        disabled 
                                        style={{ background: '#f8fafc', color: '#64748b' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Tied to your authenticated account.</span>
                                </div>

                                <div className="portal-form-field">
                                    <label>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="portal-input" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="As per official documents"
                                    />
                                </div>

                                <div className="portal-form-field">
                                    <label>Father's Name <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="fatherName" 
                                        className="portal-input" 
                                        value={formData.fatherName} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="Father's full name"
                                    />
                                </div>

                                <div className="portal-form-field">
                                    <label>Gender <span style={{ color: '#dc2626' }}>*</span></label>
                                    <select 
                                        name="gender" 
                                        className="portal-input portal-select" 
                                        value={formData.gender} 
                                        onChange={handleChange} 
                                        required
                                    >
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="portal-form-field">
                                    <label>Age <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input 
                                        type="number" 
                                        name="age" 
                                        className="portal-input" 
                                        value={formData.age} 
                                        onChange={handleChange} 
                                        required 
                                        min="18" max="120"
                                        placeholder="Age in years"
                                    />
                                </div>

                                <div className="portal-form-field">
                                    <label>Mobile Number <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="mobileNumber" 
                                        className="portal-input" 
                                        value={formData.mobileNumber} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[0-9]{10}"
                                        title="10 digit mobile number"
                                        placeholder="10-digit number"
                                    />
                                </div>

                                <div className="portal-form-field">
                                    <label>Aadhaar Number <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="aadhaarNumber" 
                                        className="portal-input" 
                                        value={formData.aadhaarNumber} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[0-9]{12}"
                                        title="12 digit Aadhaar number"
                                        placeholder="12-digit Aadhaar number"
                                    />
                                </div>
                            </div>

                            <div className="portal-form-field" style={{ marginBottom: '32px' }}>
                                <label>Complete Address <span style={{ color: '#dc2626' }}>*</span></label>
                                <textarea 
                                    name="address" 
                                    className="portal-input" 
                                    value={formData.address} 
                                    onChange={handleChange} 
                                    required 
                                    rows="3"
                                    placeholder="Enter your current residential address"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving Profile...' : 'Save Profile & Continue'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BeneficiaryProfile;
