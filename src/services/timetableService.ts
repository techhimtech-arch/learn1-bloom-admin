import apiClient from '@/pages/services/api';
import {
  TimetableEntry,
  TimetableCreateRequest,
  TimetableBulkCreateRequest,
  TimetableUpdateRequest,
  WeeklyTimetable,
  ApiResponse,
  PaginatedResponse,
  TimetableFilters,
  Subject,
  Teacher,
  Class,
  Section,
  AcademicSession
} from '@/types/timetable';

// ADMIN TIMETABLE APIS
export const adminTimetableService = {
  // Create single timetable entry
  createTimetable: async (timetableData: TimetableCreateRequest): Promise<ApiResponse<TimetableEntry>> => {
    const response = await apiClient.post('/api/v1/timetable', timetableData);
    return response.data;
  },

  // Create multiple timetable entries (bulk)
  createBulkTimetable: async (bulkData: TimetableBulkCreateRequest): Promise<ApiResponse<TimetableEntry[]>> => {
    const response = await apiClient.post('/api/v1/timetable/bulk', bulkData);
    return response.data;
  },

  // Update timetable entry
  updateTimetable: async (timetableId: string, updateData: TimetableUpdateRequest): Promise<ApiResponse<TimetableEntry>> => {
    const response = await apiClient.put(`/api/v1/timetable/${timetableId}`, updateData);
    return response.data;
  },

  // Delete timetable entry
  deleteTimetable: async (timetableId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/api/v1/timetable/${timetableId}`);
    return response.data;
  },

  // Delete all timetable entries for a class/section/session
  deleteClassTimetable: async (classId: string, sectionId: string, academicSessionId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/api/v1/timetable/class/${classId}/section/${sectionId}/session/${academicSessionId}`);
    return response.data;
  },

  // Get class timetable (for admin overview)
  getClassTimetable: async (classId: string, sectionId: string, academicSessionId: string): Promise<ApiResponse<TimetableEntry[]>> => {
    const response = await apiClient.get(`/api/v1/timetable/class/${classId}/section/${sectionId}?academicSessionId=${academicSessionId}`);
    return response.data;
  },

  // Get weekly timetable (grid format)
  getWeeklyTimetable: async (classId: string, sectionId: string, academicSessionId: string): Promise<ApiResponse<WeeklyTimetable>> => {
    const response = await apiClient.get(`/api/v1/timetable/weekly/class/${classId}/section/${sectionId}?academicSessionId=${academicSessionId}`);
    return response.data;
  },

  // Get teacher timetable (for admin overview)
  getTeacherTimetable: async (teacherId: string, academicSessionId: string, day?: string): Promise<ApiResponse<TimetableEntry[]>> => {
    const url = day 
      ? `/api/v1/timetable/teacher/${teacherId}?academicSessionId=${academicSessionId}&day=${day}`
      : `/api/v1/timetable/teacher/${teacherId}?academicSessionId=${academicSessionId}`;
    const response = await apiClient.get(url);
    return response.data;
  }
};

// TEACHER TIMETABLE APIS
export const teacherTimetableService = {
  // Get own timetable
  getOwnTimetable: async (academicSessionId: string, day?: string): Promise<ApiResponse<TimetableEntry[]>> => {
    const url = day 
      ? `/api/v1/timetable/teacher/me?academicSessionId=${academicSessionId}&day=${day}`
      : `/api/v1/timetable/teacher/me?academicSessionId=${academicSessionId}`;
    const response = await apiClient.get(url);
    return response.data;
  }
};

// STUDENT TIMETABLE APIS
export const studentTimetableService = {
  // Get class timetable
  getClassTimetable: async (classId: string, sectionId: string, academicSessionId: string): Promise<ApiResponse<TimetableEntry[]>> => {
    const response = await apiClient.get(`/api/v1/timetable/class/${classId}/section/${sectionId}?academicSessionId=${academicSessionId}`);
    return response.data;
  },

  // Get weekly timetable (grid format)
  getWeeklyTimetable: async (classId: string, sectionId: string, academicSessionId: string): Promise<ApiResponse<WeeklyTimetable>> => {
    const response = await apiClient.get(`/api/v1/timetable/weekly/class/${classId}/section/${sectionId}?academicSessionId=${academicSessionId}`);
    return response.data;
  }
};

// SHARED APIS (for dropdowns, etc.)
export const timetableDataService = {
  // Get all subjects
  getSubjects: async (): Promise<ApiResponse<Subject[]>> => {
    const response = await apiClient.get('/api/v1/subjects');
    return response.data;
  },

  // Get all teachers
  getTeachers: async (): Promise<ApiResponse<Teacher[]>> => {
    const response = await apiClient.get('/api/v1/teachers');
    return response.data;
  },

  // Get all classes
  getClasses: async (academicSessionId?: string): Promise<ApiResponse<Class[]>> => {
    const url = academicSessionId 
      ? `/api/v1/classes?academicSessionId=${academicSessionId}`
      : '/api/v1/classes';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get sections for a class
  getSections: async (classId: string): Promise<ApiResponse<Section[]>> => {
    const response = await apiClient.get(`/api/v1/classes/${classId}/sections`);
    return response.data;
  },

  // Get academic sessions
  getAcademicSessions: async (): Promise<ApiResponse<AcademicSession[]>> => {
    const response = await apiClient.get('/api/v1/academic-sessions');
    return response.data;
  }
};

// Utility functions for timetable management
export const timetableUtils = {
  // Format day name
  formatDay: (day: string): string => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday', 
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
      'FRIDAY': 'Friday',
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday'
    };
    return dayMap[day] || day;
  },

  // Format semester name
  formatSemester: (semester: string): string => {
    const semesterMap: Record<string, string> = {
      'FIRST': 'First Semester',
      'SECOND': 'Second Semester'
    };
    return semesterMap[semester] || semester;
  },

  // Get all days of week
  getDaysOfWeek: (): string[] => {
    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  },

  // Get period numbers (1-12)
  getPeriodNumbers: (): number[] => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  },

  // Validate time format (HH:MM)
  isValidTimeFormat: (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  // Format time for display
  formatTime: (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  },

  // Check for time conflicts
  hasTimeConflict: (entry1: TimetableEntry, entry2: TimetableEntry): boolean => {
    if (entry1.day !== entry2.day) return false;
    
    const start1 = new Date(`2000-01-01T${entry1.startTime}`);
    const end1 = new Date(`2000-01-01T${entry1.endTime}`);
    const start2 = new Date(`2000-01-01T${entry2.startTime}`);
    const end2 = new Date(`2000-01-01T${entry2.endTime}`);
    
    return (start1 < end2) && (start2 < end1);
  },

  // Generate empty weekly grid structure
  generateEmptyWeeklyGrid: (periods: number = 8): WeeklyTimetable => {
    const days = timetableUtils.getDaysOfWeek();
    const grid: WeeklyTimetable = {};
    
    days.forEach(day => {
      grid[day] = [];
    });
    
    return grid;
  },

  // Convert flat timetable array to weekly grid
  convertToWeeklyGrid: (timetableEntries: TimetableEntry[]): WeeklyTimetable => {
    const grid = timetableUtils.generateEmptyWeeklyGrid();
    
    timetableEntries.forEach(entry => {
      if (grid[entry.day]) {
        grid[entry.day].push(entry);
      }
    });
    
    // Sort each day by period number
    Object.keys(grid).forEach(day => {
      grid[day].sort((a, b) => a.periodNumber - b.periodNumber);
    });
    
    return grid;
  },

  // Handle conflict errors
  parseConflictError: (errorMessage: string): { type: string; message: string } => {
    if (errorMessage.includes('Teacher conflict')) {
      return {
        type: 'TEACHER_CONFLICT',
        message: 'This teacher is already assigned to another class during this time slot'
      };
    } else if (errorMessage.includes('Class conflict')) {
      return {
        type: 'CLASS_CONFLICT', 
        message: 'This class already has another subject scheduled during this time slot'
      };
    } else if (errorMessage.includes('Room conflict')) {
      return {
        type: 'ROOM_CONFLICT',
        message: 'This room is already occupied during this time slot'
      };
    }
    
    return {
      type: 'GENERAL_ERROR',
      message: errorMessage
    };
  }
};

export default {
  admin: adminTimetableService,
  teacher: teacherTimetableService,
  student: studentTimetableService,
  data: timetableDataService,
  utils: timetableUtils
};
