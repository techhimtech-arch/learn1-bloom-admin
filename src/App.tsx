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
import Dashboard from "@/pages/Dashboard";
import UserManagement from "@/pages/UserManagement";
import StudentAdmission from "@/pages/StudentAdmission";
import ClassManagement from "@/pages/ClassManagement";
import AttendanceManagement from "@/pages/AttendanceManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/admission" element={<StudentAdmission />} />
              <Route path="/classes" element={<ClassManagement />} />
              <Route path="/attendance" element={<AttendanceManagement />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
