import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const AUTH_PATHS = /\/auth\/(login|register|refresh|logout)$/;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthAttempt = originalRequest && AUTH_PATHS.test(originalRequest.url || '');

    if (error.response?.status === 401 && originalRequest && !isAuthAttempt) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          if (data?.data?.accessToken) {
            setAccessToken(data.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          clearAccessToken();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
