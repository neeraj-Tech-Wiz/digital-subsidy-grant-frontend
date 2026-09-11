import axiosInstance from "../api/axiosInstance";

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post("/api/auth/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post("/api/auth/register", userData);
    return response.data;
  },
};
