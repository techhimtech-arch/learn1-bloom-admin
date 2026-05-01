// Timetable Types
export interface TimetableEntry {
  _id: string;
  classId: string;
  sectionId: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  periodNumber: number;
  subjectId: string;
  subject: Subject;
  teacherId: string;
  teacher: Teacher;
  startTime: string;
  endTime: string;
  room: string;
  academicSessionId: string;
  semester: 'FIRST' | 'SECOND';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  department?: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  specialization?: string[];
}

export interface Class {
  _id: string;
  name: string;
  grade: number;
  section?: string;
  academicSessionId: string;
}

export interface Section {
  _id: string;
  name: string;
  classId: string;
  academicSessionId: string;
}

export interface AcademicSession {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface WeeklyTimetable {
  [key: string]: TimetableEntry[];
}

export interface TimetableCreateRequest {
  classId: string;
  sectionId: string;
  day: string;
  periodNumber: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  room: string;
  academicSessionId: string;
  semester?: string;
}

export interface TimetableBulkCreateRequest {
  academicSessionId: string;
  timetableSlots: Partial<TimetableCreateRequest>[];
}

export interface TimetableUpdateRequest {
  day?: string;
  periodNumber?: number;
  subjectId?: string;
  teacherId?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  semester?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TimetableFilters {
  classId?: string;
  sectionId?: string;
  teacherId?: string;
  academicSessionId?: string;
  semester?: string;
  day?: string;
}

export interface TimetableConflict {
  type: 'TEACHER' | 'CLASS';
  message: string;
  conflictingEntry?: TimetableEntry;
}

// Form types
export interface TimetableFormData {
  classId: string;
  sectionId: string;
  day: string;
  periodNumber: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  room: string;
  academicSessionId: string;
  semester: string;
}

// UI Helper types
export interface PeriodSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
  entry?: TimetableEntry;
  isEmpty: boolean;
}

export interface DayColumn {
  day: string;
  periods: PeriodSlot[];
}
