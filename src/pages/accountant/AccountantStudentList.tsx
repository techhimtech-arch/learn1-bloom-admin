import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  CreditCard, 
  ChevronRight,
  Loader2,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { feeApi, classApi, academicYearApi } from '@/services/api';
import { formatINR } from '@/lib/utils';

export default function AccountantStudentList() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch classes and years for dropdowns
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll()
  });

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicYearApi.getAll()
  });

  const classes = classesData?.data?.data || [];
  const years = (yearsData?.data?.data || []).filter((y: any) => y.isActive);

  // Set default academic year
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const activeYear = years.find((y: any) => y.isActive);
      if (activeYear) setSelectedYear(activeYear._id);
    }
  }, [years, selectedYear]);

  // Fetch students fee status
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['class-students-fee', selectedClass, selectedYear, showOnlyPending],
    queryFn: () => feeApi.getClassStudentsFeeStatus({
      classId: selectedClass,
      academicYearId: selectedYear,
      filter: showOnlyPending ? 'pending' : 'all'
    }),
    enabled: !!selectedClass && !!selectedYear
  });

  const students = studentsData?.data?.data || [];

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partial</Badge>;
      case 'PENDING':
        return <Badge variant="destructive">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Fee Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor payment status and collect fees class-wise
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4 items-end">
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y: any) => (
                  <SelectItem key={y._id} value={y._id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <Switch 
              id="pending-only" 
              checked={showOnlyPending} 
              onCheckedChange={setShowOnlyPending}
            />
            <Label htmlFor="pending-only">Show Only Pending</Label>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search student..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Student List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>Please select a class to view student fee status</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading student list...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No students found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission #</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => (
                    <TableRow 
                      key={student.studentId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/fees/student/${student.studentId}`)}
                    >
                      <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="text-right">{formatINR(student.totalAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatINR(student.totalPaid)}</TableCell>
                      <TableCell className="text-right text-destructive font-semibold">
                        {formatINR(student.totalBalance)}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
