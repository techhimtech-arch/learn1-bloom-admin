import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sms-backend-d19v.onrender.com/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
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
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const newAccessToken = data.data?.accessToken || data.data?.tokens?.accessToken;
          if (newAccessToken) {
            localStorage.setItem("accessToken", newAccessToken);
            const newRefresh = data.data?.refreshToken || data.data?.tokens?.refreshToken;
            if (newRefresh) {
              localStorage.setItem("refreshToken", newRefresh);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    // Handle 403 forbidden
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || "Access forbidden";
      if (msg.toLowerCase().includes("permission")) {
        window.location.href = "/unauthorized";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// ── Auth API ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => apiClient.post("/auth/login", { email, password }),
  register: (data: {
    schoolName: string;
    schoolEmail: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => apiClient.post("/auth/register", data),
  logout: () => {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiClient.post("/auth/logout", { refreshToken });
  },
  logoutAll: () => apiClient.post("/auth/logout-all"),
  refreshToken: () => {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiClient.post("/auth/refresh-token", { refreshToken });
  },
  getSessions: () => apiClient.get("/auth/sessions"),
  revokeSession: (sessionId: string) => apiClient.delete(`/auth/sessions/${sessionId}`),
  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    apiClient.post("/auth/reset-password", data),
};

// ── Dashboard API ─────────────────────────────────────────
export const dashboardApi = {
  getStats: () => apiClient.get("/dashboard"),
  getTeacherStats: () => apiClient.get("/teacher/dashboard"),
  getParentStats: () => apiClient.get("/parent/dashboard"),
  getStudentStats: () => apiClient.get("/student/dashboard"),
  getAccountantStats: () => apiClient.get("/accountant/dashboard"),
  getRecentActivities: (limit?: number) => apiClient.get("/dashboard/recent-activities", { params: { limit } }),
  getAttendanceAnalytics: (months?: number) => apiClient.get("/dashboard/attendance-analytics", { params: { months } }),
  getFeeAnalytics: (months?: number) => apiClient.get("/dashboard/fee-analytics", { params: { months } }),
  getAcademicSummary: () => apiClient.get("/dashboard/academic-summary"),
};

// ── User API ──────────────────────────────────────────────
export const userApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string; sort?: string }) =>
    apiClient.get("/users", { params }),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  getStats: () => apiClient.get("/users/stats"),
  getMe: () => apiClient.get("/users/me"),
  updateMe: (data: Record<string, unknown>) => apiClient.patch("/users/me", data),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.patch("/users/change-password", data),
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    return apiClient.post("/users/profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  create: (data: {
    firstName: string;
    lastName: string;
    name?: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const name = data.name?.trim() || `${firstName} ${lastName}`.trim();
    return apiClient.post("/users", { ...data, firstName, lastName, name });
  },
  update: (
    id: string,
    data: { firstName?: string; lastName?: string; name?: string; email?: string; role?: string },
  ) => {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    const computedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return apiClient.put(`/users/${id}`, {
      ...data,
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(data.name?.trim() || computedName ? { name: data.name?.trim() || computedName } : {}),
    });
  },
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  adminResetPassword: (userId: string, newPassword: string) =>
    apiClient.patch(`/users/${userId}/reset-password`, { newPassword }),
};

// ── School API ────────────────────────────────────────────
export const schoolApi = {
  getAll: () => apiClient.get("/school"),
  getById: (id: string) => apiClient.get(`/school/${id}`),
};

// ── Academic Year API ─────────────────────────────────────
export const academicYearApi = {
  getAll: (params?: { isActive?: boolean }) => apiClient.get("/academic-years", { params }),
  getCurrent: () => apiClient.get("/academic-years/current"),
  getById: (id: string) => apiClient.get(`/academic-years/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/academic-years", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/academic-years/${id}`, data),
  setCurrent: (id: string) => apiClient.put(`/academic-years/${id}/set-current`),
  addTerm: (id: string, data: Record<string, unknown>) => apiClient.post(`/academic-years/${id}/terms`, data),
  addHoliday: (id: string, data: Record<string, unknown>) => apiClient.post(`/academic-years/${id}/holidays`, data),
  delete: (id: string) => apiClient.delete(`/academic-years/${id}`),
};

// ── Class API ─────────────────────────────────────────────
export const classApi = {
  getAll: () => apiClient.get("/classes"),
  create: (data: Record<string, unknown>) => apiClient.post("/classes", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/classes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/classes/${id}`),
};

// ── Section API ───────────────────────────────────────────
export const sectionApi = {
  getAll: () => apiClient.get("/sections"),
  getByClass: (classId: string) => apiClient.get(`/sections/class/${classId}`),
  create: (data: Record<string, unknown>) => apiClient.post("/sections", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/sections/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sections/${id}`),
};

// ── Admission API ─────────────────────────────────────────
export const admissionApi = {
  create: (data: Record<string, unknown>) => apiClient.post("/admission", data),
  getAll: (params?: {
    page?: number; limit?: number; search?: string;
    classId?: string; sectionId?: string; academicYearId?: string;
  }) => apiClient.get("/admission", { params }),
  getById: (id: string) => apiClient.get(`/admission/${id}`),
  createPartial: (data: Record<string, unknown>) => apiClient.post("/admission/partial", data),
  getPartial: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/admission/partial", { params }),
  completePartial: (id: string, data: Record<string, unknown>) => apiClient.put(`/admission/${id}/complete`, data),
  getFormData: () => apiClient.get("/admission/form-data"),
  bulkCreate: (data: Record<string, unknown>) => apiClient.post("/admission/bulk", data),
};

// ── Attendance API ────────────────────────────────────────
export const attendanceApi = {
  mark: (data: Record<string, unknown>) => apiClient.post("/attendance", data),
  markBulk: (data: Record<string, unknown>) => apiClient.post("/attendance/bulk", data),
  getAll: (params?: Record<string, string>) => apiClient.get("/attendance", { params }),
  delete: (id: string) => apiClient.delete(`/attendance/${id}`),
  getByStudent: (studentId: string) => apiClient.get(`/attendance/student/${studentId}`),
  getReport: (params?: Record<string, string>) => apiClient.get("/attendance/report", { params }),
};

// Subject API
export const subjectApi = {
  getAll: () => apiClient.get('/subjects'),
  getByClass: (classId: string) => apiClient.get(`/subjects/class/${classId}`),
  getByTeacher: (teacherId: string) => apiClient.get(`/subjects/teacher/${teacherId}`),
  getOptional: (classId: string) => apiClient.get(`/subjects/optional/${classId}`),
  create: (data: Record<string, unknown>) => apiClient.post('/subjects', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/subjects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
  assignTeacher: (subjectId: string, data: { teacherId: string; role?: string }) => 
    apiClient.post(`/subjects/${subjectId}/assign-teacher`, data),
  removeTeacher: (subjectId: string, teacherId: string) => 
    apiClient.delete(`/subjects/${subjectId}/remove-teacher/${teacherId}`),
};

// Fee API
export const feeApi = {
  // Fee Structure
  getStructure: () => apiClient.get("/fees/structure"),
  createStructure: (data: Record<string, unknown>) => apiClient.post("/fees/structure", data),
  updateStructure: (data: Record<string, unknown>) => apiClient.put("/fees/structure", data),
  deleteStructure: (id: string) => apiClient.delete(`/fees/structure/${id}`),
  
  // Student Fees
  generateStudentFees: (data: Record<string, unknown>) => apiClient.post("/fees/generate-student-fees", data),
  getStudentFees: (studentId: string) => apiClient.get(`/fees/student/${studentId}`),
  
  // Payments
  pay: (data: Record<string, unknown>) => apiClient.post("/fees/pay", data),
  getPayments: (params?: Record<string, any>) => apiClient.get("/fees/payments", { params }),
  getReceipt: (paymentId: string) => apiClient.get(`/fees/receipt/${paymentId}`),
  
  // Dues
  getDues: (params?: Record<string, any>) => apiClient.get("/fees/dues", { params }),
  
  // Legacy endpoints (keep for backward compatibility)
  getByStudent: (studentId: string) => apiClient.get(`/fees/student/${studentId}`),
  recordPayment: (data: Record<string, unknown>) => apiClient.post("/fees/payment", data),
  getReport: (params?: Record<string, string>) => apiClient.get("/fees/report", { params }),
};

// ── Exam API ──────────────────────────────────────────────
export const examApi = {
  // Exam Management
  getAll: (params?: Record<string, any>) => apiClient.get("/exams", { params }),
  getById: (id: string) => apiClient.get(`/exams/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post("/exams", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/exams/${id}`, data),
  delete: (id: string) => apiClient.delete(`/exams/${id}`),
  
  // Exam Subject Papers
  getPapers: (examId: string) => apiClient.get(`/exams/${examId}/papers`),
  getPaper: (examId: string, paperId: string) => apiClient.get(`/exams/${examId}/papers/${paperId}`),
  createPaper: (examId: string, data: Record<string, unknown>) => apiClient.post(`/exams/${examId}/papers`, data),
  updatePaper: (examId: string, paperId: string, data: Record<string, unknown>) => apiClient.put(`/exams/${examId}/papers/${paperId}`, data),
  deletePaper: (examId: string, paperId: string) => apiClient.delete(`/exams/${examId}/papers/${paperId}`),
  
  // Marks Entry
  getMarks: (examId: string, params?: Record<string, any>) => apiClient.get(`/exams/${examId}/marks`, { params }),
  createMarks: (examId: string, data: Record<string, unknown>) => apiClient.post(`/exams/${examId}/marks`, data),
  updateMarks: (examId: string, markId: string, data: Record<string, unknown>) => apiClient.put(`/exams/${examId}/marks/${markId}`, data),
  lockMarks: (examId: string) => apiClient.post(`/exams/${examId}/marks/lock`),
  unlockMarks: (examId: string) => apiClient.post(`/exams/${examId}/marks/unlock`),
  
  // Results
  getResults: (examId: string, params?: Record<string, any>) => apiClient.get(`/exams/${examId}/results`, { params }),
  getStudentResults: (studentId: string, params?: Record<string, any>) => apiClient.get(`/results/student/${studentId}`, { params }),
  getClassResults: (classId: string, params?: Record<string, any>) => apiClient.get(`/results/class/${classId}`, { params }),
  
  // Publish Control
  publishResults: (examId: string) => apiClient.post(`/exams/${examId}/publish`),
  unpublishResults: (examId: string) => apiClient.post(`/exams/${examId}/unpublish`),
  
  // Legacy endpoints (keep for backward compatibility)
  enterResults: (data: Record<string, unknown>) => apiClient.post("/results/enter", data),
};

// ── Announcement API ──────────────────────────────────────
export const announcementApi = {
  getAll: (params?: Record<string, any>) => apiClient.get("/announcements", { params }),
  getById: (id: string) => apiClient.get(`/announcements/${id}`),
create: (data: FormData | Record<string, unknown>) => apiClient.post("/announcements", data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  }),
  update: (id: string, data: FormData | Record<string, unknown>) => apiClient.put(`/announcements/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  }),
  delete: (id: string) => apiClient.delete(`/announcements/${id}`),
  publish: (id: string) => apiClient.post(`/announcements/${id}/publish`),
  unpublish: (id: string) => apiClient.post(`/announcements/${id}/unpublish`),
};

// ── Reports API ───────────────────────────────────────────
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
  create: (data: Record<string, unknown>) => apiClient.post("/academic-calendar", data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/academic-calendar/${id}`, data),
  delete: (id: string) => apiClient.delete(`/academic-calendar/${id}`),
};

// ── Assignment API ───────────────────────────────────────
export const assignmentApi = {
  getAll: (params?: Record<string, any>) => apiClient.get("/assignments", { params }),
  getById: (id: string) => apiClient.get(`/assignments/${id}`),
  create: (data: Record<string, unknown> | FormData) => apiClient.post("/assignments", data),
  update: (id: string, data: Record<string, unknown> | FormData) => apiClient.put(`/assignments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/assignments/${id}`),
  publish: (id: string) => apiClient.post(`/assignments/${id}/publish`),
  submit: (id: string, data: Record<string, unknown> | FormData) => apiClient.post(`/assignments/${id}/submit`, data),
  getSubmissions: (id: string) => apiClient.get(`/assignments/${id}/submissions`),
  grade: (id: string, data: Record<string, unknown>) => apiClient.post(`/assignments/${id}/grade`, data),
};

// ── Notification API ─────────────────────────────────────
export const notificationApi = {
  getAll: (params?: Record<string, any>) => apiClient.get("/notifications", { params }),
  markRead: (id: string) => apiClient.post(`/notifications/mark-read/${id}`),
  markAllRead: () => apiClient.post("/notifications/mark-all-read"),
};

// ── Parent Portal API ───────────────────────────────────
export const parentApi = {
  // Dashboard APIs
  getDashboard: () => apiClient.get("/parent/dashboard"),
  getStudents: () => apiClient.get("/parent/students"),
  getProfile: () => apiClient.get("/parent/profile"),
  
  // Get specific student details (for header info)
  getStudent: (studentId: string) => apiClient.get(`/parent/student/${studentId}`),
  
  // Child-specific data endpoints (with hasAccess verification)
  getChildAttendance: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/children/${studentId}/attendance`, { params }),
  getChildFees: (studentId: string) => 
    apiClient.get(`/parent/children/${studentId}/fees`),
  getChildResults: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/children/${studentId}/results`, { params }),
  getChildAnnouncements: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/children/${studentId}/announcements`, { params }),
  getChildTimetable: (studentId: string) => 
    apiClient.get(`/parent/children/${studentId}/timetable`),
  
  // Legacy endpoints (deprecated but keeping for compatibility)
  getAttendance: (params?: Record<string, any>) => apiClient.get("/parent/attendance", { params }),
  getFees: () => apiClient.get("/parent/fees"),
  getResults: (params?: Record<string, any>) => apiClient.get("/parent/results", { params }),
  getStudentAttendance: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/student/${studentId}/attendance`, { params }),
  getStudentResults: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/student/${studentId}/results`, { params }),
  getStudentAssignments: (studentId: string, params?: Record<string, any>) => 
    apiClient.get(`/parent/student/${studentId}/assignments`, { params }),
  getStudentFees: (studentId: string) => apiClient.get(`/parent/student/${studentId}/fees`),
};

// ── Teacher Portal API ─────────────────────────────────────
export const teacherApi = {
  // Dashboard & Profile
  getDashboard: () => apiClient.get("/teacher/dashboard"),
  getProfile: () => apiClient.get("/teacher/profile"),
  
  // Classes & Students
  getClasses: (params?: Record<string, any>) => apiClient.get("/teacher/classes", { params }),
  getStudents: (params?: Record<string, any>) => apiClient.get("/teacher/students", { params }),
  
  // Attendance Management
  getAttendance: (params?: Record<string, any>) => apiClient.get("/teacher/attendance", { params }),
  markAttendance: (data: Record<string, unknown>) => apiClient.post("/teacher/attendance/mark", data),
  updateAttendance: (data: Record<string, unknown>) => apiClient.put("/teacher/attendance/update", data),
  
  // Profile Management
  updateProfile: (data: Record<string, unknown>) => apiClient.patch("/teacher/profile", data),
  
  // Assignments
  getAssignments: (params?: Record<string, any>) => apiClient.get("/teacher/assignments", { params }),
  createAssignment: (data: Record<string, unknown>) => apiClient.post("/teacher/assignments", data),
  getAssignmentSubmissions: (assignmentId: string) => apiClient.get(`/teacher/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId: string, data: Record<string, unknown>) => apiClient.post(`/teacher/assignments/${submissionId}/grade`, data),
  
  // Exams & Results
  getExams: (params?: Record<string, any>) => apiClient.get("/teacher/exams", { params }),
  createExam: (data: Record<string, unknown>) => apiClient.post("/teacher/exams", data),
  updateExam: (examId: string, data: Record<string, unknown>) => apiClient.put(`/teacher/exams/${examId}`, data),
  getResults: (params?: Record<string, any>) => apiClient.get("/teacher/results", { params }),
  addResults: (data: Record<string, unknown>) => apiClient.post("/teacher/results/add", data),
  updateResults: (data: Record<string, unknown>) => apiClient.put("/teacher/results/update", data),
};

// ── Student API ─────────────────────────────────────────
export const studentApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; classId?: string; sectionId?: string }) =>
    apiClient.get('/students', { params }),
  getById: (id: string) => apiClient.get(`/students/${id}`),
  getByClass: (classId: string, sectionId?: string) => 
    apiClient.get(`/students/class/${classId}${sectionId ? `?sectionId=${sectionId}` : ''}`),
};

// ── Certificate API ─────────────────────────────────────
export const certificateApi = {
  getAll: (params?: Record<string, any>) => apiClient.get("/certificates", { params }),
  generate: (data: Record<string, unknown>) => apiClient.post("/certificates/generate", data),
  getStudentCertificates: (studentId: string) => apiClient.get(`/certificates/student/${studentId}`),
  getById: (id: string) => apiClient.get(`/certificates/${id}`),
  delete: (id: string) => apiClient.delete(`/certificates/${id}`),
};

// ── Student Utility API (Student Portal) ─────────────────────────────────────
export const studentPortalApi = {
  // Dashboard
  getDashboard: () => apiClient.get("/students/dashboard"),

  // Attendance
  getAttendance: () => apiClient.get("/students/attendance"),

  // Exam Results
  getExamResults: () => apiClient.get("/students/exam-results"),

  // Fees
  getFees: () => apiClient.get("/students/fees"),

  // Study Materials
  getStudyMaterials: () => apiClient.get("/students/study-materials"),

  // Assignments
  getAssignments: () => apiClient.get("/students/assignments"),

  // Announcements
  getAnnouncements: () => apiClient.get("/students/announcements"),

  // Timetable
  getTimetable: () => apiClient.get("/students/timetable"),

  // Certificates
  getCertificates: () => apiClient.get("/students/certificates"),
};

// ── Enrollment API ──────────────────────────────────────
export const enrollmentApi = {
  // Get class enrollments
  getClassEnrollments: (params: { academicYearId: string; classId: string; sectionId: string }) =>
    apiClient.get("/enrollments/class", { params }),

  // Get current enrollment for a student
  getCurrentEnrollment: (studentId: string) =>
    apiClient.get(`/enrollments/student/${studentId}/current`),

  // Get enrollment history for a student
  getEnrollmentHistory: (studentId: string) =>
    apiClient.get(`/enrollments/student/${studentId}/history`),

  // Create new enrollment
  create: (data: {
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    schoolId: string;
    rollNumber: string;
  }) => apiClient.post("/enrollments", data),

  // Promote student
  promote: (data: {
    studentId: string;
    currentEnrollmentId: string;
    newClassId: string;
    newSectionId: string;
    newRollNumber: string;
  }) => apiClient.post("/enrollments/promote", data),

  // Bulk enroll students
  bulkEnroll: (data: { enrollments: Array<{
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    schoolId: string;
    rollNumber: string;
  }> }) => apiClient.post("/enrollments/bulk", data),
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
  getSummary: (academicSessionId: string) => apiClient.get('/academic/summary', { params: { academicSessionId } }),
  getClassStats: (classId: string, academicSessionId: string) => apiClient.get(`/academic/class-stats/${classId}`, { params: { academicSessionId } }),
  getEnrollmentTrends: (academicSessionId: string, years?: number) => apiClient.get('/academic/enrollment-trends', { params: { academicSessionId, years } }),
};

// Teacher Assignment API
export const teacherAssignmentApi = {
  getAll: (params?: Record<string, any>) => apiClient.get('/teacher-assignments', { params }),
  create: (data: Record<string, unknown>) => apiClient.post('/teacher-assignments', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/teacher-assignments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/teacher-assignments/${id}`),
};

// Class Teacher Assignment API
export const classTeacherAssignmentApi = {
  getAll: (params?: Record<string, any>) => apiClient.get('/class-teacher', { params }),
  create: (data: Record<string, unknown>) => apiClient.post('/class-teacher/assign', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/class-teacher/${id}`, data),
  delete: (id: string) => apiClient.delete(`/class-teacher/${id}`),
};
