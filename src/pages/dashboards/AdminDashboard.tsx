import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, GraduationCap, School, ClipboardCheck, IndianRupee, FileText,
  UserPlus, CalendarCheck, Receipt, PenSquare, Megaphone, BarChart3, Search, ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardApi, academicApi, academicYearApi, studentApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { showApiError } from '@/lib/api-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';

const quickActions = [
  { label: 'Add Student', icon: UserPlus, route: '/admission', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Mark Attendance', icon: CalendarCheck, route: '/attendance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Fee Structure', icon: Receipt, route: '/fees/structure', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { label: 'Exams', icon: PenSquare, route: '/exams', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Announcements', icon: Megaphone, route: '/announcements', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { label: 'Fee Reports', icon: BarChart3, route: '/fees/reports', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(174, 58%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 65%, 60%)'
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any | null>(null);
  const [feeAnalytics, setFeeAnalytics] = useState<any | null>(null);
  const [academicSummary, setAcademicSummary] = useState<any | null>(null);
  const [currentAcademicSession, setCurrentAcademicSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const res = await studentApi.getAll({ search: searchTerm, limit: 10 });
      setSearchResults(res.data?.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const academicSessionRes = await academicYearApi.getCurrent();
        const sessionId = academicSessionRes.data.data?._id;
        setCurrentAcademicSession(sessionId);
        
        const [statsRes, activitiesRes, attendanceRes, feeRes, academicRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivities(10),
          dashboardApi.getAttendanceAnalytics(6),
          dashboardApi.getFeeAnalytics(6),
          sessionId ? academicApi.getSummary(sessionId) : Promise.resolve({ data: { data: null } })
        ]);
        
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
    <motion.div 
      className="space-y-8 p-6 pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {!loading && !currentAcademicSession && (
        <motion.div variants={itemVariants}>
          <Card className="border-warning bg-warning/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-warning/20 rounded-full blur-3xl" />
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
              <h2 className="text-3xl font-bold text-warning-foreground">Welcome to Bloom Admin! 🚀</h2>
              <p className="text-muted-foreground text-lg">It looks like your school is not fully set up yet. Run the setup wizard to get started quickly.</p>
              <Button onClick={() => navigate('/admin/setup')} size="lg" className="mt-4 shadow-lg hover:shadow-xl transition-all">
                Start Setup Wizard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Complete overview of your school management system</p>
        </div>
      </motion.div>

      {/* Premium Glassmorphism Stats */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Total Students", value: stats.totalStudents.toLocaleString(), icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Total Teachers", value: stats.totalTeachers.toLocaleString(), icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Total Classes", value: stats.totalClasses.toLocaleString(), icon: School, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Today's Attendance", value: `${stats.attendancePercentage}%`, icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Pending Fees", value: stats.pendingFees, icon: IndianRupee, color: "text-red-500", bg: "bg-red-500/10" },
          { title: "Upcoming Exams", value: stats.upcomingExams, icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold tracking-tight mt-1">{stat.value}</h3>
              </div>
            </div>
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${stat.bg} blur-2xl opacity-50`} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Main Chart Area */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Attendance Trends</CardTitle>
                  <CardDescription>Monthly attendance analysis</CardDescription>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceAnalytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={attendanceAnalytics.monthlyTrends.map((item: any) => ({
                    ...item,
                    displayMonth: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  }))}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance']}
                    />
                    <Area type="monotone" dataKey="attendancePercentage" stroke="hsl(160, 60%, 45%)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {loading ? (
                    <div className="flex items-center space-x-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span>Loading Data...</span></div>
                  ) : 'No attendance data available'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Quick Fee Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search student by name or admission number to record payment..." 
                    className="pl-10 h-12 bg-background/80 border-border/50 focus:ring-primary/50 transition-all rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSearching} className="h-12 px-6 rounded-xl shadow-md">
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2"
                  >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Search Results</p>
                    {searchResults.map((student) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={student._id} 
                        className="flex items-center justify-between p-4 bg-card/50 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{student.firstName} {student.lastName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px] bg-muted/50">{student.admissionNumber}</Badge>
                              <span className="text-xs text-muted-foreground">{student.class?.name} {student.section?.name}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all rounded-lg"
                          onClick={() => navigate(`/fees/student/${student._id}`)}
                        >
                          Collect Fees
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <motion.div key={action.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      className="w-full flex h-auto flex-col gap-3 py-6 rounded-xl border-border/50 hover:border-primary/30 hover:bg-background transition-all shadow-sm group"
                      onClick={() => navigate(action.route)}
                    >
                      <div className={`p-3 rounded-full ${action.bg} group-hover:scale-110 transition-transform`}>
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Fee Collection Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {feeAnalytics ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie 
                        data={feeAnalytics.paymentMethods} 
                        cx="50%" cy="50%" 
                        innerRadius={60} outerRadius={80} 
                        paddingAngle={5}
                        dataKey="totalAmount"
                        stroke="none"
                      >
                        {feeAnalytics.paymentMethods.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                        formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4">
                    {feeAnalytics.paymentMethods.map((method: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-[80px]">{method.paymentMethod}</span>
                        </div>
                        <span className="font-semibold">{(method.percentage * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  {loading ? 'Loading...' : 'No data'}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {academicSummary && (
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Class-wise Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={academicSummary.classWiseStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="className" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                  <Bar dataKey="totalStudents" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, i) => {
                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'student_registration': return 'text-primary bg-primary/10';
                        case 'fee_payment': return 'text-success bg-success/10';
                        case 'exam_result': return 'text-warning bg-warning/10';
                        case 'announcement': return 'text-blue-500 bg-blue-500/10';
                        default: return 'text-muted-foreground bg-muted';
                      }
                    };
                    const formatTime = (timestamp: string) => {
                      const diffMins = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
                      if (diffMins < 60) return `${diffMins} mins ago`;
                      const diffHours = Math.floor(diffMins / 60);
                      if (diffHours < 24) return `${diffHours} hours ago`;
                      return `${Math.floor(diffHours / 24)} days ago`;
                    };
                    return (
                      <div key={i} className="flex items-start gap-4 rounded-xl p-3 hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                        <div className={`mt-0.5 p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{activity.description}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-2">{formatTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground py-10">
                    {loading ? 'Loading log...' : 'No recent activities'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
