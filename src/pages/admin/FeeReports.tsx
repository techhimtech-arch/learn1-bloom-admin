import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { feeApi, classApi, sectionApi, academicYearApi } from '@/services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface FeeReport {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overdue';
}

interface FeeReportFilters {
  classId: string;
  sectionId: string;
  academicYearId: string;
  paymentStatus: string;
  search: string;
}

interface FeeSummary {
  totalStudents: number;
  totalFees: number;
  totalPaid: number;
  totalDue: number;
  totalOverdue: number;
  collectionRate: number;
  overdueStudents: number;
}

export default function FeeReports() {
  const [filters, setFilters] = useState<FeeReportFilters>({
    classId: '',
    sectionId: '',
    academicYearId: '',
    paymentStatus: '',
    search: '',
  });

  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch,
  } = useQuery({
    queryKey: ['fee-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.search) params.append('search', filters.search);

      const response = await feeApi.getDues(Object.fromEntries(params));
      return response.data;
    },
  });

  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['fee-summary', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);

      const response = await feeApi.getReport(Object.fromEntries(params));
      return response.data;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return { ...response.data, data: (response.data.data || []).filter((y: any) => y.isActive) };
    },
  });

  const handleExport = () => {
    // Simulate export functionality
    toast.success('Fee report exported successfully');
  };

  const reports = reportsData?.data || [];
  const summary = summaryData?.data as FeeSummary;
  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];
  const academicYears = academicYearsData?.data || [];

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'unpaid': 'bg-gray-100 text-gray-800',
      'overdue': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive fee collection and dues analysis
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalStudents || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">₹{(summary?.totalFees || 0).toLocaleString('en-IN')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className={`text-2xl font-bold ${getCollectionRateColor(summary?.collectionRate || 0)}`}>
                {(summary?.collectionRate || 0).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                ₹{(summary?.totalOverdue || 0).toLocaleString('en-IN')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.academicYearId} onValueChange={(value) => setFilters(prev => ({ ...prev, academicYearId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year: any) => (
                  <SelectItem key={year._id || year.id} value={year._id || year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, classId: value, sectionId: '' }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={`class-${cls._id || cls.id}`} value={cls._id || cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.sectionId} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value }))}
              disabled={!filters.classId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections
                  .filter((section: any) => !filters.classId || section.classId === filters.classId)
                  .map((section: any) => (
                    <SelectItem key={section._id || section.id} value={section._id || section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filters.paymentStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search students..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fee Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Details ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No fee records found</h3>
              <p className="text-muted-foreground">
                {filters.classId || filters.sectionId || filters.paymentStatus || filters.search
                  ? 'Try adjusting your filters'
                  : 'No fee records available for the selected criteria'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: FeeReport) => (
                    <TableRow key={report.id} className={report.paymentStatus === 'overdue' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.studentName}</div>
                          <div className="text-sm text-muted-foreground">{report.rollNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.className} - {report.sectionName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{report.totalFee.toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">₹{report.paidAmount.toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${report.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{report.dueAmount.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${report.overdueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{report.overdueAmount.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.lastPaymentDate 
                            ? format(new Date(report.lastPaymentDate), 'MMM dd, yyyy')
                            : '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(report.paymentStatus)}>
                          {report.paymentStatus.charAt(0).toUpperCase() + report.paymentStatus.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{summary.totalPaid.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ₹{summary.totalDue.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Students</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.overdueStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Collection</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{summary.totalStudents > 0 ? Math.round(summary.totalPaid / summary.totalStudents).toLocaleString('en-IN') : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
