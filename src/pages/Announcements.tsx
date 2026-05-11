import { useAuth } from '@/contexts/AuthContext';
import AnnouncementManagement from './admin/AnnouncementManagement';
import StudentParentAnnouncements from './StudentParentAnnouncements';

/**
 * Smart announcements router that shows:
 * - Admin: Table-based announcement management (full control)
 * - Student/Parent: Card-based view with filtered announcements (read-only)
 */
export const AnnouncementsPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Admin sees full management interface
  if (user.role === 'school_admin') {
    return <AnnouncementManagement />;
  }

  // Students and Parents see filtered, student-friendly view
  if (user.role === 'student' || user.role === 'parent') {
    return <StudentParentAnnouncements />;
  }

  // Teachers can also see filtered announcements
  return <StudentParentAnnouncements />;
};

export default AnnouncementsPage;
