import { useNavigate } from 'react-router-dom';
import { CalendarCheck, BookOpen, ClipboardCheck, Users, Award, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { teacherApi } from '@/pages/services/api';
import { showApiError } from '@/lib/api-toast';
import { format } from 'date-fns';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    pendingResults: 0,
    totalExams: 0,
    totalAssignments: 0,
  });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher dashboard data
        const { data: dashboardData } = await teacherApi.getDashboard();
        
        // Fetch teacher profile for assignments
        const { data: profileData } = await teacherApi.getProfile();
        
        // Set stats from API response according to documentation
        const dashboard = dashboardData?.data;
        const profileDataResult = profileData?.data;
        
        setStats({
          totalStudents: dashboard?.totalStudents || 0,
          todayAttendance: dashboard?.todayAttendance || 0,
          pendingResults: dashboard?.pendingResults || 0,
          totalExams: dashboard?.totalExams || 0,
          totalAssignments: dashboard?.totalAssignments || 0,
        });
        
        setProfile(profileDataResult);
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget title="Total Students" value={stats.totalStudents} change="Under your supervision" changeType="neutral" icon={Users} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Today's Attendance" value={stats.todayAttendance} change="Attendance marked" changeType="positive" icon={CheckCircle} iconColor="bg-green-10 text-green-600" />
        <StatWidget title="Pending Results" value={stats.pendingResults} change="To be graded" changeType="negative" icon={Award} iconColor="bg-warning/10 text-warning" />
        <StatWidget title="Total Exams" value={stats.totalExams} change="This term" changeType="neutral" icon={FileText} iconColor="bg-secondary/10 text-secondary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="Total Assignments" value={stats.totalAssignments} change="Active assignments" changeType="neutral" icon={BookOpen} iconColor="bg-blue-10 text-blue-600" />
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

      {/* Teacher Assignments */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Class Teacher Assignment */}
              {profile.classTeacherAssignment && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Class Teacher</h4>
                  <Badge variant="secondary" className="text-sm">
                    {profile.classTeacherAssignment.classId?.name || 'Class'} - {profile.classTeacherAssignment.sectionId?.name || 'Section'}
                  </Badge>
                </div>
              )}

              {/* Subject Assignments */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Subject Assignments</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.subjectAssignments?.map((assignment, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {assignment.subjectId?.name || 'Subject'} ({assignment.classId?.name || 'Class'} - {assignment.sectionId?.name || 'Section'})
                    </Badge>
                  ))}
                  {(!profile.subjectAssignments || profile.subjectAssignments.length === 0) && (
                    <p className="text-sm text-muted-foreground">No subject assignments found</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
