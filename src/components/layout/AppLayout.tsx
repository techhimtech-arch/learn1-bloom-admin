import { Outlet, Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, Moon, Sun, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/ConfigContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AppLayout() {
  const { user } = useAuth();
  const { selectedYearId, setSelectedYearId, academicYears, theme, setTheme } = useConfig();
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-2">
                <Select
                  value={selectedYearId}
                  onValueChange={setSelectedYearId}
                >
                  <SelectTrigger className="w-[180px] h-9 bg-secondary/50 border-none focus:ring-1 focus:ring-primary">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year: any) => (
                      <SelectItem key={year._id || year.id} value={year._id || year.id}>
                        {year.name} {year.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? (
                    <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                  ) : (
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>

              <NotificationDropdown />
              <Link to={profilePath}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all cursor-pointer">
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
