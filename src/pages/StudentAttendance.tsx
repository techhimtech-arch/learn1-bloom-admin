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
  ChevronLeft,
  ChevronRight,
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
import { studentPortalApi } from '@/pages/services/api';
import { format } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  enrollmentId: string;
  date?: string;
  status?: 'Present' | 'Absent' | 'Late' | 'Leave';
  remarks?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Fetch attendance records
  const {
    data: attendanceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['student-attendance', currentPage],
    queryFn: async () => {
      try {
        const response = await studentPortalApi.getAttendance();
        const responseData = response.data?.data || {};
        const records = responseData.attendance || [];
        const paginationData = response.data?.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0 };
        
        setPagination(paginationData);
        return records;
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        return [];
      }
    },
  });

  // Calculate statistics
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      const records = attendanceData as AttendanceRecord[];
      const total = records.length;
      const present = records.filter((r) => r.status?.toLowerCase() === 'present').length;
      const absent = records.filter((r) => r.status?.toLowerCase() === 'absent').length;
      const leave = records.filter((r) => r.status?.toLowerCase() === 'leave').length;
      const late = records.filter((r) => r.status?.toLowerCase() === 'late').length;
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

  const getStatusColor = (status?: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
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

  const getStatusLabel = (status?: string) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
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
            Track your attendance records and statistics
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Attendance Alert */}
      {isLow && stats && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your attendance is {attendancePercentage}%, below 75%. Please ensure regular attendance.
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
              Records
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
              Late / Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className="text-yellow-600">{stats?.lateDays || 0}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-blue-600">{stats?.leaveDays || 0}</span>
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
            <div className="text-sm text-muted-foreground">
              {pagination && (
                <span>Page {pagination.currentPage} of {pagination.totalPages} | {pagination.totalRecords} Total Records</span>
              )}
            </div>
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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(attendanceData as AttendanceRecord[]).map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-semibold">
                          {record.date ? format(new Date(record.date), 'dd MMM yyyy') : '—'}
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

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No attendance records found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Info */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        attendancePercentage >= 75 ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-lg">{attendancePercentage}%</span>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Status</p>
                <p className={`font-semibold text-lg ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {attendancePercentage >= 75 ? '✓ Satisfactory' : '✗ Below Target'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAttendance;
