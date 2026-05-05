import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalLoading } from '@/components/shared/GlobalLoading';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ParentDashboard = lazy(() => import("@/pages/ParentDashboard"));
const ParentStudentDetail = lazy(() => import("@/pages/ParentStudentDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const AnnouncementsPage = lazy(() => import("@/pages/Announcements"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function ParentRoutes({ setRunTour }: { setRunTour: any }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/student/:studentId" element={<ParentStudentDetail />} />
        <Route path="/parent/student/:studentId/:tab" element={<ParentStudentDetail />} />
        <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
