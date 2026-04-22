import { Outlet, Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const { user } = useAuth();
  const profilePath = user?.role === 'teacher' ? '/teacher/profile' : '/profile';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
              <span className="hidden text-sm font-medium text-foreground sm:inline">
                Welcome back, {user?.name || 'Admin'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Link to={profilePath}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
