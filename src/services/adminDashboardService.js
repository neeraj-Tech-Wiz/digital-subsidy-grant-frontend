import axios from 'axios';
import { API_BASE_URL } from '../api/axiosInstance';

const API_URL = `${API_BASE_URL}/api/admin/dashboard/stats`;

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
