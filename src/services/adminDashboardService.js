import axios from 'axios';

const API_URL = 'http://localhost:8080/api/admin/dashboard/stats';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const fetchAdminDashboardStats = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching admin stats", error);
        throw error;
    }
};
