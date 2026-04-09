import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_LABELS, canTakeTour, getTourLocalStorageKey } from '@/lib/role-config';
import { AppLayout } from "@/components/layout/AppLayout";
import AdminTour from "@/components/onboarding/AdminTour";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Enrollment from "@/pages/Enrollment";
import UserManagement from "@/pages/UserManagement";
import StudentAdmission from "@/pages/StudentAdmission";
import ClassManagement from "@/pages/ClassManagement";
import AttendanceManagement from "@/pages/AttendanceManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import SubjectManagement from "@/pages/SubjectManagement";
import TimetableManagement from "@/pages/TimetableManagement";
import AcademicCalendar from "@/pages/AcademicCalendar";
import RollNumberManagement from "@/pages/RollNumberManagement";
import TeacherAssignmentManagement from "@/pages/TeacherAssignments";
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
import TeacherAttendance from "@/pages/TeacherAttendance";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import TeacherProfile from "@/pages/teacher/TeacherProfile";
import TeacherStudents from "@/pages/teacher/TeacherStudents";
import TeacherExams from "@/pages/teacher/TeacherExams";
import TeacherResults from "@/pages/teacher/TeacherResults";
import TeacherAssignments from "@/pages/teacher/TeacherAssignments";

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

const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role && canTakeTour(user.role)) {
      const tourKey = getTourLocalStorageKey(user.role);
      const tourCompleted = localStorage.getItem(tourKey);
      if (!tourCompleted) {
        setShowWelcomeModal(true);
      }
    }
  }, [isAuthenticated, user, loading]);

  useEffect(() => {
    const handleStartTourEvent = (event: CustomEvent) => {
      const tourKey = getTourLocalStorageKey(event.detail.role);
      localStorage.removeItem(tourKey);
      setRunTour(true);
    };

    window.addEventListener('startTour', handleStartTourEvent as EventListener);
    return () => window.removeEventListener('startTour', handleStartTourEvent as EventListener);
  }, []);

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setRunTour(true);
  };

  const handleSkipTour = () => {
    setShowWelcomeModal(false);
    if (user?.role) {
      const tourKey = getTourLocalStorageKey(user.role);
      localStorage.setItem(tourKey, 'true');
    }
  };

  return (
    <>
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
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/classes" element={<ClassManagement />} />
          <Route path="/subjects" element={<SubjectManagement />} />
          <Route path="/teacher-assignments" element={<TeacherAssignmentManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/academic-years" element={<AcademicYearManagement />} />
          <Route path="/timetable" element={<TimetableManagement />} />
          <Route path="/academic-calendar" element={<AcademicCalendar />} />
          <Route path="/roll-numbers" element={<RollNumberManagement />} />
          <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
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
          
          {/* Teacher Routes */}
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/exams" element={<TeacherExams />} />
          <Route path="/teacher/results" element={<TeacherResults />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Welcome Modal for First-time Users */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Welcome {ROLE_LABELS[user?.role || 'User']} — Take a Tour?
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Let us guide you through the key features of your portal. This will only take a few minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleSkipTour}>
              Skip
            </Button>
            <Button onClick={handleStartTour}>
              Start Tour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Component */}
      {user?.role && canTakeTour(user.role) && (
        <AdminTour runTour={runTour} setRunTour={setRunTour} />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
