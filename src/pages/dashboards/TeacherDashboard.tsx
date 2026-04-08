import { useNavigate } from 'react-router-dom';
import { CalendarCheck, BookOpen, ClipboardCheck, Users, Award, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { teacherApi } from '@/services/api';
import { showApiError } from '@/lib/api-toast';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    mySubjects: 0,
    todayClasses: 0,
    pendingAttendance: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher dashboard data
        const { data: dashboardData } = await teacherApi.getDashboard();
        
        // Fetch teacher profile for assignments
        const { data: profileData } = await teacherApi.getProfile();
        
        // Calculate stats from real data
        const profile = profileData?.data;
        const dashboard = dashboardData?.data;
        
        setStats({
          mySubjects: profile?.subjectAssignments?.length || 0,
          todayClasses: dashboard?.todayClasses || 0,
          pendingAttendance: dashboard?.pendingAttendance || 0,
          totalStudents: dashboard?.totalStudents || 0,
        });
      } catch (error) {
        showApiError(error, 'Failed to load teacher dashboard data');
      }
    };

    fetchTeacherData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name || 'Teacher'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="My Subjects" value={stats.mySubjects} change="Assigned to you" changeType="neutral" icon={BookOpen} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Today's Classes" value={stats.todayClasses} change="Check schedule" changeType="neutral" icon={CalendarCheck} iconColor="bg-secondary/10 text-secondary" />
        <StatWidget title="Pending Attendance" value={stats.pendingAttendance} change="Mark today" changeType="negative" icon={ClipboardCheck} iconColor="bg-warning/10 text-warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/attendance')}>
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/students')}>
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">My Students</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/results')}>
              <Award className="h-5 w-5 text-primary" />
              <span className="text-xs">Enter Results</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/profile')}>
              <User className="h-5 w-5 text-primary" />
              <span className="text-xs">My Profile</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/exams')}>
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-xs">Exams</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4" onClick={() => navigate('/teacher/assignments')}>
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-xs">Assignments</span>
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
