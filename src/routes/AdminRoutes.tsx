import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalLoading } from '@/components/shared/GlobalLoading';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const ParentLinking = lazy(() => import("@/pages/ParentLinking"));
const StudentAdmission = lazy(() => import("@/pages/StudentAdmission"));
const Enrollment = lazy(() => import("@/pages/Enrollment"));
const ClassManagement = lazy(() => import("@/pages/ClassManagement"));
const SubjectManagement = lazy(() => import("@/pages/SubjectManagement"));
const TeacherAssignmentManagement = lazy(() => import("@/pages/TeacherAssignments"));
const AttendanceManagement = lazy(() => import("@/pages/AttendanceManagement"));
const AcademicYearManagement = lazy(() => import("@/pages/AcademicYearManagement"));
const TimetableManagement = lazy(() => import("@/pages/TimetableManagement"));
const TimetableBuilderPage = lazy(() => import("@/pages/admin/TimetableBuilderPage"));
const AcademicCalendar = lazy(() => import("@/pages/AcademicCalendar"));
const RollNumberManagement = lazy(() => import("@/pages/RollNumberManagement"));
const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const ExamManagement = lazy(() => import("@/pages/ExamManagement"));
const MarksEntry = lazy(() => import("@/pages/MarksEntry"));
const ResultDashboard = lazy(() => import("@/pages/ResultDashboard"));
const AnnouncementsPage = lazy(() => import("@/pages/Announcements"));
const AssignmentManagement = lazy(() => import("@/pages/AssignmentManagement"));
const StudentAssignmentSubmission = lazy(() => import("@/pages/StudentAssignmentSubmission"));
const TeacherAssignmentGrading = lazy(() => import("@/pages/TeacherAssignmentGrading"));
const FeeStructureManagement = lazy(() => import("@/pages/FeeStructureManagement"));
const StudentFeeManagement = lazy(() => import("@/pages/StudentFeeManagement"));
const FeeReports = lazy(() => import("@/pages/FeeReports"));
const AccountantPayments = lazy(() => import("@/pages/accountant/AccountantPayments"));
const AccountantDues = lazy(() => import("@/pages/accountant/AccountantDues"));
const CertificateGenerator = lazy(() => import("@/pages/CertificateGenerator"));
const AdminQuizzes = lazy(() => import("@/pages/admin/AdminQuizzes"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function AdminRoutes({ setRunTour }: { setRunTour: any }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Routes>
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
        <Route path="/timetable-builder" element={<TimetableBuilderPage />} />
        <Route path="/academic-calendar" element={<AcademicCalendar />} />
        <Route path="/roll-numbers" element={<RollNumberManagement />} />
        <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/exams" element={<ExamManagement />} />
        <Route path="/exams/:examId/marks" element={<MarksEntry />} />
        <Route path="/exams/:examId/results" element={<ResultDashboard />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/assignments" element={<AssignmentManagement />} />
        <Route path="/assignments/:assignmentId/submit" element={<StudentAssignmentSubmission />} />
        <Route path="/assignments/:assignmentId/grade" element={<TeacherAssignmentGrading />} />
        <Route path="/admin/quizzes" element={<AdminQuizzes />} />
        <Route path="/fees/structure" element={<FeeStructureManagement />} />
        <Route path="/fees/student/:studentId" element={<StudentFeeManagement />} />
        <Route path="/fees/reports" element={<FeeReports />} />
        <Route path="/fees/payments" element={<AccountantPayments />} />
        <Route path="/fees/dues" element={<AccountantDues />} />
        <Route path="/certificates" element={<CertificateGenerator />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
