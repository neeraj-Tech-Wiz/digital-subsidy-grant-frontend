import axiosInstance from '../api/axiosInstance';

export const beneficiaryService = {
    getMyProfile: async () => {
        const response = await axiosInstance.get('/api/beneficiaries/me');
        return response.data;
    },
    
    createProfile: async (profileData) => {
        const response = await axiosInstance.post('/api/beneficiaries/profile', profileData);
        return response.data;
    }
};
