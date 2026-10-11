import axios from "axios";
import { getAuthToken, clearAuthStorage } from "../utils/authStorage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://digital-subsidy-grant-backend.onrender.com"
    : "http://localhost:8080");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiry generically
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login on 401 Unauthorized
      clearAuthStorage();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
