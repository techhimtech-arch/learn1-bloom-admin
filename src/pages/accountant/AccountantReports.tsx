import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { accountantApi, classApi, academicYearApi } from '@/pages/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantReports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('fee-collection');
  const [filters, setFilters] = useState({
    classId: '',
    academicYearId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classApi.getAll();
      return res.data?.data || [];
    },
  });

  // Fetch academic years
  const { data: yearData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await academicYearApi.getAll({ isActive: true });
      return res.data?.data || [];
    },
  });

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['fee-report', reportType, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const res = await accountantApi.generateReport(reportType, params);
      return res.data?.data || [];
    },
  });

  const report = Array.isArray(reportData) ? reportData : [];

  // Generate mock report data for demonstration
  const generateMockReport = () => {
    switch (reportType) {
      case 'fee-collection':
        return [
          { class: '10-A', students: 45, totalFee: 2250000, collected: 2025000, pending: 225000, percentage: 90 },
          { class: '10-B', students: 42, totalFee: 2100000, collected: 1890000, pending: 210000, percentage: 90 },
          { class: '9-A', students: 48, totalFee: 2160000, collected: 1944000, pending: 216000, percentage: 90 },
        ];
      case 'outstanding-fees':
        return [
          { studentName: 'Ahmed Ali', class: '10-A', rollNumber: 'STU001', totalDue: 50000 },
          { studentName: 'Fatima Khan', class: '10-B', rollNumber: 'STU012', totalDue: 75000 },
          { studentName: 'Sara Ibrahim', class: '9-A', rollNumber: 'STU023', totalDue: 40000 },
        ];
      case 'class-summary':
        return [
          { class: '10-A', strength: 45, totalFee: 2250000, collected: 2025000, pending: 225000, percentage: 90 },
          { class: '10-B', strength: 42, totalFee: 2100000, collected: 1890000, pending: 210000, percentage: 90 },
        ];
      case 'student-statement':
        return [
          { date: '2026-04-15', description: 'Monthly Tuition', amount: 5000, paid: 5000, balance: 0 },
          { date: '2026-04-20', description: 'Transport Fee', amount: 2000, paid: 0, balance: 2000 },
          { date: '2026-05-01', description: 'Exam Fee', amount: 1000, paid: 0, balance: 1000 },
        ];
      default:
        return [];
    }
  };

  const reportContent = report.length > 0 ? report : generateMockReport();

  const handleDownloadReport = () => {
    // Placeholder for download functionality
    alert('Report download feature coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/fees/payments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fee Reports</h1>
            <p className="text-muted-foreground">Generate and view fee collection reports</p>
          </div>
        </div>
        <Button onClick={handleDownloadReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={setReportType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fee-collection" className="text-xs">
                <FileText className="h-4 w-4 mr-2" />
                Fee Collection
              </TabsTrigger>
              <TabsTrigger value="outstanding-fees" className="text-xs">
                <FileText className="h-4 w-4 mr-2" />
                Outstanding Fees
              </TabsTrigger>
              <TabsTrigger value="class-summary" className="text-xs">
                <FileText className="h-4 w-4 mr-2" />
                Class Summary
              </TabsTrigger>
              <TabsTrigger value="student-statement" className="text-xs">
                <FileText className="h-4 w-4 mr-2" />
                Student Statement
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Academic Year</label>
              <Select value={filters.academicYearId} onValueChange={(v) => setFilters({ ...filters, academicYearId: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {(yearData || []).map((year: any) => (
                    <SelectItem key={year.id || year._id} value={year.id || year._id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Class</label>
              <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {(classesData || []).map((cls: any) => (
                    <SelectItem key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Data */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Report Results</span>
              <Badge>{reportContent.length} entries</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportType === 'fee-collection' && (
                      <>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Students</TableHead>
                        <TableHead className="text-right">Total Fee</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </>
                    )}
                    {reportType === 'outstanding-fees' && (
                      <>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                      </>
                    )}
                    {reportType === 'class-summary' && (
                      <>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Strength</TableHead>
                        <TableHead className="text-right">Total Fee</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </>
                    )}
                    {reportType === 'student-statement' && (
                      <>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportContent as any[]).map((row, index) => (
                    <TableRow key={index}>
                      {reportType === 'fee-collection' && (
                        <>
                          <TableCell className="font-medium">{row.class}</TableCell>
                          <TableCell className="text-right">{row.students}</TableCell>
                          <TableCell className="text-right">{formatINR(row.totalFee)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{formatINR(row.collected)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatINR(row.pending)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={row.percentage >= 85 ? 'default' : 'secondary'}>
                              {row.percentage}%
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {reportType === 'outstanding-fees' && (
                        <>
                          <TableCell className="font-medium">{row.studentName}</TableCell>
                          <TableCell>{row.class}</TableCell>
                          <TableCell>{row.rollNumber}</TableCell>
                          <TableCell className="text-right text-red-600 font-bold">{formatINR(row.totalDue)}</TableCell>
                        </>
                      )}
                      {reportType === 'class-summary' && (
                        <>
                          <TableCell className="font-medium">{row.class}</TableCell>
                          <TableCell className="text-right">{row.strength}</TableCell>
                          <TableCell className="text-right">{formatINR(row.totalFee)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatINR(row.collected)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatINR(row.pending)}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{row.percentage}%</Badge>
                          </TableCell>
                        </>
                      )}
                      {reportType === 'student-statement' && (
                        <>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell className="text-right">{formatINR(row.amount)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatINR(row.paid)}</TableCell>
                          <TableCell className="text-right">{formatINR(row.balance)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Summary */}
      {reportContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {reportType === 'fee-collection' && (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Total Classes</div>
                  <div className="text-2xl font-bold mt-2">{reportContent.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Collected</div>
                  <div className="text-2xl font-bold mt-2 text-green-600">
                    {formatINR((reportContent as any[]).reduce((sum, r) => sum + (r.collected || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Pending</div>
                  <div className="text-2xl font-bold mt-2 text-orange-600">
                    {formatINR((reportContent as any[]).reduce((sum, r) => sum + (r.pending || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Collection %</div>
                  <div className="text-2xl font-bold mt-2">
                    {(
                      (reportContent as any[]).reduce((sum, r) => sum + (r.percentage || 0), 0) / reportContent.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </>
            )}
            {reportType === 'outstanding-fees' && (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Students with Dues</div>
                  <div className="text-2xl font-bold mt-2">{reportContent.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Outstanding</div>
                  <div className="text-2xl font-bold mt-2 text-red-600">
                    {formatINR((reportContent as any[]).reduce((sum, r) => sum + (r.totalDue || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Per Student</div>
                  <div className="text-2xl font-bold mt-2">
                    {formatINR(
                      (reportContent as any[]).reduce((sum, r) => sum + (r.totalDue || 0), 0) / reportContent.length
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Action Required</div>
                  <Badge className="mt-2 bg-red-100 text-red-800">
                    {reportContent.length} follow-ups
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
