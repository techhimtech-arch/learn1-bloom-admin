// Quiz System Types and Interfaces

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  explanation?: string;
}

export interface QuizCreateRequest {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  quizType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MIXED';
  timeLimit: number;
  maxMarks: number;
  passingMarks: number;
  startsAt: string;
  endsAt: string;
  allowRetake: boolean;
  maxAttempts: number;
  showCorrectAnswers: boolean;
  showResultsImmediately: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  isSchoolWide: boolean;
  questions: QuizQuestion[];
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  schoolId: string;
  subjectId: {
    _id: string;
    name: string;
  };
  classId: {
    _id: string;
    name: string;
  };
  sectionId: {
    _id: string;
    name: string;
  };
  quizType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MIXED';
  timeLimit: number;
  maxMarks: number;
  passingMarks: number;
  startsAt: string;
  endsAt: string;
  allowRetake: boolean;
  maxAttempts: number;
  showCorrectAnswers: boolean;
  showResultsImmediately: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  isSchoolWide: boolean;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  questions?: QuizQuestion[];
}

export interface QuizWithStats extends Quiz {
  stats: {
    totalSubmissions: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
    passedCount: number;
  };
}

export interface QuizSubmission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  attemptNumber: number;
  submittedAt: string;
  timeTakenFormatted: string;
  marksObtained: number;
  percentage: number;
  grade: string;
  passed: boolean;
}

export interface QuizResultsResponse {
  quiz: {
    _id: string;
    title: string;
    maxMarks: number;
    passingMarks: number;
    totalQuestions: number;
  };
  submissions: QuizSubmission[];
}

export interface LeaderboardEntry {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  percentage: number;
  grade: string;
  submittedAt: string;
}

export interface QuizLeaderboardResponse {
  quiz: {
    _id: string;
    title: string;
    maxMarks: number;
  };
  leaderboard: LeaderboardEntry[];
}

export interface SchoolLeaderboardEntry {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  totalQuizzes: number;
  totalMarks: number;
  averagePercentage: number;
  bestScore: number;
  lastQuizDate: string;
}

export interface StudentQuiz extends Quiz {
  submissionStatus: 'NOT_ATTEMPTED' | 'IN_PROGRESS' | 'COMPLETED';
  attempts: number;
  bestScore: number;
  bestGrade: string;
  canRetake: boolean;
  nextAttemptAvailable: boolean;
}

export interface QuizStartResponse {
  submissionId: string;
  quiz: {
    _id: string;
    title: string;
    timeLimit: number;
    maxMarks: number;
    showCorrectAnswers: boolean;
    showResultsImmediately: boolean;
  };
  questions: Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[];
  timeRemaining: number;
  startedAt: string;
}

export interface QuizAnswerRequest {
  questionIndex: number;
  selectedAnswer: number;
}

export interface QuizAnswerResponse {
  timeRemaining: number;
}

export interface QuizSubmissionResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  passed: boolean;
  timeTaken: string;
  answers: {
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
    correctAnswer: number;
    explanation?: string;
  }[];
}

export interface QuizSubmitResponse {
  submissionId: string;
  results: QuizSubmissionResult;
}

export interface QuizStudentResults {
  quiz: {
    _id: string;
    title: string;
    maxMarks: number;
    passingMarks: number;
    totalQuestions: number;
  };
  submission: {
    attemptNumber: number;
    submittedAt: string;
    timeTakenFormatted: string;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    passed: boolean;
    answers: {
      questionIndex: number;
      question: string;
      selectedAnswer: number;
      isCorrect: boolean;
      correctAnswer: number;
      explanation?: string;
      options: string[];
    }[];
  };
}

export interface QuizHistoryEntry {
  _id: string;
  quizId: {
    _id: string;
    title: string;
    subjectId: {
      name: string;
    };
    teacherId: {
      firstName: string;
      lastName: string;
    };
  };
  attemptNumber: number;
  submittedAt: string;
  percentage: number;
  grade: string;
  passed: boolean;
}

export interface QuizStatistics {
  totalQuizzes: number;
  totalMarks: number;
  averagePercentage: number;
  bestScore: number;
  passedCount: number;
  totalCorrectAnswers: number;
  totalQuestionsAttempted: number;
  accuracy: number;
}

export interface AdminQuiz extends Quiz {
  totalSubmissions: number;
  averagePercentage: number;
}

export interface QuizAnalytics {
  totalQuizzes: number;
  activeQuizzes: number;
  totalSubmissions: number;
  averageParticipation: number;
  topSubjects: {
    subjectName: string;
    quizCount: number;
    totalSubmissions: number;
  }[];
  topPerformers: {
    studentName: string;
    averageScore: number;
    totalQuizzes: number;
  }[];
  participationByClass: {
    className: string;
    totalStudents: number;
    participatedStudents: number;
    participationRate: number;
  }[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// Quiz Filter Types
export interface QuizFilters {
  page?: number;
  limit?: number;
  status?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
}

export interface QuizAnalyticsFilters {
  schoolId?: string;
  startDate?: string;
  endDate?: string;
}
