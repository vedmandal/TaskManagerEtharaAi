import axios from 'axios';

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  if (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return 'http://localhost:5000/api';
  }

  return '/api';
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (token expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup');
    const hasStoredToken = Boolean(localStorage.getItem('token'));

    if (error.response?.status === 401 && hasStoredToken && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────
export const loginUser = (data) => API.post('/auth/login', data);
export const signupUser = (data) => API.post('/auth/signup', data);
export const getMe = () => API.get('/auth/me');
export const getAllUsers = () => API.get('/auth/users');

// ── Projects ──────────────────────────────────────
export const getProjects = () => API.get('/projects');
export const getProjectById = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post('/projects', data);
export const updateProjectMembers = (id, data) => API.put(`/projects/${id}/members`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

// ── Tasks ─────────────────────────────────────────
export const getTasks = (projectId) =>
  API.get('/tasks', { params: projectId ? { project: projectId } : {} });
export const getTaskById = (id) => API.get(`/tasks/${id}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const getDashboardStats = () => API.get('/tasks/dashboard');
