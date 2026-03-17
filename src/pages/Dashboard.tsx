import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || '';

  switch (role) {
    case 'school_admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    default:
      return <TeacherDashboard />;
  }
};

export default Dashboard;
