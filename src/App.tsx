import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
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

// Lazy loaded role-based routes
const AdminRoutes = lazy(() => import("@/routes/AdminRoutes"));
const TeacherRoutes = lazy(() => import("@/routes/TeacherRoutes"));
const ParentRoutes = lazy(() => import("@/routes/ParentRoutes"));
const StudentRoutes = lazy(() => import("@/routes/StudentRoutes"));
const AccountantRoutes = lazy(() => import("@/routes/AccountantRoutes"));

const RoleBasedRoutes = ({ setRunTour }: { setRunTour: any }) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  switch (user.role) {
    case 'school_admin':
      return <AdminRoutes setRunTour={setRunTour} />;
    case 'teacher':
      return <TeacherRoutes setRunTour={setRunTour} />;
    case 'parent':
      return <ParentRoutes setRunTour={setRunTour} />;
    case 'student':
      return <StudentRoutes setRunTour={setRunTour} />;
    case 'accountant':
      return <AccountantRoutes setRunTour={setRunTour} />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

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
            <Route path="/*" element={<RoleBasedRoutes setRunTour={setRunTour} />} />
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
          <ConfigProvider>
            <AppContent />
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
