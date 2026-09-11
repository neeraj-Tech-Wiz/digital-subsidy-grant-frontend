import axiosInstance from '../api/axiosInstance';

export const schemeService = {
    getActiveSchemes: async () => {
        const response = await axiosInstance.get('/api/schemes/active');
        return response.data;
    },

    getSchemeById: async (id) => {
        const response = await axiosInstance.get(`/api/schemes/${id}`);
        return response.data;
    },

    getSchemeCriteria: async (id, activeOnly = true) => {
        const response = await axiosInstance.get(`/api/schemes/${id}/criteria`, {
            params: { activeOnly }
        });
        return response.data;
    }
};
