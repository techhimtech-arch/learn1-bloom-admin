import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  TrendingUp,
  AlertTriangle,
  Bell,
  ArrowRight,
  Clock,
  BookOpen,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parentApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface LinkedStudent {
  _id: string;
  name: string;
  admissionNumber: string;
  studentPhoto?: string;
  class?: string;
  section?: string;
}

interface AttendanceSummary {
  studentId: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface FeeDue {
  studentId: string;
  studentName: string;
  totalDue: number;
  paidAmount: number;
  totalAmount: number;
  status: string;
}

interface LatestResult {
  _id: string;
  studentId: string;
  studentName: string;
  examName: string;
  examDate: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
}

interface LatestAnnouncement {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
}

interface ParentDashboardData {
  linkedStudents: LinkedStudent[];
  attendanceSummary: AttendanceSummary[];
  feeDues: FeeDue[];
  latestResults: LatestResult[];
  latestAnnouncements: LatestAnnouncement[];
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
  } = useQuery({
    queryKey: ['parent-dashboard', user?.id],
    queryFn: async () => {
      const response = await parentApi.getDashboard();
      return response.data;
    },
    enabled: !!user?.id,
  });

  const data = dashboardResponse?.data as ParentDashboardData;
  const students = data?.linkedStudents || [];

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      console.log("Setting initial student:", students[0]._id);
      setSelectedStudentId(students[0]._id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    console.log("Current Dashboard Data:", { 
      students, 
      selectedStudentId, 
      selectedStudent: students.find(s => s._id === selectedStudentId) 
    });
  }, [students, selectedStudentId]);

  const selectedStudent = students.find(s => s._id === selectedStudentId);
  const selectedAttendance = data?.attendanceSummary?.find(a => a.studentId === selectedStudentId);
  const selectedFees = data?.feeDues?.find(f => f.studentId === selectedStudentId);
  const studentResults = data?.latestResults?.filter(r => r.studentId === selectedStudentId) || [];

  const getAttendanceData = () => {
    if (!selectedAttendance) return [];
    return [
      { name: 'Present', value: selectedAttendance.present, color: '#10b981' },
      { name: 'Absent', value: selectedAttendance.absent, color: '#ef4444' },
      { name: 'Late', value: selectedAttendance.late, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'bg-red-500 hover:bg-red-600';
      case 'HIGH': return 'bg-orange-500 hover:bg-orange-600';
      case 'MEDIUM': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  if (dashboardLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header & Student Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome, {user?.name || 'Parent'}
          </h1>
          <p className="text-slate-500 mt-1">Here's a look at your children's progress today.</p>
        </div>
        
        {students.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            {students.map((student) => (
              <button
                key={student._id}
                onClick={() => setSelectedStudentId(student._id)}
                className={`relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${
                  selectedStudentId === student._id 
                    ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarImage src={student.studentPhoto} />
                  <AvatarFallback className={selectedStudentId === student._id ? 'bg-white/20 text-white' : 'bg-slate-200'}>
                    {student.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-none">{student.name || student.admissionNumber}</p>
                  <p className={`text-[10px] opacity-80 ${selectedStudentId === student._id ? 'text-white' : 'text-slate-500'}`}>
                    {student.class} {student.section}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedStudent ? (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-600">No students linked to your account</h2>
            <p className="text-slate-400 max-w-xs mt-2">Please contact the school administration to link your children's profiles.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Top Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Attendance Donut Chart */}
              <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-emerald-500" />
                      Attendance Snapshot
                    </CardTitle>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Current: {selectedAttendance?.percentage || 0}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px] w-full flex items-center justify-center">
                    {selectedAttendance && selectedAttendance.total > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getAttendanceData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getAttendanceData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-400">
                        <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No records for this month</p>
                      </div>
                    )}
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800">{selectedAttendance?.percentage || 0}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Overall</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-slate-600">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-xs font-medium text-slate-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-slate-600">Late</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Alert Card */}
              <Card className={`overflow-hidden border-none shadow-lg ${selectedFees && selectedFees.totalDue > 0 ? 'bg-orange-50' : 'bg-white'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className={`h-5 w-5 ${selectedFees && selectedFees.totalDue > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                    Fee Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Pending Balance</p>
                      <h3 className="text-3xl font-black text-slate-900">₹{selectedFees?.totalDue.toLocaleString('en-IN') || 0}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Paid: ₹{selectedFees?.paidAmount.toLocaleString('en-IN') || 0}</span>
                        <span>Total: ₹{selectedFees?.totalAmount.toLocaleString('en-IN') || 0}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${selectedFees ? (selectedFees.paidAmount / selectedFees.totalAmount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6" asChild>
                      <Link to={`/parent/student/${selectedStudentId}/fees`}>
                        Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Bar Chart */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-500" />
                      Recent Performance
                    </CardTitle>
                    <CardDescription>Subject-wise marks in recent exams</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" asChild>
                    <Link to={`/parent/student/${selectedStudentId}/results`}>View Report Card</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {studentResults.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="subjectName" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          fill="#6366f1" 
                          radius={[6, 6, 0, 0]} 
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Award className="h-12 w-12 opacity-10 mb-2" />
                      <p>No recent results found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Right Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Announcements Notice Board */}
            <Card className="border-none shadow-lg h-full max-h-[600px] flex flex-col">
              <CardHeader className="bg-slate-900 text-white rounded-t-2xl pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-400" />
                    Notice Board
                  </CardTitle>
                  {data?.latestAnnouncements?.length > 0 && (
                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                      {data.latestAnnouncements.length} New
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="overflow-y-auto max-h-[480px] px-4 py-4 space-y-4">
                  {data?.latestAnnouncements?.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Bell className="h-10 w-10 mx-auto mb-2 opacity-10" />
                      <p>No new announcements</p>
                    </div>
                  ) : (
                    data.latestAnnouncements.map((announcement) => (
                      <div 
                        key={announcement._id} 
                        className="group p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${getPriorityColor(announcement.priority)} text-[10px] px-2 py-0`}>
                            {announcement.priority}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {format(new Date(announcement.createdAt), 'MMM dd')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                          {announcement.title}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {announcement.message}
                        </p>
                        <Link 
                          to="/announcements" 
                          className="inline-flex items-center text-[10px] font-bold text-primary mt-3 hover:gap-1.5 transition-all"
                        >
                          READ MORE <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 mt-auto">
                  <Button variant="outline" className="w-full rounded-xl font-bold text-slate-600" asChild>
                    <Link to="/announcements">View All Notices</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to={`/parent/student/${selectedStudentId}/attendance`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Attendance</span>
              </Link>
              
              <Link 
                to={`/parent/student/${selectedStudentId}/homework`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Homework</span>
              </Link>

              <Link 
                to={`/parent/student/${selectedStudentId}/results`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Exams</span>
              </Link>

              <Link 
                to={`/parent/student/${selectedStudentId}/timetable`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Timetable</span>
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
