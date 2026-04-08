import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  ClipboardCheck,
  CalendarDays,
  BookOpen,
  UserCheck,
  User,
  Monitor,
  FileText,
  Edit,
  Award,
  TrendingUp,
  Send,
  Bell,
  DollarSign,
  FileCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export type AppRole = 'school_admin' | 'teacher' | 'accountant' | 'parent' | 'student';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// Which roles can access which routes
export const ROLE_ROUTES: Record<AppRole, string[]> = {
  school_admin: [
    '/', '/users', '/admission', '/enrollment', '/classes', '/subjects',
    '/attendance', '/academic-years', '/teacher-assignments',
    '/profile', '/sessions', '/exams', '/announcements', '/assignments',
    '/fees/structure', '/fees/reports', '/certificates',
  ],
  teacher: [
    '/', '/attendance', '/subjects', '/profile', '/sessions', '/exams', 
    '/assignments', '/results',
  ],
  accountant: [
    '/', '/profile', '/sessions', '/fees/structure', '/fees/reports',
  ],
  parent: [
    '/', '/attendance', '/fees', '/results', '/profile', '/sessions', '/announcements',
    '/parent/dashboard', '/parent/student/:studentId',
  ],
  student: [
    '/', '/attendance', '/profile', '/sessions', '/results', '/announcements', '/assignments',
    '/student/dashboard', '/student/attendance', '/student/results', '/student/fees',
    '/student/materials', '/student/assignments', '/student/announcements', '/student/timetable', '/student/certificates',
  ],
};

// Main nav items — filtered per role at runtime
const ALL_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'User Management', url: '/users', icon: Users },
  { title: 'Student Admission', url: '/admission', icon: GraduationCap },
  { title: 'Student Enrollment', url: '/enrollment', icon: GraduationCap },
  { title: 'Academic Years', url: '/academic-years', icon: CalendarDays },
  { title: 'Class Management', url: '/classes', icon: School },
  { title: 'Subject Management', url: '/subjects', icon: BookOpen },
  { title: 'Teacher Assignments', url: '/teacher-assignments', icon: UserCheck },
  { title: 'Exam Management', url: '/exams', icon: FileText },
  { title: 'Announcements', url: '/announcements', icon: Send },
  { title: 'Assignments', url: '/assignments', icon: Edit },
  { title: 'Fee Structure', url: '/fees/structure', icon: DollarSign },
  { title: 'Fee Reports', url: '/fees/reports', icon: TrendingUp },
  { title: 'Certificates', url: '/certificates', icon: FileCheck },
  { title: 'Parent Portal', url: '/parent/dashboard', icon: UsersRound },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
  // Student Portal Routes
  { title: 'My Attendance', url: '/student/attendance', icon: ClipboardCheck },
  { title: 'My Results', url: '/student/results', icon: TrendingUp },
  { title: 'My Fees', url: '/student/fees', icon: DollarSign },
  { title: 'Study Materials', url: '/student/materials', icon: BookOpen },
  { title: 'My Assignments', url: '/student/assignments', icon: Edit },
  { title: 'Announcements', url: '/student/announcements', icon: Bell },
  { title: 'My Timetable', url: '/student/timetable', icon: CalendarDays },
  { title: 'My Certificates', url: '/student/certificates', icon: Award },
];

// Account nav items — always visible
export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { title: 'My Profile', url: '/profile', icon: User },
  { title: 'Sessions', url: '/sessions', icon: Monitor },
];

export function getNavItemsForRole(role: string): NavItem[] {
  const allowed = ROLE_ROUTES[role as AppRole];
  if (!allowed) return [ALL_NAV_ITEMS[0]];
  return ALL_NAV_ITEMS.filter((item) => allowed.includes(item.url));
}

export function canAccessRoute(role: string, path: string): boolean {
  const allowed = ROLE_ROUTES[role as AppRole];
  if (!allowed) return false;
  return allowed.some((r) => (r === '/' ? path === '/' : path.startsWith(r)));
}

export function getDefaultRoute(role: string): string {
  return '/';
}

// Labels for display
export const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School Admin',
  teacher: 'Teacher',
  accountant: 'Accountant',
  parent: 'Parent',
  student: 'Student',
};
