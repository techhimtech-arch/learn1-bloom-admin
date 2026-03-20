import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, School, ClipboardCheck, IndianRupee, FileText,
  UserPlus, CalendarCheck, Receipt, PenSquare, Megaphone, BarChart3,
  BookOpen, TrendingUp, Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatWidget from '@/components/shared/StatWidget';
import { AcademicSummaryCards, 
  ClassStatsTable, 
  TeacherWorkloadTable, 
  EnrollmentTrendChart,
  UpcomingAcademicEvents 
} from '@/components/academic/AcademicSummaryWidgets';
import { 
  AdminDashboardWidgets, 
  TeacherDashboardWidgets, 
  StudentDashboardWidgets 
} from '@/components/dashboard/Phase4Widgets';
import { 
  AdminDashboardWidgets as Phase5AdminWidgets, 
  ParentDashboardWidgets as Phase5ParentWidgets
} from '@/components/dashboard/Phase5Widgets';
import { dashboardApi, teacherApi } from '@/services/api';
import { showApiError } from '@/lib/api-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminDashboard from './dashboards/AdminDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';

const quickActions = [
  { label: 'Add Student', icon: UserPlus, route: '/admission' },
  { label: 'Mark Attendance', icon: CalendarCheck, route: '/attendance' },
  { label: 'Record Fee', icon: Receipt, route: '/' },
  { label: 'New Exam', icon: PenSquare, route: '/' },
  { label: 'Announcement', icon: Megaphone, route: '/' },
  { label: 'Generate Report', icon: BarChart3, route: '/' },
  { label: 'Manage Subjects', icon: BookOpen, route: '/subjects' },
  { label: 'Timetable', icon: Calendar, route: '/timetable' },
];

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(174, 58%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
];

const mockAttendanceChart = [
  { day: 'Mon', present: 1150, absent: 50 },
  { day: 'Tue', present: 1120, absent: 80 },
  { day: 'Wed', present: 1180, absent: 20 },
  { day: 'Thu', present: 1100, absent: 100 },
  { day: 'Fri', present: 1140, absent: 60 },
];

const mockFeeChart = [
  { name: 'Collected', value: 2500000 },
  { name: 'Pending', value: 500000 },
];
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendancePercentage: 0,
    pendingFees: '₹0',
    upcomingExams: 0,
  });

  useEffect(() => {
    const getDashboardStats = () => {
      switch (user?.role) {
        case 'teacher':
          return teacherApi.getDashboard();
        case 'parent':
          return dashboardApi.getParentStats();
        case 'student':
          return dashboardApi.getStudentStats();
        case 'accountant':
          return dashboardApi.getAccountantStats();
        case 'school_admin':
        default:
          return dashboardApi.getStats();
      }
    };

    getDashboardStats()
      .then(({ data: res }) => {
        const d = res.data;
        if (d) {
          setStats({
            totalStudents: d.stats?.totalStudents ?? 0,
            totalTeachers: d.stats?.totalTeachers ?? 0,
            totalClasses: d.stats?.totalClasses ?? 0,
            attendancePercentage: d.attendance?.attendancePercentage ?? 0,
            pendingFees: `₹${Number(d.fees?.totalPendingFees ?? 0).toLocaleString('en-IN')}`,
            upcomingExams: d.exams?.totalExams ?? 0,
          });
        }
      })
      .catch((err) => {
        showApiError(err, 'Failed to load dashboard data');
      });
  }, [user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your school management system</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatWidget title="Total Students" value={stats.totalStudents.toLocaleString()} change="12% this month" changeType="positive" icon={GraduationCap} iconColor="bg-primary/10 text-primary" />
            <StatWidget title="Total Teachers" value={stats.totalTeachers} change="3% this month" changeType="positive" icon={Users} iconColor="bg-secondary/10 text-secondary" />
            <StatWidget title="Total Classes" value={stats.totalClasses} change="Same as last" changeType="neutral" icon={School} iconColor="bg-accent/10 text-accent" />
            <StatWidget title="Today's Attendance" value={`${stats.attendancePercentage}%`} change="1,150 present" changeType="positive" icon={ClipboardCheck} iconColor="bg-success/10 text-success" />
            <StatWidget title="Pending Fees" value={stats.pendingFees} change="125 students" changeType="negative" icon={IndianRupee} iconColor="bg-warning/10 text-warning" />
            <StatWidget title="Upcoming Exams" value={stats.upcomingExams} change="Next week" changeType="neutral" icon={FileText} iconColor="bg-destructive/10 text-destructive" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="flex h-auto flex-col gap-2 py-4"
                    onClick={() => navigate(action.route)}
                  >
                    <action.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockAttendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="present" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee Collection</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={mockFeeChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {mockFeeChart.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: 'New student Priya Sharma admitted to Class 10-A', time: '2 mins ago', color: 'bg-primary' },
                  { text: 'Attendance marked for Class 8-B', time: '15 mins ago', color: 'bg-success' },
                  { text: 'Fee payment received from Rahul Kumar - ₹5,000', time: '1 hour ago', color: 'bg-warning' },
                  { text: 'Mid-term exam schedule published', time: '3 hours ago', color: 'bg-secondary' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${activity.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          {/* Phase 5 Widgets based on user role */}
          {user?.role === 'school_admin' && <Phase5AdminWidgets />}
          {user?.role === 'parent' && <Phase5ParentWidgets />}
          
          {/* Phase 4 Widgets based on user role */}
          {user?.role === 'school_admin' && <AdminDashboardWidgets />}
          {user?.role === 'teacher' && <TeacherDashboardWidgets />}
          {user?.role === 'student' && <StudentDashboardWidgets />}
          
          {/* Original Academic Widgets */}
          <AcademicSummaryCards />
          
          <div className="grid gap-4 lg:grid-cols-2">
            <ClassStatsTable />
            <UpcomingAcademicEvents />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TeacherWorkloadTable />
            <EnrollmentTrendChart />
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database Connection</span>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Services</span>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Backup Status</span>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Usage</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground">2024-03-18 10:30 - User login: admin@example.com</div>
                  <div className="text-muted-foreground">2024-03-18 10:25 - Attendance marked for Class 9-A</div>
                  <div className="text-muted-foreground">2024-03-18 10:20 - New student registered</div>
                  <div className="text-muted-foreground">2024-03-18 10:15 - Fee payment received</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
