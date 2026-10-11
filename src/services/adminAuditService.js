import axios from 'axios';

const API_URL = 'http://localhost:8080/api/admin/audit';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

export const fetchAuditLogs = async (filters, page = 0, size = 25) => {
    const params = new URLSearchParams();
    
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.actor) params.append('actor', filters.actor);
    if (filters.role) params.append('role', filters.role);
    if (filters.applicationId) params.append('applicationId', filters.applicationId);
    if (filters.success !== undefined && filters.success !== '') params.append('success', filters.success);
    if (filters.fromDate) params.append('from', filters.fromDate);
    if (filters.toDate) params.append('to', filters.toDate);
    
    params.append('page', page);
    params.append('size', size);

    try {
        const response = await axios.get(`${API_URL}?${params.toString()}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
