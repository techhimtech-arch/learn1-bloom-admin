import { useNavigate } from 'react-router-dom';
import { CalendarCheck, BookOpen, ClipboardCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name || 'Teacher'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="My Subjects" value="—" change="Assigned to you" changeType="neutral" icon={BookOpen} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Today's Classes" value="—" change="Check schedule" changeType="neutral" icon={CalendarCheck} iconColor="bg-secondary/10 text-secondary" />
        <StatWidget title="Pending Attendance" value="—" change="Mark today" changeType="neutral" icon={ClipboardCheck} iconColor="bg-warning/10 text-warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/attendance')}>
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/subjects')}>
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-xs">My Subjects</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" disabled>
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">My Students</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your class schedule and upcoming tasks will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
