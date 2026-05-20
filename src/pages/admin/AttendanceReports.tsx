import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Download, 
  Filter, 
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable, { Column } from '@/components/shared/DataTable';
import { reportApi, classApi, sectionApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  attendancePercentage: number;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Average';
}

interface ReportFilters {
  classId: string;
  sectionId: string;
  startDate: string;
  endDate: string;
}

const AttendanceReports = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    classId: '',
    sectionId: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    lowestAttendance: 0,
    highestAttendance: 0,
  });

  // Fetch classes
  useEffect(() => {
    classApi.getAll()
      .then(res => setClasses(res.data?.data || []))
      .catch(err => showApiError(err));
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (filters.classId) {
      sectionApi.getAll()
        .then(res => {
          const filtered = (res.data?.data || []).filter((s: any) => {
            const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
            return classId === filters.classId;
          });
          setSections(filtered);
        })
        .catch(err => showApiError(err));
    } else {
      setSections([]);
    }
  }, [filters.classId]);

  // Fetch attendance reports
  const { isLoading, refetch } = useQuery({
    queryKey: ['attendance-report', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.sectionId) params.append('sectionId', filters.sectionId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const res = await reportApi.attendance(Object.fromEntries(params));
        
        const data = res.data?.data || [];
        
        // Transform API response to table format
        const transformed: AttendanceRecord[] = data.map((item: any) => ({
          _id: item._id || '',
          studentName: `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.trim() || item.studentName || '-',
          admissionNumber: item.student?.admissionNumber || item.admissionNumber || '-',
          className: item.class?.name || item.className || '-',
          sectionName: item.section?.name || item.sectionName || '-',
          totalDays: item.totalDays || 0,
          presentDays: item.presentDays || 0,
          absentDays: item.absentDays || 0,
          lateDays: item.lateDays || 0,
          leaveDays: item.leaveDays || 0,
          attendancePercentage: item.attendancePercentage || 0,
          status: item.status || 'Average',
        }));

        // Calculate statistics
        if (transformed.length > 0) {
          const avgAttendance = 
            transformed.reduce((sum, r) => sum + r.attendancePercentage, 0) / transformed.length;
          const attendances = transformed.map(r => r.attendancePercentage);
          
          setStats({
            totalStudents: transformed.length,
            averageAttendance: Math.round(avgAttendance * 100) / 100,
            lowestAttendance: Math.min(...attendances),
            highestAttendance: Math.max(...attendances),
          });
        }

        setRecords(transformed);
        return transformed;
      } catch (error) {
        showApiError(error);
        setRecords([]);
        return [];
      }
    },
    enabled: !!filters.classId, // Only run if class is selected
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      showApiError({ response: { data: { message: 'No data to export' } } } as any);
      return;
    }

    const headers = [
      'Student Name',
      'Admission No.',
      'Class',
      'Section',
      'Total Days',
      'Present',
      'Absent',
      'Late',
      'Leave',
      'Attendance %',
    ];

    const rows = records.map(r => [
      r.studentName,
      r.admissionNumber,
      r.className,
      r.sectionName,
      r.totalDays,
      r.presentDays,
      r.absentDays,
      r.lateDays,
      r.leaveDays,
      `${r.attendancePercentage.toFixed(2)}%`,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showApiSuccess(
      { data: { message: 'Report exported successfully' } },
      'Report exported successfully'
    );
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const columns: Column<AttendanceRecord>[] = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'admissionNumber', label: 'Admission No.' },
    { key: 'className', label: 'Class' },
    { key: 'sectionName', label: 'Section' },
    { key: 'totalDays', label: 'Total Days', align: 'center' },
    { key: 'presentDays', label: 'Present', align: 'center' },
    { key: 'absentDays', label: 'Absent', align: 'center' },
    { key: 'lateDays', label: 'Late', align: 'center' },
    { key: 'leaveDays', label: 'Leave', align: 'center' },
    {
      key: 'attendancePercentage',
      label: 'Attendance %',
      align: 'center',
      render: (value: number) => (
        <Badge className={getAttendanceColor(value)}>
          {value.toFixed(2)}%
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Attendance Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          View and analyze attendance data with date range filters
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Class Filter */}
              <div className="space-y-2">
                <Label htmlFor="class-filter">Class *</Label>
                <Select value={filters.classId} onValueChange={v => handleFilterChange('classId', v)}>
                  <SelectTrigger id="class-filter">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Section Filter */}
              <div className="space-y-2">
                <Label htmlFor="section-filter">Section</Label>
                <Select value={filters.sectionId} onValueChange={v => handleFilterChange('sectionId', v)}>
                  <SelectTrigger id="section-filter">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sections</SelectItem>
                    {sections.map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateReport} 
                disabled={!filters.classId || isLoading}
                className="gap-2"
              >
                {isLoading ? 'Loading...' : 'Generate Report'}
              </Button>
              <Button 
                onClick={handleExportCSV}
                variant="outline"
                disabled={records.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {records.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Attendance</p>
                  <p className="text-2xl font-bold">{stats.averageAttendance.toFixed(2)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Highest Attendance</p>
                  <p className="text-2xl font-bold">{stats.highestAttendance.toFixed(2)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Attendance</p>
                  <p className="text-2xl font-bold">{stats.lowestAttendance.toFixed(2)}%</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={records} loading={isLoading} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && filters.classId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No attendance data found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or ensure attendance records exist for the selected period
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceReports;
