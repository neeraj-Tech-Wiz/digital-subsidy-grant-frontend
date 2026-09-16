import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

// Request interceptor to add JWT
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const verificationService = {
    getQueue: async () => {
        const response = await axiosInstance.get('/verifications/queue');
        return response.data;
    },
    getApplicationDetails: async (applicationId) => {
        const response = await axiosInstance.get(`/verifications/applications/${applicationId}`);
        return response.data;
    },
    verifyDocument: async (applicationId, documentId, action, remarks) => {
        const response = await axiosInstance.put(`/verifications/applications/${applicationId}/documents/${documentId}`, {
            action,
            remarks
        });
        return response.data;
    },
    verifyApplication: async (applicationId, approved, remarks) => {
        const response = await axiosInstance.put(`/verifications/${applicationId}`, {
            approved,
            remarks
        });
        return response.data;
    },
    verifyEligibility: async (applicationId, action, remarks) => {
        const response = await axiosInstance.put(`/verifications/applications/${applicationId}/eligibility`, {
            action,
            remarks
        });
        return response.data;
    },
    returnToApplicant: async (applicationId, remarks) => {
        const response = await axiosInstance.put(`/verifications/applications/${applicationId}/return-to-applicant`, {
            remarks
        });
        return response.data;
    }
};
