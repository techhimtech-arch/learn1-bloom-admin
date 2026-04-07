import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import UserManagement from "@/pages/UserManagement";
import StudentAdmission from "@/pages/StudentAdmission";
import ClassManagement from "@/pages/ClassManagement";
import AttendanceManagement from "@/pages/AttendanceManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import SubjectManagement from "@/pages/SubjectManagement";
import TimetableManagement from "@/pages/TimetableManagement";
import AcademicCalendar from "@/pages/AcademicCalendar";
import RollNumberManagement from "@/pages/RollNumberManagement";
import TeacherAssignments from "@/pages/TeacherAssignments";
import Profile from "@/pages/Profile";
import SessionManagement from "@/pages/SessionManagement";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import ExamManagement from "@/pages/ExamManagement";
import ExamSubjectPapers from "@/pages/ExamSubjectPapers";
import MarksEntry from "@/pages/MarksEntry";
import ResultDashboard from "@/pages/ResultDashboard";
import StudentResults from "@/pages/StudentResults";
import TeacherExamDashboard from "@/pages/TeacherExamDashboard";
import AnnouncementsPage from "@/pages/Announcements";
import AssignmentManagement from "@/pages/AssignmentManagement";
import StudentAssignmentSubmission from "@/pages/StudentAssignmentSubmission";
import TeacherAssignmentGrading from "@/pages/TeacherAssignmentGrading";
import FeeStructureManagement from "@/pages/FeeStructureManagement";
import StudentFeeManagement from "@/pages/StudentFeeManagement";
import FeeReports from "@/pages/FeeReports";
import ParentDashboard from "@/pages/ParentDashboard";
import ParentStudentDetail from "@/pages/ParentStudentDetail";
import CertificateGenerator from "@/pages/CertificateGenerator";
import StudentAttendance from "@/pages/StudentAttendance";
import StudentStudyMaterials from "@/pages/StudentStudyMaterials";
import StudentCertificates from "@/pages/StudentCertificates";
import StudentAssignmentsView from "@/pages/StudentAssignmentsView";
import StudentAnnouncementsView from "@/pages/StudentAnnouncementsView";
import StudentTimetableView from "@/pages/StudentTimetableView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — avoid duplicate fetches
      gcTime: 10 * 60 * 1000,   // 10 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
            <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />
            <Route path="/reset-password" element={<AuthRedirect><ResetPassword /></AuthRedirect>} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/admission" element={<StudentAdmission />} />
              <Route path="/classes" element={<ClassManagement />} />
              <Route path="/subjects" element={<SubjectManagement />} />
              <Route path="/teacher-assignments" element={<TeacherAssignments />} />
              <Route path="/attendance" element={<AttendanceManagement />} />
              <Route path="/academic-years" element={<AcademicYearManagement />} />
              <Route path="/timetable" element={<TimetableManagement />} />
              <Route path="/academic-calendar" element={<AcademicCalendar />} />
              <Route path="/roll-numbers" element={<RollNumberManagement />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sessions" element={<SessionManagement />} />
              
              {/* Exam Routes */}
              <Route path="/exams" element={<ExamManagement />} />
              <Route path="/exams/:examId/papers" element={<ExamSubjectPapers />} />
              <Route path="/exams/:examId/marks" element={<MarksEntry />} />
              <Route path="/exams/:examId/results" element={<ResultDashboard />} />
              
              {/* Announcement Routes */}
              <Route path="/announcements" element={<AnnouncementsPage />} />
              
              {/* Assignment Routes */}
              <Route path="/assignments" element={<AssignmentManagement />} />
              <Route path="/assignments/:assignmentId/submit" element={<StudentAssignmentSubmission />} />
              <Route path="/assignments/:assignmentId/grade" element={<TeacherAssignmentGrading />} />
              
              {/* Fee Management Routes */}
              <Route path="/fees/structure" element={<FeeStructureManagement />} />
              <Route path="/fees/student/:studentId" element={<StudentFeeManagement />} />
              <Route path="/fees/reports" element={<FeeReports />} />
              
              {/* Parent Portal Routes */}
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/student/:studentId" element={<ParentStudentDetail />} />
              <Route path="/parent/student/:studentId/:tab" element={<ParentStudentDetail />} />
              
              {/* Certificate Routes */}
              <Route path="/certificates" element={<CertificateGenerator />} />
              
              {/* Student Portal Routes */}
              <Route path="/student/dashboard" element={<Dashboard />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/fees" element={<StudentFeeManagement />} />
              <Route path="/student/materials" element={<StudentStudyMaterials />} />
              <Route path="/student/assignments" element={<StudentAssignmentsView />} />
              <Route path="/student/announcements" element={<StudentAnnouncementsView />} />
              <Route path="/student/timetable" element={<StudentTimetableView />} />
              <Route path="/student/certificates" element={<StudentCertificates />} />
              
              {/* Student Results Routes */}
              <Route path="/results" element={<StudentResults />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
