import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
});

let refreshPromise = null;

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = API.post('/auth/refresh', {}, { withCredentials: true })
            .finally(() => { refreshPromise = null; });
        }
        const { data } = await refreshPromise;
        localStorage.setItem('fc_token', data.token);
        API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        return API(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);