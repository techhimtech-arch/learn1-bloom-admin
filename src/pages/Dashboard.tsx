import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'school_admin':
    default:
      return <AdminDashboard />;
  }
};

export default Dashboard;
