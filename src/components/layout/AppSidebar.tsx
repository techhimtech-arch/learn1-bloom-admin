import {
  GraduationCap,
  LogOut,
  BookOpen,
  Calendar as CalendarIcon,
  Hash,
  Clock,
  LayoutDashboard,
  Users,
  CalendarDays,
  School,
  ClipboardCheck,
  PlayCircle,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { getNavItemsForRole, ACCOUNT_NAV_ITEMS, ROLE_LABELS, canTakeTour } from '@/lib/role-config';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const getTourAttribute = (title: string) => {
  const tourMap: Record<string, string> = {
    'Dashboard': 'dashboard',
    'User Management': 'users',
    'Student Admission': 'admissions',
    'Academic Years': 'academic-year',
    'Class Management': 'classes',
    'Subject Management': 'subjects',
    'Exam Management': 'exams',
    'Announcements': 'announcements',
    'Fee Structure': 'fees',
    'My Profile': 'profile',
  };
  return tourMap[title] || '';
};

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'User Management', url: '/users', icon: Users },
  { title: 'Student Admission', url: '/admission', icon: GraduationCap },
  { title: 'Academic Years', url: '/academic-years', icon: CalendarDays },
  { title: 'Class Management', url: '/classes', icon: School },
  { title: 'Subject Management', url: '/subjects', icon: BookOpen },
  { title: 'Timetable', url: '/timetable', icon: Clock },
  { title: 'Academic Calendar', url: '/academic-calendar', icon: CalendarIcon },
  { title: 'Roll Numbers', url: '/roll-numbers', icon: Hash },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { logout, user } = useAuth();

  const navItems = getNavItemsForRole(user?.role || '');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-sidebar-foreground">School SMS</p>
              <p className="truncate text-xs text-sidebar-muted">
                {user ? ROLE_LABELS[user.role] || 'Panel' : 'Panel'}
              </p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const tourAttr = getTourAttribute(item.title);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        {...(tourAttr && { 'data-tour': tourAttr })}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACCOUNT_NAV_ITEMS.map((item) => {
                const tourAttr = getTourAttribute(item.title);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        {...(tourAttr && { 'data-tour': tourAttr })}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {/* Take Tour Option */}
              {canTakeTour(user?.role || '') && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => {
                      const event = new CustomEvent('startTour', { detail: { role: user?.role } });
                      window.dispatchEvent(event);
                    }}
                    className="hover:bg-sidebar-accent cursor-pointer"
                  >
                    <PlayCircle className="mr-2 h-4 w-4 text-primary" />
                    {!collapsed && <span className="text-primary">Take a Tour</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && user && (
          <div className="mb-2 px-4">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-xs capitalize text-sidebar-muted">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="hover:bg-sidebar-accent text-sidebar-muted">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
