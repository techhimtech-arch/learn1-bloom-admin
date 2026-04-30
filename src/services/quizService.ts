import apiClient from '@/pages/services/api';
import {
  Quiz,
  QuizCreateRequest,
  QuizWithStats,
  QuizResultsResponse,
  QuizLeaderboardResponse,
  SchoolLeaderboardEntry,
  StudentQuiz,
  QuizStartResponse,
  QuizAnswerRequest,
  QuizAnswerResponse,
  QuizSubmitResponse,
  QuizStudentResults,
  QuizHistoryEntry,
  QuizStatistics,
  AdminQuiz,
  QuizAnalytics,
  ApiResponse,
  PaginatedResponse,
  QuizFilters,
  QuizAnalyticsFilters
} from '@/types/quiz';

// TEACHER QUIZ APIS
export const teacherQuizService = {
  // Create Quiz
  createQuiz: async (quizData: QuizCreateRequest): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.post('/teacher/quizzes', quizData);
    return response.data;
  },

  // Get Teacher's Quizzes
  getQuizzes: async (filters: QuizFilters = {}): Promise<PaginatedResponse<Quiz>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/teacher/quizzes?${params}`);
    return response.data;
  },

  // Get Quiz Details
  getQuizDetails: async (quizId: string): Promise<ApiResponse<QuizWithStats>> => {
    const response = await apiClient.get(`/teacher/quizzes/${quizId}`);
    return response.data;
  },

  // Update Quiz
  updateQuiz: async (quizId: string, quizData: Partial<QuizCreateRequest>): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.put(`/teacher/quizzes/${quizId}`, quizData);
    return response.data;
  },

  // Publish Quiz
  publishQuiz: async (quizId: string): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.post(`/teacher/quizzes/${quizId}/publish`);
    return response.data;
  },

  // Delete Quiz
  deleteQuiz: async (quizId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/teacher/quizzes/${quizId}`);
    return response.data;
  },

  // Get Quiz Results
  getQuizResults: async (quizId: string, page = 1, limit = 50): Promise<ApiResponse<QuizResultsResponse>> => {
    const response = await apiClient.get(`/teacher/quizzes/${quizId}/results?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get Quiz Leaderboard
  getQuizLeaderboard: async (quizId: string, limit = 10): Promise<ApiResponse<QuizLeaderboardResponse>> => {
    const response = await apiClient.get(`/teacher/quizzes/${quizId}/leaderboard?limit=${limit}`);
    return response.data;
  },

  // Get School Leaderboard
  getSchoolLeaderboard: async (limit = 20): Promise<ApiResponse<SchoolLeaderboardEntry[]>> => {
    const response = await apiClient.get(`/teacher/leaderboard?limit=${limit}`);
    return response.data;
  },
};

// STUDENT QUIZ APIS
export const studentQuizService = {
  // Get Available Quizzes
  getAvailableQuizzes: async (page = 1, limit = 20): Promise<PaginatedResponse<StudentQuiz>> => {
    const response = await apiClient.get(`/student/quizzes?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Start Quiz
  startQuiz: async (quizId: string): Promise<ApiResponse<QuizStartResponse>> => {
    const response = await apiClient.post(`/student/quizzes/${quizId}/start`, {});
    return response.data;
  },

  // Submit Answer
  submitAnswer: async (quizId: string, answerData: QuizAnswerRequest): Promise<ApiResponse<QuizAnswerResponse>> => {
    const response = await apiClient.post(`/student/quizzes/${quizId}/answer`, answerData);
    return response.data;
  },

  // Submit Quiz
  submitQuiz: async (quizId: string): Promise<ApiResponse<QuizSubmitResponse>> => {
    const response = await apiClient.post(`/student/quizzes/${quizId}/submit`, {});
    return response.data;
  },

  // Get Quiz Results
  getQuizResults: async (quizId: string): Promise<ApiResponse<QuizStudentResults>> => {
    const response = await apiClient.get(`/student/quizzes/${quizId}/results`);
    return response.data;
  },

  // Get Quiz History
  getQuizHistory: async (page = 1, limit = 20): Promise<PaginatedResponse<QuizHistoryEntry>> => {
    const response = await apiClient.get(`/student/quizzes/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get Quiz Statistics
  getQuizStatistics: async (): Promise<ApiResponse<QuizStatistics>> => {
    const response = await apiClient.get('/student/quizzes/stats');
    return response.data;
  },
};

// ADMIN QUIZ APIS
export const adminQuizService = {
  // Get All School Quizzes (using teacher endpoint)
  getAllQuizzes: async (filters: QuizFilters = {}): Promise<PaginatedResponse<AdminQuiz>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/teacher/quizzes?${params}`);
    return response.data;
  },

  // Create Quiz (Admin using teacher endpoint)
  createQuiz: async (quizData: QuizCreateRequest): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.post('/teacher/quizzes', quizData);
    return response.data;
  },

  // Publish Quiz (Admin using teacher endpoint)
  publishQuiz: async (quizId: string): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.post(`/teacher/quizzes/${quizId}/publish`);
    return response.data;
  },

  // Get School Quiz Analytics
  getQuizAnalytics: async (filters: QuizAnalyticsFilters = {}): Promise<ApiResponse<QuizAnalytics>> => {
    const toNumber = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/admin/quizzes/analytics?${params}`);

    const payload = response.data as ApiResponse<any>;
    if (payload?.data) {
      const a = payload.data;
      payload.data = {
        ...a,
        totalQuizzes: toNumber(a.totalQuizzes),
        activeQuizzes: toNumber(a.activeQuizzes),
        totalSubmissions: toNumber(a.totalSubmissions),
        averageParticipation: toNumber(a.averageParticipation),
        topSubjects: (a.topSubjects || []).map((s: any) => ({
          ...s,
          quizCount: toNumber(s.quizCount),
          totalSubmissions: toNumber(s.totalSubmissions),
        })),
        topPerformers: (a.topPerformers || []).map((p: any) => ({
          ...p,
          averageScore: toNumber(p.averageScore),
          totalQuizzes: toNumber(p.totalQuizzes),
        })),
        participationByClass: (a.participationByClass || []).map((c: any) => ({
          ...c,
          totalStudents: toNumber(c.totalStudents),
          participatedStudents: toNumber(c.participatedStudents),
          participationRate: toNumber(c.participationRate),
        })),
      } satisfies QuizAnalytics;
    }

    return payload as ApiResponse<QuizAnalytics>;
  },

  // Unpublish/close endpoints are backend-dependent; add when available.

  // Delete Quiz (Admin)
  deleteQuiz: async (quizId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/quizzes/${quizId}`);
    return response.data;
  },
};

// Utility functions for quiz management
export const quizUtils = {
  // Calculate grade based on percentage
  calculateGrade: (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  },

  // Format time remaining
  formatTimeRemaining: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  // Check if quiz is active
  isQuizActive: (quiz: Quiz): boolean => {
    const now = new Date();
    const startTime = new Date(quiz.startsAt);
    const endTime = new Date(quiz.endsAt);
    return quiz.status === 'PUBLISHED' || quiz.status === 'ACTIVE' && 
           now >= startTime && now <= endTime;
  },

  // Check if student can retake quiz
  canRetakeQuiz: (quiz: StudentQuiz): boolean => {
    return quiz.canRetake && quiz.nextAttemptAvailable && quiz.attempts < quiz.maxAttempts;
  },

  // Format quiz status
  formatQuizStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Draft',
      'PUBLISHED': 'Published',
      'ACTIVE': 'Active',
      'ENDED': 'Ended',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  // Format quiz type
  formatQuizType: (type: string): string => {
    const typeMap: Record<string, string> = {
      'MCQ': 'Multiple Choice',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer',
      'MIXED': 'Mixed Type'
    };
    return typeMap[type] || type;
  }
};

export default {
  teacher: teacherQuizService,
  student: studentQuizService,
  admin: adminQuizService,
  utils: quizUtils
};
