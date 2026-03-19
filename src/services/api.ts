import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sms-backend-d19v.onrender.com/api/v1';

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
  create: (data: { firstName: string; lastName: string; name?: string; email: string; password: string; role: string }) => {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const name = data.name?.trim() || `${firstName} ${lastName}`.trim();

    return apiClient.post('/users', {
      ...data,
      firstName,
      lastName,
      name,
    });
  },
  update: (id: string, data: { firstName?: string; lastName?: string; name?: string; email?: string; role?: string }) => {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    const computedName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return apiClient.put(`/users/${id}`, {
      ...data,
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(data.name?.trim() || computedName ? { name: data.name?.trim() || computedName } : {}),
    });
  },
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

// Academic Year API
export const academicYearApi = {
  getAll: (params?: { isActive?: boolean }) => apiClient.get('/academic-years', { params }),
  getCurrent: () => apiClient.get('/academic-years/current'),
  getById: (id: string) => apiClient.get(`/academic-years/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/academic-years', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/academic-years/${id}`, data),
  setCurrent: (id: string) => apiClient.put(`/academic-years/${id}/set-current`),
  addTerm: (id: string, data: Record<string, unknown>) => apiClient.post(`/academic-years/${id}/terms`, data),
  addHoliday: (id: string, data: Record<string, unknown>) => apiClient.post(`/academic-years/${id}/holidays`, data),
  delete: (id: string) => apiClient.delete(`/academic-years/${id}`),
};

// Class API
export const classApi = {
  getAll: () => apiClient.get('/classes'),
  create: (data: Record<string, unknown>) => apiClient.post('/classes', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/classes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/classes/${id}`),
};

// Section API
export const sectionApi = {
  getAll: () => apiClient.get('/sections'),
  getByClass: (classId: string) => apiClient.get(`/sections/class/${classId}`),
  create: (data: Record<string, unknown>) => apiClient.post('/sections', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/sections/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sections/${id}`),
};

// Admission API
export const admissionApi = {
  // Full admission
  create: (data: Record<string, unknown>) => apiClient.post('/admission', data),
  getAll: (params?: { page?: number; limit?: number; search?: string; classId?: string; sectionId?: string; academicYearId?: string }) =>
    apiClient.get('/admission', { params }),
  getById: (id: string) => apiClient.get(`/admission/${id}`),
  // Partial admission
  createPartial: (data: Record<string, unknown>) => apiClient.post('/admission/partial', data),
  getPartial: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/admission/partial', { params }),
  completePartial: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admission/${id}/complete`, data),
  // Form data
  getFormData: () => apiClient.get('/admission/form-data'),
  // Bulk
  bulkCreate: (data: Record<string, unknown>) => apiClient.post('/admission/bulk', data),
};

// Attendance API
export const attendanceApi = {
  mark: (data: Record<string, unknown>) => apiClient.post('/attendance', data),
  markBulk: (data: Record<string, unknown>) => apiClient.post('/attendance/bulk', data),
  getAll: (params?: Record<string, string>) => apiClient.get('/attendance', { params }),
  delete: (id: string) => apiClient.delete(`/attendance/${id}`),
  getByStudent: (studentId: string) => apiClient.get(`/attendance/student/${studentId}`),
  getReport: (params?: Record<string, string>) => apiClient.get('/attendance/report', { params }),
};

// Subject API
export const subjectApi = {
  getAll: () => apiClient.get('/subjects'),
  getByClass: (classId: string) => apiClient.get(`/subjects/class/${classId}`),
  getByTeacher: (teacherId: string) => apiClient.get(`/subjects/teacher/${teacherId}`),
  getOptional: (classId: string) => apiClient.get(`/subjects/optional/${classId}`),
  create: (data: Record<string, unknown>) => apiClient.post('/subjects', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/subjects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
  assignTeacher: (subjectId: string, data: { teacherId: string; role?: string }) => 
    apiClient.post(`/subjects/${subjectId}/assign-teacher`, data),
  removeTeacher: (subjectId: string, teacherId: string) => 
    apiClient.delete(`/subjects/${subjectId}/remove-teacher/${teacherId}`),
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

// Timetable API
export const timetableApi = {
  create: (data: Record<string, unknown>) => apiClient.post('/timetable', data),
  createBulk: (data: Record<string, unknown>) => apiClient.post('/timetable/bulk', data),
  getByClass: (classId: string, sectionId: string) => 
    apiClient.get(`/timetable/class/${classId}/section/${sectionId}`),
  getByTeacher: (teacherId: string) => apiClient.get(`/timetable/teacher/${teacherId}`),
  getWeekly: (classId: string, sectionId: string) => 
    apiClient.get(`/timetable/weekly/class/${classId}/section/${sectionId}`),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/timetable/${id}`, data),
  delete: (id: string) => apiClient.delete(`/timetable/${id}`),
};

// Academic Calendar API
export const academicCalendarApi = {
  getAll: () => apiClient.get('/academic-calendar'),
  getMonthly: (year: number, month: number) => 
    apiClient.get(`/academic-calendar/monthly/${year}/${month}`),
  getUpcoming: () => apiClient.get('/academic-calendar/upcoming'),
  getHolidays: (year: number) => apiClient.get(`/academic-calendar/holidays/${year}`),
  getExams: (year: number) => apiClient.get(`/academic-calendar/exams/${year}`),
  create: (data: Record<string, unknown>) => apiClient.post('/academic-calendar', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/academic-calendar/${id}`, data),
  delete: (id: string) => apiClient.delete(`/academic-calendar/${id}`),
};

// Roll Number API
export const rollNumberApi = {
  bulkAssign: (data: Record<string, unknown>) => apiClient.post('/roll-numbers/bulk-assign', data),
  reassign: (data: Record<string, unknown>) => apiClient.post('/roll-numbers/reassign', data),
  getByClass: (classId: string, sectionId: string) => 
    apiClient.get(`/roll-numbers/class/${classId}/section/${sectionId}`),
  autoAssignSession: (data: { academicYearId: string; classId?: string; sectionId?: string }) => 
    apiClient.post('/roll-numbers/auto-assign-session', data),
  validate: (data: Record<string, unknown>) => apiClient.post('/roll-numbers/validate', data),
};

// Academic Summary API
export const academicApi = {
  getSummary: () => apiClient.get('/academic/summary'),
  getClassStats: (classId: string) => apiClient.get(`/academic/class-stats/${classId}`),
  getEnrollmentTrends: () => apiClient.get('/academic/enrollment-trends'),
};
