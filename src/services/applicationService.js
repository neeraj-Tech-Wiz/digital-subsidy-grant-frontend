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
    }
};
