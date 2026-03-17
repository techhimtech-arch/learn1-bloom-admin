import { ClipboardCheck, BookOpen, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Student'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="My Attendance" value="—" change="This month" changeType="neutral" icon={ClipboardCheck} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="My Subjects" value="—" change="Current term" changeType="neutral" icon={BookOpen} iconColor="bg-secondary/10 text-secondary" />
        <StatWidget title="Exam Results" value="—" change="Latest" changeType="neutral" icon={FileText} iconColor="bg-accent/10 text-accent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your class schedule, assignments, and upcoming exams will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
