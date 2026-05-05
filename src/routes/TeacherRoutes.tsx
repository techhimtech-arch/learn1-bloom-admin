import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalLoading } from '@/components/shared/GlobalLoading';
import { TeacherProvider } from '@/contexts/TeacherContext';

const TeacherAttendance = lazy(() => import("@/pages/TeacherAttendance"));
const TeacherDashboard = lazy(() => import("@/pages/dashboards/TeacherDashboard"));
const TeacherProfile = lazy(() => import("@/pages/teacher/TeacherProfile"));
const TeacherStudents = lazy(() => import("@/pages/teacher/TeacherStudents"));
const TeacherExams = lazy(() => import("@/pages/teacher/TeacherExams"));
const TeacherResults = lazy(() => import("@/pages/teacher/TeacherResults"));
const TeacherAssignments = lazy(() => import("@/pages/teacher/TeacherAssignments"));
const TeacherQuizzes = lazy(() => import("@/pages/teacher/TeacherQuizzes"));

const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function TeacherRoutes({ setRunTour }: { setRunTour: any }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <TeacherProvider>
        <Routes>
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/exams" element={<TeacherExams />} />
          <Route path="/teacher/results" element={<TeacherResults />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/quizzes" element={<TeacherQuizzes />} />
          <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
          <Route path="/sessions" element={<SessionManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TeacherProvider>
    </Suspense>
  );
}
