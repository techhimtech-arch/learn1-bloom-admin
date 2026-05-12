import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalLoading } from '@/components/shared/GlobalLoading';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const FeeStructureManagement = lazy(() => import("@/pages/admin/FeeStructureManagement"));
const FeeReports = lazy(() => import("@/pages/admin/FeeReports"));
const AccountantPayments = lazy(() => import("@/pages/accountant/AccountantPayments"));
const AccountantDues = lazy(() => import("@/pages/accountant/AccountantDues"));
const AccountantDashboard = lazy(() => import("@/pages/accountant/AccountantDashboard"));
const AccountantPaymentForm = lazy(() => import("@/pages/accountant/AccountantPaymentForm"));
const AccountantFeeStructure = lazy(() => import("@/pages/accountant/AccountantFeeStructure"));
const AccountantReports = lazy(() => import("@/pages/accountant/AccountantReports"));
const StudentFeeManagement = lazy(() => import("@/pages/StudentFeeManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function AccountantRoutes({ setRunTour }: { setRunTour: any }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile setRunTour={setRunTour} />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/fees/structure" element={<FeeStructureManagement />} />
        <Route path="/fees/reports" element={<FeeReports />} />
        <Route path="/fees/payments" element={<AccountantPayments />} />
        <Route path="/fees/dues" element={<AccountantDues />} />
        <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
        <Route path="/accountant/record-payment" element={<AccountantPaymentForm />} />
        <Route path="/fees/student/:studentId" element={<StudentFeeManagement />} />
        <Route path="/accountant/fee-structure" element={<AccountantFeeStructure />} />
        <Route path="/accountant/reports" element={<AccountantReports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
