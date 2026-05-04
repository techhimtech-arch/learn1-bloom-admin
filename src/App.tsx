import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TeacherProvider } from "@/contexts/TeacherContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_LABELS, canTakeTour, getTourLocalStorageKey, getDefaultRoute } from '@/lib/role-config';
import { AppLayout } from "@/components/layout/AppLayout";
import AdminTour from "@/components/onboarding/AdminTour";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { lazy, Suspense } from "react";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

// Eagerly loaded components (Critical for quick time-to-interactive)
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

// Lazy loaded dashboard pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Enrollment = lazy(() => import("@/pages/Enrollment"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const ParentLinking = lazy(() => import("@/pages/ParentLinking"));
const StudentAdmission = lazy(() => import("@/pages/StudentAdmission"));
const ClassManagement = lazy(() => import("@/pages/ClassManagement"));
const AttendanceManagement = lazy(() => import("@/pages/AttendanceManagement"));
const AcademicYearManagement = lazy(() => import("@/pages/AcademicYearManagement"));
const SubjectManagement = lazy(() => import("@/pages/SubjectManagement"));
const TimetableManagement = lazy(() => import("@/pages/TimetableManagement"));
const AcademicCalendar = lazy(() => import("@/pages/AcademicCalendar"));
const RollNumberManagement = lazy(() => import("@/pages/RollNumberManagement"));
const TeacherAssignmentManagement = lazy(() => import("@/pages/TeacherAssignments"));
const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));

const ExamManagement = lazy(() => import("@/pages/ExamManagement"));
const MarksEntry = lazy(() => import("@/pages/MarksEntry"));
const ResultDashboard = lazy(() => import("@/pages/ResultDashboard"));
const StudentResults = lazy(() => import("@/pages/StudentResults"));
const TeacherExamDashboard = lazy(() => import("@/pages/TeacherExamDashboard"));
const AnnouncementsPage = lazy(() => import("@/pages/Announcements"));

const AssignmentManagement = lazy(() => import("@/pages/AssignmentManagement"));
const StudentAssignmentSubmission = lazy(() => import("@/pages/StudentAssignmentSubmission"));
const TeacherAssignmentGrading = lazy(() => import("@/pages/TeacherAssignmentGrading"));

const FeeStructureManagement = lazy(() => import("@/pages/FeeStructureManagement"));
const StudentFeeManagement = lazy(() => import("@/pages/StudentFeeManagement"));
const FeeReports = lazy(() => import("@/pages/FeeReports"));

const ParentDashboard = lazy(() => import("@/pages/ParentDashboard"));
const ParentStudentDetail = lazy(() => import("@/pages/ParentStudentDetail"));

const AccountantPayments = lazy(() => import("@/pages/accountant/AccountantPayments"));
const AccountantDues = lazy(() => import("@/pages/accountant/AccountantDues"));
const AccountantDashboard = lazy(() => import("@/pages/accountant/AccountantDashboard"));
const AccountantPaymentForm = lazy(() => import("@/pages/accountant/AccountantPaymentForm"));
const AccountantFeeStructure = lazy(() => import("@/pages/accountant/AccountantFeeStructure"));
const AccountantReports = lazy(() => import("@/pages/accountant/AccountantReports"));

const CertificateGenerator = lazy(() => import("@/pages/CertificateGenerator"));

const StudentAttendance = lazy(() => import("@/pages/StudentAttendance"));
const StudentStudyMaterials = lazy(() => import("@/pages/StudentStudyMaterials"));
const StudentCertificates = lazy(() => import("@/pages/StudentCertificates"));
const StudentAssignmentsView = lazy(() => import("@/pages/StudentAssignmentsView"));
const StudentAnnouncementsView = lazy(() => import("@/pages/StudentAnnouncementsView"));
const StudentTimetableView = lazy(() => import("@/pages/StudentTimetableView"));

const TeacherAttendance = lazy(() => import("@/pages/TeacherAttendance"));
const TeacherDashboard = lazy(() => import("@/pages/dashboards/TeacherDashboard"));
const TeacherProfile = lazy(() => import("@/pages/teacher/TeacherProfile"));
const TeacherStudents = lazy(() => import("@/pages/teacher/TeacherStudents"));
const TeacherExams = lazy(() => import("@/pages/teacher/TeacherExams"));
const TeacherResults = lazy(() => import("@/pages/teacher/TeacherResults"));
const TeacherAssignments = lazy(() => import("@/pages/teacher/TeacherAssignments"));
const TeacherQuizzes = lazy(() => import("@/pages/teacher/TeacherQuizzes"));

const StudentQuizzes = lazy(() => import("@/pages/StudentQuizzes"));
const AdminQuizzes = lazy(() => import("@/pages/admin/AdminQuizzes"));

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
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={getDefaultRoute(user?.role || '')} replace />;
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
      console.log('🎬 Start Tour Event Received:', event.detail);
      const tourKey = getTourLocalStorageKey(event.detail.role);
      console.log('🔑 Tour Key:', tourKey);
      localStorage.removeItem(tourKey);
      console.log('🗑️ Removed from localStorage');
      setRunTour(true);
      console.log('▶️ Set runTour to true');
    };

    window.addEventListener('startTour', handleStartTourEvent as EventListener);
    return () => window.removeEventListener('startTour', handleStartTourEvent as EventListener);
  }, []);

  const handleStartTour = () => {
    console.log('🎯 Welcome Modal: View Instructions Clicked');
    setShowWelcomeModal(false);
  };

  const handleSkipTour = () => {
    console.log('❌ Welcome Modal: Skip Instructions Clicked');
    const tourKey = getTourLocalStorageKey(user?.role || '');
    localStorage.setItem(tourKey, 'true');
    setShowWelcomeModal(false);
  };

  return (
    <>
      <Suspense fallback={<GlobalLoading />}>
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
            <Route path="/parent-linking" element={<ParentLinking />} />
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
            <Route path="/exams/:examId/marks" element={<MarksEntry />} />
            <Route path="/exams/:examId/results" element={<ResultDashboard />} />
            
            {/* Announcement Routes */}
            <Route path="/announcements" element={<AnnouncementsPage />} />
            
            {/* Assignment Routes */}
            <Route path="/assignments" element={<AssignmentManagement />} />
            <Route path="/assignments/:assignmentId/submit" element={<StudentAssignmentSubmission />} />
            <Route path="/assignments/:assignmentId/grade" element={<TeacherAssignmentGrading />} />
            
            {/* Quiz Routes */}
            <Route path="/student/quizzes" element={<StudentQuizzes />} />
            <Route path="/admin/quizzes" element={<AdminQuizzes />} />
            
            {/* Fee Management Routes */}
            <Route path="/fees/structure" element={<FeeStructureManagement />} />
            <Route path="/fees/student/:studentId" element={<StudentFeeManagement />} />
            <Route path="/fees/reports" element={<FeeReports />} />
            <Route path="/fees/payments" element={<AccountantPayments />} />
            <Route path="/fees/dues" element={<AccountantDues />} />
            
            {/* Accountant Portal Routes */}
            <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
            <Route path="/accountant/record-payment" element={<AccountantPaymentForm />} />
            <Route path="/accountant/fee-structure" element={<AccountantFeeStructure />} />
            <Route path="/accountant/reports" element={<AccountantReports />} />
            
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
            <Route path="/teacher/*" element={
              <TeacherProvider>
                <Routes>
                  <Route path="attendance" element={<TeacherAttendance />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="profile" element={<TeacherProfile />} />
                  <Route path="students" element={<TeacherStudents />} />
                  <Route path="exams" element={<TeacherExams />} />
                  <Route path="results" element={<TeacherResults />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="quizzes" element={<TeacherQuizzes />} />
                </Routes>
              </TeacherProvider>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Tour Instructions Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              🎯 Welcome to {user?.role ? ROLE_LABELS[user.role] : 'Dashboard'} — Quick Tour Guide
            </DialogTitle>
            <DialogDescription className="text-base mt-2 text-center">
              {user?.role === 'teacher' 
                ? "Here's a step-by-step guide to help you navigate through your teacher portal"
                : user?.role === 'parent'
                ? "Here's a step-by-step guide to help you navigate through your parent portal"
                : user?.role === 'student'
                ? "Here's a step-by-step guide to help you navigate through your student portal"
                : "Here's a step-by-step guide to help you navigate through your school management system"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            {user?.role === 'teacher' ? (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Teacher Dashboard Features</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><strong>Teacher Dashboard:</strong> View your class schedule and upcoming activities</li>
                    <li><strong>My Students:</strong> Manage your assigned students and track their progress</li>
                    <li><strong>Teacher Attendance:</strong> Mark attendance for your classes</li>
                    <li><strong>Teacher Exams:</strong> Create and manage exams for your subjects</li>
                    <li><strong>Teacher Results:</strong> Enter and manage student exam results</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">📚 Assignment Management</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li><strong>Teacher Assignments:</strong> Create and grade student assignments</li>
                    <li><strong>My Profile:</strong> Update your personal information and qualifications</li>
                    <li><strong>Class Management:</strong> View your assigned classes and subjects</li>
                    <li><strong>Announcements:</strong> Send announcements to your students</li>
                    <li><strong>Results:</strong> Track student performance and generate reports</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">🚀 Quick Start Tips</h3>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Use the left sidebar to navigate between different sections</li>
                    <li>• Start with your dashboard to see today's schedule</li>
                    <li>• Mark attendance for your classes daily</li>
                    <li>• Create assignments and track student submissions</li>
                    <li>• Check your profile for additional settings and options</li>
                  </ul>
                </div>
              </>
            ) : user?.role === 'parent' ? (
              <>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">👨‍👩‍👧‍👦 Parent Portal Features</h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li><strong>Parent Dashboard:</strong> Overview of your children's academic progress</li>
                    <li><strong>Student Details:</strong> View detailed information about each child</li>
                    <li><strong>Attendance:</strong> Monitor your children's attendance records</li>
                    <li><strong>Results:</strong> Check exam results and academic performance</li>
                    <li><strong>Fees:</strong> Track fee payments and outstanding dues</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📚 Academic Tracking</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><strong>Announcements:</strong> Stay updated with school news</li>
                    <li><strong>Assignments:</strong> Track your children's homework and projects</li>
                    <li><strong>Timetable:</strong> View class schedules and routines</li>
                    <li><strong>Certificates:</strong> Access academic certificates and achievements</li>
                    <li><strong>Profile:</strong> Manage your account settings</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">🚀 Quick Start Tips</h3>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Select a child to view their detailed information</li>
                    <li>• Use the tabs to switch between different aspects</li>
                    <li>• Check announcements regularly for important updates</li>
                    <li>• Monitor attendance and academic performance</li>
                    <li>• Contact school through the profile section if needed</li>
                  </ul>
                </div>
              </>
            ) : user?.role === 'student' ? (
              <>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">🎓 Student Portal Features</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li><strong>Student Dashboard:</strong> View your academic overview and schedule</li>
                    <li><strong>My Attendance:</strong> Check your attendance records</li>
                    <li><strong>My Results:</strong> View your exam results and performance</li>
                    <li><strong>My Fees:</strong> Track fee payments and dues</li>
                    <li><strong>Study Materials:</strong> Access learning resources and materials</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📚 Learning Tools</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><strong>My Assignments:</strong> View and submit homework assignments</li>
                    <li><strong>Announcements:</strong> Stay updated with school notices</li>
                    <li><strong>My Timetable:</strong> View your class schedule</li>
                    <li><strong>My Certificates:</strong> Access your academic certificates</li>
                    <li><strong>Profile:</strong> Manage your personal information</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">🚀 Quick Start Tips</h3>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Check your dashboard daily for updates</li>
                    <li>• Submit assignments on time</li>
                    <li>• Monitor your attendance and academic progress</li>
                    <li>• Download study materials regularly</li>
                    <li>• Keep your profile information updated</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Key Dashboard Features</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><strong>Dashboard:</strong> Monitor overall school activity, view statistics, and track important metrics</li>
                    <li><strong>User Management:</strong> Create and manage teachers, parents, and admin accounts</li>
                    <li><strong>Student Admission:</strong> Handle student applications and enrollment processes</li>
                    <li><strong>Academic Years:</strong> Set up academic years, terms, and calendar dates</li>
                    <li><strong>Class Management:</strong> Manage class schedules and room assignments</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">📚 Academic Management</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li><strong>Subjects:</strong> Configure subjects and assign teachers</li>
                    <li><strong>Teacher Assignments:</strong> Manage teacher profiles and schedules</li>
                    <li><strong>Exams:</strong> Create exam schedules and manage results</li>
                    <li><strong>Announcements:</strong> Send notifications to students and staff</li>
                    <li><strong>Assignments:</strong> Create and manage student assignments</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">💰 Financial & Administrative</h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li><strong>Fee Structure:</strong> Set up fee structures and payment plans</li>
                    <li><strong>Fee Reports:</strong> Track payments and generate financial reports</li>
                    <li><strong>Certificates:</strong> Generate student certificates</li>
                    <li><strong>Attendance:</strong> Manage student and staff attendance</li>
                    <li><strong>Profile Settings:</strong> Access your profile and restart this guide anytime</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">🚀 Quick Start Tips</h3>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Use the left sidebar to navigate between different sections</li>
                    <li>• Each section has its own management tools and features</li>
                    <li>• Look for "Add New" buttons to create new records</li>
                    <li>• Use filters and search to find specific information quickly</li>
                    <li>• Check your profile for additional settings and options</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleSkipTour}>
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Component - Temporarily Disabled */}
      {/* {user?.role && canTakeTour(user.role) && (
        <AdminTour runTour={runTour} setRunTour={setRunTour} />
      )} */}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
