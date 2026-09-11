import axiosInstance from '../api/axiosInstance';

export const documentService = {
    uploadDocument: async (applicationId, documentType, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axiosInstance.post(
            `/api/documents/upload/${applicationId}/${documentType}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    getApplicationDocuments: async (applicationId) => {
        const response = await axiosInstance.get(`/api/documents/application/${applicationId}`);
        return response.data;
    }
};
