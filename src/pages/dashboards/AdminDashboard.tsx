import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, School, ClipboardCheck, IndianRupee, FileText,
  UserPlus, CalendarCheck, Receipt, PenSquare, Megaphone, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatWidget from '@/components/shared/StatWidget';
import { dashboardApi, academicApi, academicYearApi } from '@/services/api';
import { showApiError } from '@/lib/api-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const quickActions = [
  { label: 'Add Student', icon: UserPlus, route: '/admission' },
  { label: 'Mark Attendance', icon: CalendarCheck, route: '/attendance' },
  { label: 'Fee Structure', icon: Receipt, route: '/fees/structure' },
  { label: 'Exams', icon: PenSquare, route: '/exams' },
  { label: 'Announcements', icon: Megaphone, route: '/announcements' },
  { label: 'Fee Reports', icon: BarChart3, route: '/fees/reports' },
];

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(174, 58%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
];

// Types for API responses
interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

interface AttendanceAnalytics {
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    month: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    attendancePercentage: number;
  }>;
  classWiseTrends: Array<{
    className: string;
    attendancePercentage: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
    months: number;
  };
}

interface FeeAnalytics {
  monthlyTrends: Array<{
    month: string;
    totalCollected: number;
    paymentCount: number;
  }>;
  paymentMethods: Array<{
    paymentMethod: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }>;
}

interface AcademicSummary {
  overview: {
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    totalEnrollments: number;
    totalTeachers: number;
  };
  classWiseStats: Array<{
    className: string;
    totalStudents: number;
    maleStudents: number;
    femaleStudents: number;
  }>;
  subjectDistribution: Record<string, number>;
  topTeachers: Array<{
    teacherName: string;
    studentCount: number;
  }>;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendancePercentage: 0,
    pendingFees: '₹0',
    upcomingExams: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [feeAnalytics, setFeeAnalytics] = useState<FeeAnalytics | null>(null);
  const [academicSummary, setAcademicSummary] = useState<AcademicSummary | null>(null);
  const [currentAcademicSession, setCurrentAcademicSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current academic session first
        const academicSessionRes = await academicYearApi.getCurrent();
        const sessionId = academicSessionRes.data.data?._id;
        setCurrentAcademicSession(sessionId);
        
        // Fetch all dashboard data in parallel
        const [
          statsRes,
          activitiesRes,
          attendanceRes,
          feeRes,
          academicRes
        ] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivities(10),
          dashboardApi.getAttendanceAnalytics(6),
          dashboardApi.getFeeAnalytics(6),
          sessionId ? academicApi.getSummary(sessionId) : Promise.resolve({ data: { data: null } })
        ]);
        
        // Update stats
        const statsData = statsRes.data.data;
        if (statsData) {
          setStats({
            totalStudents: statsData.stats?.totalStudents ?? 0,
            totalTeachers: statsData.stats?.totalTeachers ?? 0,
            totalClasses: statsData.stats?.totalClasses ?? 0,
            attendancePercentage: statsData.attendance?.attendancePercentage ?? 0,
            pendingFees: `₹${Number(statsData.fees?.totalPendingFees ?? 0).toLocaleString('en-IN')}`,
            upcomingExams: statsData.exams?.totalExams ?? 0,
          });
        }
        
        // Update other data
        setRecentActivities(activitiesRes.data.data || []);
        setAttendanceAnalytics(attendanceRes.data.data);
        setFeeAnalytics(feeRes.data.data);
        setAcademicSummary(academicRes.data.data);
        
      } catch (err) {
        showApiError(err, 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Complete overview of your school management system</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="Total Students" value={stats.totalStudents.toLocaleString()} icon={GraduationCap} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Total Teachers" value={stats.totalTeachers} icon={Users} iconColor="bg-secondary/10 text-secondary" />
        <StatWidget title="Total Classes" value={stats.totalClasses} icon={School} iconColor="bg-accent/10 text-accent" />
        <StatWidget title="Today's Attendance" value={`${stats.attendancePercentage}%`} icon={ClipboardCheck} iconColor="bg-success/10 text-success" />
        <StatWidget title="Pending Fees" value={stats.pendingFees} icon={IndianRupee} iconColor="bg-warning/10 text-warning" />
        <StatWidget title="Upcoming Exams" value={stats.upcomingExams} icon={FileText} iconColor="bg-destructive/10 text-destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            <CardTitle className="text-lg">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceAnalytics ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceAnalytics.monthlyTrends.map(item => ({
                  ...item,
                  displayMonth: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayMonth" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance']}
                  />
                  <Line type="monotone" dataKey="attendancePercentage" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={{ fill: 'hsl(160, 60%, 45%)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {loading ? 'Loading...' : 'No attendance data available'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {feeAnalytics ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={feeAnalytics.paymentMethods} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="totalAmount" 
                    label={({ paymentMethod, percent }) => `${paymentMethod} ${(percent * 100).toFixed(0)}%`} 
                    labelLine={false}
                  >
                    {feeAnalytics.paymentMethods.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {loading ? 'Loading...' : 'No fee data available'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Attendance Trends */}
      {attendanceAnalytics?.classWiseTrends && attendanceAnalytics.classWiseTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class-wise Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceAnalytics.classWiseTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="className" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance']}
                />
                <Bar 
                  dataKey="attendancePercentage" 
                  fill="hsl(160, 60%, 45%)" 
                  radius={[4, 4, 0, 0]}
                  name="Attendance %"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing attendance percentage for each class over the last {attendanceAnalytics.period?.months || 6} months
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Summary Charts */}
      {academicSummary && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class-wise Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={academicSummary.classWiseStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="className" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="totalStudents" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={Object.entries(academicSummary.subjectDistribution).map(([subject, count]) => ({
                      name: subject,
                      value: count
                    }))} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value" 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                    labelLine={false}
                  >
                    {Object.entries(academicSummary.subjectDistribution).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, i) => {
                const getActivityColor = (type: string) => {
                  switch (type) {
                    case 'student_registration': return 'bg-primary';
                    case 'fee_payment': return 'bg-success';
                    case 'exam_result': return 'bg-warning';
                    case 'announcement': return 'bg-blue-500';
                    default: return 'bg-muted';
                  }
                };
                
                const formatTime = (timestamp: string) => {
                  const date = new Date(timestamp);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  
                  if (diffMins < 60) return `${diffMins} mins ago`;
                  const diffHours = Math.floor(diffMins / 60);
                  if (diffHours < 24) return `${diffHours} hours ago`;
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays} days ago`;
                };
                
                return (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getActivityColor(activity.type)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-4">
                {loading ? 'Loading...' : 'No recent activities'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
