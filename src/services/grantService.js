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

export default {
    getPendingGrants,
    getGrantApplication,
    disburseGrant,
    getAllDisbursements,
    getSchemeFinanceSummary
};
