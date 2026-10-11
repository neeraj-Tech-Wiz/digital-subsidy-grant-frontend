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

  loginOtp: async (credentials) => {
    const response = await axiosInstance.post("/api/auth/login-otp", credentials);
    return response.data;
  },

  verifyOtp: async (payload) => {
    const response = await axiosInstance.post("/api/auth/verify-otp", payload);
    return response.data;
  },

  resendOtp: async (payload) => {
    const response = await axiosInstance.post("/api/auth/resend-otp", payload);
    return response.data;
  },

  verifyRegistrationOtp: async (payload) => {
    const response = await axiosInstance.post("/api/auth/verify-registration-otp", payload);
    return response.data;
  }
};
