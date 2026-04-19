import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { academicApi } from '@/pages/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function AcademicSummaryCards() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['academic-summary'],
    queryFn: async () => {
      const response = await academicApi.getSummary('');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-8 mb-2" />
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summary = summaryData?.data || {};

  const cards = [
    {
      title: 'Total Classes',
      value: summary.totalClasses || 0,
      change: '+2 this semester',
      changeType: 'positive' as const,
      icon: BookOpen,
      iconColor: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Sections',
      value: summary.totalSections || 0,
      change: '+4 this semester',
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'bg-green-100 text-green-600',
    },
    {
      title: 'Total Subjects',
      value: summary.totalSubjects || 0,
      change: '+5 this semester',
      changeType: 'positive' as const,
      icon: BookOpen,
      iconColor: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Total Enrollments',
      value: summary.totalEnrollments || 0,
      change: '+12% this year',
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconColor: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Total Teachers',
      value: summary.totalTeachers || 0,
      change: '+3 this semester',
      changeType: 'positive' as const,
      icon: UserCheck,
      iconColor: 'bg-cyan-100 text-cyan-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${card.iconColor}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <span className={`text-xs ${
                card.changeType === 'positive' ? 'text-green-600' : 
                card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {card.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold">{card.value.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ClassStatsTable() {
  const { data: classStatsData, isLoading } = useQuery({
    queryKey: ['class-stats'],
    queryFn: async () => {
      const response = await academicApi.getClassStats('all', '');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const classStats = classStatsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classStats.map((classStat: any) => (
            <div key={classStat.classId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{classStat.className}</h4>
                  <p className="text-sm text-muted-foreground">
                    {classStat.totalStudents} students • {classStat.totalSections} sections
                  </p>
                </div>
                <Badge variant="outline">
                  {classStat.totalSubjects} subjects
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Gender Distribution</span>
                  <span>{classStat.maleCount}M / {classStat.femaleCount}F</span>
                </div>
                <Progress value={(classStat.maleCount / classStat.totalStudents) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-blue-600">{classStat.passRate}%</div>
                  <div className="text-muted-foreground">Pass Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{classStat.attendanceRate}%</div>
                  <div className="text-muted-foreground">Attendance</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">{classStat.avgScore}</div>
                  <div className="text-muted-foreground">Avg Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherWorkloadTable() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['academic-summary'],
    queryFn: async () => {
      const response = await academicApi.getSummary('');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Hours/Week</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  const teacherWorkload = summaryData?.data?.teacherWorkload || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Hours/Week</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teacherWorkload.map((teacher: any) => (
              <TableRow key={teacher.teacherId}>
                <TableCell>
                  <div>
                    <div className="font-medium">{teacher.teacherName}</div>
                    <div className="text-sm text-muted-foreground">{teacher.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {teacher.subjects.map((subject: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {teacher.classes.map((cls: string, index: number) => (
                      <div key={index} className="text-sm">{cls}</div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{teacher.weeklyHours}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={teacher.workloadStatus === 'optimal' ? 'default' : 'secondary'}
                    className={
                      teacher.workloadStatus === 'overloaded' ? 'bg-red-100 text-red-800' :
                      teacher.workloadStatus === 'underloaded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                  >
                    {teacher.workloadStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function EnrollmentTrendChart() {
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['enrollment-trends'],
    queryFn: async () => {
      const response = await academicApi.getEnrollmentTrends('');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const trends = trendsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              fontSize={12} 
              stroke="hsl(var(--muted-foreground))" 
            />
            <YAxis 
              fontSize={12} 
              stroke="hsl(var(--muted-foreground))" 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '8px' 
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="enrollments" 
              stroke="hsl(217, 91%, 60%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function UpcomingAcademicEvents() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['academic-summary'],
    queryFn: async () => {
      const response = await academicApi.getSummary('');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Academic Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingEvents = summaryData?.data?.upcomingEvents || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Academic Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                event.type === 'exam' ? 'bg-red-100 text-red-600' :
                event.type === 'holiday' ? 'bg-green-100 text-green-600' :
                event.type === 'event' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {event.type === 'exam' ? <AlertCircle className="h-4 w-4" /> :
                 event.type === 'holiday' ? <CheckCircle className="h-4 w-4" /> :
                 <Calendar className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {event.date} • {event.venue || 'TBA'}
                </p>
              </div>
              <Badge variant="outline">{event.type}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
