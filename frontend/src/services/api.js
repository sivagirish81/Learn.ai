import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message;
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const loginUser = (data) => api.post('/api/auth/login', data);
export const registerUser = (data) => api.post('/api/auth/register', data);
export const updateProfile = (data) => api.put('/api/auth/profile', data);

// Resource API
export const searchResources = (params) => api.get('/api/search', { params });
export const getResource = (id) => api.get(`/api/resources/${id}`);
export const submitResource = (data) => api.post('/api/resources', data);
export const updateResource = (id, data) => api.put(`/api/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/api/resources/${id}`);
export const getPendingResources = (page = 1, size = 10) => 
  api.get('/api/resources/pending', { params: { page, size } });
export const approveResource = (id, data) => 
  api.post(`/api/resources/${id}/approve`, data);
export const rejectResource = (id, data) => 
  api.post(`/api/resources/${id}/reject`, data);

// Bookmark API
export const getBookmarks = () => api.get('/api/bookmarks');
export const addBookmark = (resourceId) => 
  api.post(`/api/bookmarks/${resourceId}`);
export const removeBookmark = (resourceId) => 
  api.delete(`/api/bookmarks/${resourceId}`);

// Chatbot API
export const sendChatMessage = (message) => 
  api.post('/api/chat', { message });
export const clearChatHistory = () => 
  api.post('/api/chat/clear');

export default api; 