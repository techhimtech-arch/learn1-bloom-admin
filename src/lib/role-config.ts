import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  ClipboardCheck,
  CalendarDays,
  BookOpen,
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
    '/', '/users', '/admission', '/classes', '/subjects',
    '/attendance', '/academic-years',
  ],
  teacher: [
    '/', '/attendance', '/subjects',
  ],
  accountant: [
    '/',
  ],
  parent: [
    '/', '/attendance', '/fees', '/results',
  ],
  student: [
    '/', '/attendance',
  ],
};

// All nav items — filtered per role at runtime
const ALL_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'User Management', url: '/users', icon: Users },
  { title: 'Student Admission', url: '/admission', icon: GraduationCap },
  { title: 'Academic Years', url: '/academic-years', icon: CalendarDays },
  { title: 'Class Management', url: '/classes', icon: School },
  { title: 'Subject Management', url: '/subjects', icon: BookOpen },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
];

export function getNavItemsForRole(role: string): NavItem[] {
  const allowed = ROLE_ROUTES[role as AppRole];
  if (!allowed) return [ALL_NAV_ITEMS[0]]; // fallback: dashboard only
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
