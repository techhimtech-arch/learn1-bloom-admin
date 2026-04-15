import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { parentApi } from '@/pages/services/api';
import { format } from 'date-fns';

const getAttendanceColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 75) return 'text-blue-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'present': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'late': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export function AttendanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-attendance', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildAttendance(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load attendance data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const attendance = data as any;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{attendance.summary?.totalDays || 0}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{attendance.summary?.presentDays || 0}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{attendance.summary?.absentDays || 0}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`text-2xl font-bold ${getAttendanceColor(attendance.summary?.percentage || 0)}`}>
              {(attendance.summary?.percentage || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${
                (attendance.summary?.percentage || 0) >= 90 ? 'bg-green-600' :
                (attendance.summary?.percentage || 0) >= 75 ? 'bg-blue-600' :
                (attendance.summary?.percentage || 0) >= 60 ? 'bg-yellow-600' :
                'bg-red-600'
              }`}
              style={{ width: `${Math.min(attendance.summary?.percentage || 0, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {(attendance.summary?.percentage || 0).toFixed(1)}% ({attendance.summary?.presentDays || 0}/{attendance.summary?.totalDays || 0} days)
          </p>
        </CardContent>
      </Card>

      {/* Recent Records */}
      {attendance.records && attendance.records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Recent Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendance.records.slice(0, 10).map((record: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {format(new Date(record.date), 'MMM dd, yyyy')} ({format(new Date(record.date), 'eeee')})
                    </div>
                    {record.remarks && <div className="text-xs text-muted-foreground">{record.remarks}</div>}
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
