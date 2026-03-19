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
import AnnouncementManagement from "@/pages/AnnouncementManagement";
import AssignmentManagement from "@/pages/AssignmentManagement";
import StudentAssignmentSubmission from "@/pages/StudentAssignmentSubmission";
import TeacherAssignmentGrading from "@/pages/TeacherAssignmentGrading";

const queryClient = new QueryClient();

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
      <AuthProvider>
        <BrowserRouter>
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
              <Route path="/announcements" element={<AnnouncementManagement />} />
              
              {/* Assignment Routes */}
              <Route path="/assignments" element={<AssignmentManagement />} />
              <Route path="/assignments/:assignmentId/submit" element={<StudentAssignmentSubmission />} />
              <Route path="/assignments/:assignmentId/grade" element={<TeacherAssignmentGrading />} />
              
              {/* Student Routes */}
              <Route path="/results" element={<StudentResults />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
