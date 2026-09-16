import axiosInstance from '../api/axiosInstance';

export const applicationService = {
    applyForScheme: async (schemeId, eligibilityData) => {
        const response = await axiosInstance.post(
            `/api/applications/apply/${schemeId}`,
            { eligibilityData }
        );
        return response.data;
    },

    submitDocuments: async (applicationId) => {
        const response = await axiosInstance.post(
            `/api/applications/submit-documents/${applicationId}`
        );
        return response.data;
    },

    getMyApplications: async () => {
        const response = await axiosInstance.get('/api/applications/my-applications');
        return response.data;
    },

    getApplicationAnswers: async (applicationId) => {
        const response = await axiosInstance.get(`/api/applications/${applicationId}/answers`);
        return response.data;
    },

    resubmitApplication: async (applicationId, eligibilityData) => {
        const response = await axiosInstance.put(
            `/api/applications/${applicationId}/resubmit`,
            { eligibilityData }
        );
        return response.data;
    },

    getApplicationHistory: async (applicationId) => {
        const response = await axiosInstance.get(`/api/applications/${applicationId}/history`);
        return response.data;
    },

    getApplicationGrant: async (applicationId) => {
        const response = await axiosInstance.get(`/api/applications/${applicationId}/grant`);
        return response.data;
    },

    getMyGrants: async () => {
        const response = await axiosInstance.get('/api/applications/my-applications/grants');
        return response.data;
    }
};
