import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = data.data?.tokens?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            if (data.data?.tokens?.refreshToken) {
              localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: {
    schoolName: string;
    schoolEmail: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => apiClient.post('/auth/register', data),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiClient.post('/auth/logout', { refreshToken });
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard'),
};

// User API
export const userApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get('/users', { params }),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  getStats: () => apiClient.get('/users/stats'),
  create: (data: { firstName: string; lastName: string; name?: string; email: string; password: string; role: string }) =>
    apiClient.post('/users', data),
  update: (id: string, data: { firstName?: string; lastName?: string; email?: string; role?: string }) =>
    apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

// Class API
export const classApi = {
  getAll: () => apiClient.get('/classes'),
  create: (data: Record<string, unknown>) => apiClient.post('/classes', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/classes/${id}`, data),
  getSections: () => apiClient.get('/sections'),
  createSection: (data: Record<string, unknown>) => apiClient.post('/sections', data),
};

// Admission API
export const admissionApi = {
  create: (data: Record<string, unknown>) => apiClient.post('/admission', data),
  bulkCreate: (data: Record<string, unknown>) => apiClient.post('/admission/bulk', data),
  getPending: () => apiClient.get('/admission/pending'),
  approve: (id: string) => apiClient.put(`/admission/${id}/approve`),
};

// Attendance API
export const attendanceApi = {
  mark: (data: Record<string, unknown>) => apiClient.post('/attendance/mark', data),
  getByClass: (classId: string, params?: Record<string, string>) =>
    apiClient.get(`/attendance/class/${classId}`, { params }),
  getByStudent: (studentId: string) => apiClient.get(`/attendance/student/${studentId}`),
  getReport: (params?: Record<string, string>) => apiClient.get('/attendance/report', { params }),
};

// Subject API
export const subjectApi = {
  getAll: () => apiClient.get('/subjects'),
  create: (data: Record<string, unknown>) => apiClient.post('/subjects', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/subjects/${id}`, data),
};

// Fee API
export const feeApi = {
  getStructure: () => apiClient.get('/fees/structure'),
  createStructure: (data: Record<string, unknown>) => apiClient.post('/fees/structure', data),
  getByStudent: (studentId: string) => apiClient.get(`/fees/student/${studentId}`),
  recordPayment: (data: Record<string, unknown>) => apiClient.post('/fees/payment', data),
  getReport: (params?: Record<string, string>) => apiClient.get('/fees/report', { params }),
};

// Exam API
export const examApi = {
  getAll: () => apiClient.get('/results/exams'),
  create: (data: Record<string, unknown>) => apiClient.post('/results/exams', data),
  enterResults: (data: Record<string, unknown>) => apiClient.post('/results/enter', data),
  getStudentResults: (studentId: string) => apiClient.get(`/results/student/${studentId}`),
  getClassResults: (classId: string) => apiClient.get(`/results/class/${classId}`),
};

// Announcement API
export const announcementApi = {
  getAll: () => apiClient.get('/announcements'),
  create: (data: Record<string, unknown>) => apiClient.post('/announcements', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/announcements/${id}`, data),
  delete: (id: string) => apiClient.delete(`/announcements/${id}`),
};

// Reports API
export const reportApi = {
  attendance: (params?: Record<string, string>) => apiClient.get('/reports/attendance', { params }),
  fees: (params?: Record<string, string>) => apiClient.get('/reports/fees', { params }),
  exams: (params?: Record<string, string>) => apiClient.get('/reports/exams', { params }),
  students: (params?: Record<string, string>) => apiClient.get('/reports/students', { params }),
};
