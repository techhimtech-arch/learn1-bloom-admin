import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  BookOpen,
  FileText,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parentApi } from '@/pages/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface ParentDashboardData {
  students: Student[];
  summary: {
    totalStudents: number;
    totalFeesDue: number;
    totalOverdue: number;
    averageAttendance: number;
  };
  latestResults: Array<{
    studentId: string;
    studentName: string;
    examName: string;
    percentage: number;
    grade: string;
    examDate: string;
  }>;
  latestAnnouncements: Array<{
    id: string;
    title: string;
    message: string;
    priority: string;
    createdAt: string;
  }>;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
  } = useQuery({
    queryKey: ['parent-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: null };
      const response = await parentApi.getDashboard();
      return response.data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const students = dashboardData?.data?.students || [];
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [dashboardData, selectedStudent]);

  const data = dashboardData?.data as ParentDashboardData;
  const students = data?.students || [];

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dashboard Not Available</h3>
          <p className="text-muted-foreground">Unable to load parent dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Monitor your children's academic progress
          </p>
        </div>
      </div>

      {/* Student Selector */}
      {students.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedStudent?.id === student.id ? "default" : "outline"}
                  onClick={() => handleStudentSelect(student)}
                  className="flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {student.class?.name} - {student.section?.name}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStudent && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees Due</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{data.summary.totalFeesDue.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{data.summary.totalOverdue.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAttendanceColor(data.summary.averageAttendance)}`}>
                  {data.summary.averageAttendance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Details Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Latest Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Latest Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.latestResults.length === 0 ? (
                      <div className="text-center py-4">
                        <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No results available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.latestResults
                          .filter(result => result.studentId === selectedStudent.id)
                          .slice(0, 3)
                          .map((result, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{result.examName}</h4>
                                <Badge className={getGradeColor(result.grade)}>
                                  {result.grade}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(result.examDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="font-bold">
                                {result.percentage.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Latest Announcements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Latest Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.latestAnnouncements.length === 0 ? (
                      <div className="text-center py-4">
                        <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No announcements</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.latestAnnouncements.slice(0, 3).map((announcement, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-1">{announcement.title}</h4>
                              <Badge className={getPriorityColor(announcement.priority)} variant="outline">
                                {announcement.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {announcement.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Attendance Details</h3>
                    <p className="text-muted-foreground mb-4">
                      View detailed attendance records for {selectedStudent.name}
                    </p>
                    <Button asChild>
                      <Link to={`/parent/student/${selectedStudent.id}/attendance`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Attendance
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Academic Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Results Overview</h3>
                    <p className="text-muted-foreground mb-4">
                      View detailed academic results for {selectedStudent.name}
                    </p>
                    <Button asChild>
                      <Link to={`/parent/student/${selectedStudent.id}/results`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View All Results
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Fee Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Fee Details</h3>
                    <p className="text-muted-foreground mb-4">
                      View detailed fee information and payment history for {selectedStudent.name}
                    </p>
                    <Button asChild>
                      <Link to={`/parent/student/${selectedStudent.id}/fees`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Fee Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="homework" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Homework & Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Homework Overview</h3>
                    <p className="text-muted-foreground mb-4">
                      View pending and submitted homework for {selectedStudent.name}
                    </p>
                    <Button asChild>
                      <Link to={`/parent/student/${selectedStudent.id}/homework`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Homework
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Performance Details</h3>
                    <p className="text-muted-foreground mb-4">
                      View detailed performance analytics and insights for {selectedStudent.name}
                    </p>
                    <Button asChild>
                      <Link to={`/parent/student/${selectedStudent.id}/performance`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Performance
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
