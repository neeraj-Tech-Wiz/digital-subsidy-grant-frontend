import axios from 'axios';

const API_URL = 'http://localhost:8080/api/grants';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

const getPendingGrants = () => {
    return axios.get(`${API_URL}/pending`, getAuthHeaders());
};

const getGrantApplication = (id) => {
    return axios.get(`${API_URL}/applications/${id}`, getAuthHeaders());
};

const disburseGrant = (id) => {
    return axios.post(`${API_URL}/applications/${id}/disburse`, {}, getAuthHeaders());
};

const getAllDisbursements = () => {
    return axios.get(`${API_URL}/disbursements`, getAuthHeaders());
};

const getSchemeFinanceSummary = (id) => {
    return axios.get(`${API_URL}/schemes/${id}/summary`, getAuthHeaders());
};

// ==========================================
// NEW STAGED DISBURSEMENT ENDPOINTS
// ==========================================

const createDisbursementPlan = (applicationId, planRequest) => {
    return axios.post(`${API_URL}/applications/${applicationId}/plan`, planRequest, getAuthHeaders());
};

const getDisbursementPlan = (applicationId) => {
    return axios.get(`${API_URL}/applications/${applicationId}/plan`, getAuthHeaders());
};

const getAllDisbursementPlans = () => {
    return axios.get(`${API_URL}/plans`, getAuthHeaders());
};

const submitMilestoneCompliance = (milestoneId, remarks) => {
    return axios.post(`${API_URL}/milestones/${milestoneId}/compliance`, { remarks }, getAuthHeaders());
};

const verifyMilestoneCompliance = (milestoneId, approved, remarks) => {
    return axios.post(`${API_URL}/milestones/${milestoneId}/compliance/verify`, { approved, remarks }, getAuthHeaders());
};

const releaseMilestone = (milestoneId, applicationId) => {
    return axios.post(`${API_URL}/milestones/${milestoneId}/release`, { applicationId }, getAuthHeaders());
};

const getApplicationReleases = (applicationId) => {
    return axios.get(`${API_URL}/applications/${applicationId}/releases`, getAuthHeaders());
};

const uploadComplianceEvidenceFiles = (milestoneId, formData) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/milestones/${milestoneId}/evidence`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
};

const getMilestoneEvidence = (milestoneId) => {
    return axios.get(`${API_URL}/milestones/${milestoneId}/evidence`, getAuthHeaders());
};

const downloadMilestoneEvidence = (evidenceId) => {
    return axios.get(`${API_URL}/evidence/${evidenceId}/download`, {
        ...getAuthHeaders(),
        responseType: 'blob'
    });
};

const getMilestoneReceipt = (milestoneId) => {
    return axios.get(`${API_URL}/milestones/${milestoneId}/receipt`, getAuthHeaders());
};

const reviewMilestoneEvidence = (milestoneId, evidenceId, action, remarks) => {
    return axios.post(`${API_URL}/milestones/${milestoneId}/evidence/${evidenceId}/review`, { action, remarks }, getAuthHeaders());
};

const verifyMilestonePassbook = (applicationId, documentId, action, remarks) => {
    return axios.put(`${API_URL}/documents/${applicationId}/${documentId}/verify-passbook`, { action, remarks }, getAuthHeaders());
};

const nukeDisbursementPlan = (applicationId) => {
    return axios.delete(`${API_URL}/applications/${applicationId}/nuke-plan`, getAuthHeaders());
};

const getRegionalAnalytics = () => {
    return axios.get(`${API_URL}/analytics/regions`, getAuthHeaders());
};

const getNonCompliantMilestones = () => {
    return axios.get(`${API_URL}/compliance/non-compliant`, getAuthHeaders());
};
const getPendingComplianceMilestones = () => {
    return axios.get(`${API_URL}/compliance/pending`, getAuthHeaders());
};

export default {
    getPendingGrants,
    getGrantApplication,
    disburseGrant,
    getAllDisbursements,
    getSchemeFinanceSummary,
    createDisbursementPlan,
    getDisbursementPlan,
    nukeDisbursementPlan,
    getAllDisbursementPlans,
    submitMilestoneCompliance,
    verifyMilestoneCompliance,
    releaseMilestone,
    getApplicationReleases,
    uploadComplianceEvidenceFiles,
    getMilestoneEvidence,
    downloadMilestoneEvidence,
    reviewMilestoneEvidence,
    verifyMilestonePassbook,
    getMilestoneReceipt,
    getRegionalAnalytics,
    getNonCompliantMilestones,
    getPendingComplianceMilestones
};
