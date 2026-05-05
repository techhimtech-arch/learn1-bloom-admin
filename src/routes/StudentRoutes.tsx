import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalLoading } from '@/components/shared/GlobalLoading';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const StudentAttendance = lazy(() => import("@/pages/StudentAttendance"));
const StudentResults = lazy(() => import("@/pages/StudentResults"));
const StudentFeeManagement = lazy(() => import("@/pages/StudentFeeManagement"));
const StudentStudyMaterials = lazy(() => import("@/pages/StudentStudyMaterials"));
const StudentAssignmentsView = lazy(() => import("@/pages/StudentAssignmentsView"));
const StudentAnnouncementsView = lazy(() => import("@/pages/StudentAnnouncementsView"));
const StudentTimetableView = lazy(() => import("@/pages/StudentTimetableView"));
const StudentCertificates = lazy(() => import("@/pages/StudentCertificates"));
const StudentQuizzes = lazy(() => import("@/pages/StudentQuizzes"));
const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function StudentRoutes({ setRunTour }: { setRunTour: any }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Routes>
        <Route path="/student/dashboard" element={<Dashboard />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/fees" element={<StudentFeeManagement />} />
        <Route path="/student/materials" element={<StudentStudyMaterials />} />
        <Route path="/student/assignments" element={<StudentAssignmentsView />} />
        <Route path="/student/announcements" element={<StudentAnnouncementsView />} />
        <Route path="/student/timetable" element={<StudentTimetableView />} />
        <Route path="/student/certificates" element={<StudentCertificates />} />
        <Route path="/student/quizzes" element={<StudentQuizzes />} />
        <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/results" element={<StudentResults />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
