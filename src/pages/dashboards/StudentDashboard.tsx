import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/services/api';
import {
  ClipboardCheck, BookOpen, FileText, Calendar, Bell, AlertCircle, 
  TrendingUp, Award, Clock, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';

interface StudentInfo {
  _id?: string;
  name?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  status?: string;
}

interface AttendanceRecord {
  status?: string;
  date?: string;
  remarks?: string | null;
}

interface AttendanceStats {
  totalDays?: number;
  present?: number;
  absent?: number;
  late?: number;
  percentage?: number;
}

interface DashboardStats {
  student?: StudentInfo;
  attendance?: {
    today?: AttendanceRecord;
    thisMonth?: AttendanceStats;
    overall?: AttendanceStats;
  };
  assignments?: {
    pending?: number;
    completed?: number;
    overdue?: number;
    total?: number;
  };
  exams?: { upcoming: number; completed: number; nextExam?: string };
  announcements?: { unread: number };
  timetable?: any[];
  subjects?: any[];
  fees?: any;
  recentResults?: any[];
  upcomingExams?: any[];
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardApi.getStudentStats();
        setStats(response.data?.data || {});
      } catch (error) {
        console.error('Failed to load student dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const attendancePercentage = stats?.attendance?.overall?.percentage ?? 0;
  const attendanceStatus = attendancePercentage >= 75 ? 'good' : attendancePercentage >= 60 ? 'warning' : 'danger';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name || 'Student'}</h1>
          <p className="text-sm text-muted-foreground">
            Here's your academic overview and important updates
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Attendance"
          value={`${stats?.attendance?.overall?.percentage || 0}%`}
          change={`${stats?.attendance?.thisMonth?.present || 0} days this month`}
          changeType={attendanceStatus as any}
          icon={ClipboardCheck}
          iconColor={attendanceStatus === 'good' ? 'bg-green-500/10 text-green-600' : attendanceStatus === 'warning' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}
        />
        <StatWidget
          title="Assignments"
          value={`${stats?.assignments?.pending || 0}`}
          change={`${stats?.assignments?.completed || 0} completed`}
          changeType={stats?.assignments?.pending ? 'neutral' : 'positive'}
          icon={FileText}
          iconColor="bg-blue-500/10 text-blue-600"
        />
        <StatWidget
          title="Upcoming Exams"
          value={`${stats?.upcomingExams?.length || 0}`}
          change="In this term"
          changeType="neutral"
          icon={Calendar}
          iconColor="bg-purple-500/10 text-purple-600"
        />
        <StatWidget
          title="Notifications"
          value={`${(stats as any)?.unreadAnnouncements || 0}`}
          change="Unread"
          changeType={(stats as any)?.unreadAnnouncements ? 'negative' : 'positive'}
          icon={Bell}
          iconColor="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* Academic Overview Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="quick-actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Class Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Class</span>
                    <span className="font-semibold">{stats?.student?.class || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Section</span>
                    <span className="font-semibold">{stats?.student?.section || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Roll Number</span>
                    <span className="font-semibold">{stats?.student?.rollNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={stats?.student?.status === 'ENROLLED' ? 'default' : 'secondary'}>
                      {stats?.student?.status || 'Not Assigned'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <Badge variant={stats?.attendance?.today?.status === 'Present' ? 'default' : stats?.attendance?.today?.status === 'Late' ? 'secondary' : 'destructive'}>
                      {stats?.attendance?.today?.status || 'Not Marked'}
                    </Badge>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">This Month</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Present</span>
                        <span className="font-semibold text-green-600">{stats?.attendance?.thisMonth?.present || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Absent</span>
                        <span className="font-semibold text-red-600">{stats?.attendance?.thisMonth?.absent || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Late</span>
                        <span className="font-semibold text-yellow-600">{stats?.attendance?.thisMonth?.late || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-1 mt-1">
                        <span className="text-muted-foreground">Percentage</span>
                        <span className="font-semibold">{stats?.attendance?.thisMonth?.percentage || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                {attendancePercentage < 75 && (
                  <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-xs">
                      Attendance below 75%. Improvement needed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Assignment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Badge variant="outline" className="bg-green-50">{stats?.assignments?.completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge variant="outline" className="bg-orange-50">{stats?.assignments?.pending || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">{stats?.assignments?.overdue || 0}</Badge>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-muted-foreground font-semibold">Total</span>
                    <span className="font-semibold">{stats?.assignments?.total || 0}</span>
                  </div>
                </div>
                {stats?.assignments?.overdue ? (
                  <Alert className="mt-2 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-xs">
                      You have {stats?.assignments?.overdue} overdue assignment(s).
                    </AlertDescription>
                  </Alert>
                ) : stats?.assignments?.pending ? (
                  <Alert className="mt-2 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-xs">
                      You have {stats?.assignments?.pending} pending assignment(s).
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mt-2 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-xs">
                      All assignments completed!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Exam Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Exam Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Upcoming Exams</span>
                    <Badge variant="outline">{stats?.upcomingExams?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Badge variant="outline">{stats?.recentResults?.length || 0}</Badge>
                  </div>
                  {stats?.exams?.nextExam && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Next Exam</p>
                      <p className="font-semibold text-sm text-primary">{stats?.exams?.nextExam}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.timetable && stats?.timetable?.length > 0 ? (
                <div className="space-y-2">
                  {stats?.timetable?.map((slot: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{slot.period || `Period ${idx + 1}`}</Badge>
                        <div>
                          <p className="font-semibold text-sm">{slot.subject || 'Subject'}</p>
                          <p className="text-xs text-muted-foreground">{slot.time || slot.teacher || '—'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{slot.room || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Schedule not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center py-4">
                  You have {(stats as any)?.unreadAnnouncements || 0} unread announcement(s)
                </p>
                <Button variant="outline" className="w-full">View All Announcements</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="justify-start text-left h-auto p-4 flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">My Assignments</span>
              </div>
              <span className="text-xs text-muted-foreground">View and submit assignments</span>
            </Button>

            <Button variant="outline" className="justify-start text-left h-auto p-4 flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Exam Results</span>
              </div>
              <span className="text-xs text-muted-foreground">View your grades and results</span>
            </Button>

            <Button variant="outline" className="justify-start text-left h-auto p-4 flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Progress Report</span>
              </div>
              <span className="text-xs text-muted-foreground">Check your academic performance</span>
            </Button>

            <Button variant="outline" className="justify-start text-left h-auto p-4 flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4" />
                <span className="font-semibold">Achievements</span>
              </div>
              <span className="text-xs text-muted-foreground">View your certificates and awards</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Featured Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Fee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.fees ? (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Due</span>
                    <span className="font-semibold">₹{stats?.fees?.totalDue || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold text-green-600">₹{stats?.fees?.paid || '—'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-orange-600">₹{stats?.fees?.pending || '—'}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Pay Fees</Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No fee information available
                </p>
                <Button variant="outline" className="w-full">Contact Admin</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">School</p>
              <p className="font-semibold">—</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Parent/Guardian</p>
              <p className="font-semibold">—</p>
            </div>
            <Button variant="outline" className="w-full">View All Contacts</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
