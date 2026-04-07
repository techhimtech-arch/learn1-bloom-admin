import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { attendanceApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  attendancePercentage: number;
}

const StudentAttendance = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  );
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  // Fetch attendance records
  const {
    data: attendanceData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-attendance', user?.id, selectedMonth],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      try {
        const response = await attendanceApi.getByStudent(user.id);
        // Filter by selected month
        const allRecords = response.data?.data || [];
        const filtered = allRecords.filter((record: AttendanceRecord) => {
          const recordDate = format(new Date(record.date), 'yyyy-MM');
          return recordDate === selectedMonth;
        });
        return filtered;
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Calculate statistics
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      const records = attendanceData as AttendanceRecord[];
      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const leave = records.filter((r) => r.status === 'leave').length;
      const late = records.filter((r) => r.status === 'late').length;
      const percentage =
        total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      setStats({
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        leaveDays: leave,
        lateDays: late,
        attendancePercentage: percentage,
      });
    } else {
      setStats(null);
    }
  }, [attendanceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const attendancePercentage = stats?.attendancePercentage || 0;
  const isLow = attendancePercentage < 75;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your attendance records and monthly statistics
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Attendance Alert */}
      {isLow && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your attendance is below 75%. Please ensure regular attendance.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Attendance %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                {attendancePercentage || 0}%
              </span>
              {isLow ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalDays || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              in {selectedMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.presentDays || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.absentDays || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.leaveDays || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Records
            </CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = format(date, 'yyyy-MM');
                  const label = format(date, 'MMMM yyyy');
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to load attendance records
              </AlertDescription>
            </Alert>
          ) : attendanceData && attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(attendanceData as AttendanceRecord[]).map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-semibold">
                        {format(new Date(record.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), 'EEEE')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.remarks || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No attendance records for {selectedMonth}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            <p>Last 6 months attendance trend visualization</p>
            <p className="mt-2 text-xs">
              📊 Chart component can be integrated here (Chart.js, Recharts, etc.)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
