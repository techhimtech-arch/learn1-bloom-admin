import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  Download,
  Eye,
  Filter,
  Search,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResultDetailModal } from '@/components/exam/ResultDetailModal';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { examApi, classApi, sectionApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentResult {
  id: string;
  studentId: string;
  examId: string;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail';
  rank?: number;
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  subjectResults?: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    maxMarks: number;
    passingMarks: number;
    grade: string;
    status: 'pass' | 'fail';
  }>;
}

interface Exam {
  id: string;
  name: string;
  examType: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: string;
  isPublished: boolean;
}

interface ResultFilters {
  search: string;
  classId: string;
  sectionId: string;
  status: string;
  grade: string;
}

export default function ResultDashboard() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ResultFilters>({
    search: '',
    classId: '',
    sectionId: '',
    status: '',
    grade: '',
  });
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: resultsData,
    isLoading: resultsLoading,
    refetch,
  } = useQuery({
    queryKey: ['exam-results', examId, filters],
    queryFn: async () => {
      if (!examId) return { data: [] };
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.status) params.append('status', filters.status);
      if (filters.grade) params.append('grade', filters.grade);

      const response = await examApi.getResults(examId, Object.fromEntries(params));
      return response.data;
    },
    enabled: !!examId,
  });

  const { data: examData } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return { data: null };
      const response = await examApi.getById(examId);
      return response.data;
    },
    enabled: !!examId,
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

  useEffect(() => {
    if (!examId) {
      navigate('/exams');
    }
  }, [examId, navigate]);

  const exam = examData?.data as Exam;
  const results = resultsData?.data || [];
  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];

  // Publish/Unpublish mutations
  const publishMutation = useMutation({
    mutationFn: () => examApi.publishResults(examId!),
    onSuccess: () => {
      toast.success('Results published successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish results');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => examApi.unpublishResults(examId!),
    onSuccess: () => {
      toast.success('Results unpublished successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish results');
    },
  });

  if (!examId || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Exam Not Found</h3>
          <p className="text-muted-foreground">The requested exam could not be found.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = results.length;
  const passedStudents = results.filter(r => r.status === 'pass').length;
  const failedStudents = results.filter(r => r.status === 'fail').length;
  const averagePercentage = totalStudents > 0 
    ? results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents 
    : 0;

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

  const getStatusColor = (status: string) => {
    return status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleViewDetails = (result: StudentResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const downloadResults = () => {
    // Create CSV content
    const headers = ['Roll Number', 'Student Name', 'Class', 'Section', 'Total Marks', 'Max Marks', 'Percentage', 'Grade', 'Status'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.student?.rollNumber || '',
        result.student?.name || '',
        result.student?.class || '',
        result.student?.section || '',
        result.totalMarks,
        result.maxTotalMarks,
        result.percentage.toFixed(2),
        result.grade,
        result.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${exam.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Result Dashboard</h1>
          <p className="text-muted-foreground">
            Results for: <span className="font-medium">{exam.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={exam.isPublished ? "default" : "secondary"}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </Badge>
          
          <PermissionGuard permission="publish_results">
            <Button
              variant={exam.isPublished ? "outline" : "default"}
              onClick={() => exam.isPublished ? unpublishMutation.mutate() : publishMutation.mutate()}
              disabled={publishMutation.isPending || unpublishMutation.isPending}
            >
              {exam.isPublished ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unpublish Results
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Publish Results
                </>
              )}
            </Button>
          </PermissionGuard>

          <Button onClick={downloadResults} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0 ? ((failedStudents / totalStudents) * 100).toFixed(1) : 0}% fail rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Percentage</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePercentage.toFixed(1)}%</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={`class-${cls.id || cls._id}`} value={cls.id || cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sectionId} onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section: any) => (
                  <SelectItem key={`section-${section.id || section._id}`} value={section.id || section._id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.grade} onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Grades</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Student Results ({results.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No results found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.classId || filters.sectionId || filters.status || filters.grade
                  ? 'Try adjusting your filters'
                  : 'No results available for this exam yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result: StudentResult, index) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">
                          {result.rank || index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{result.student?.name || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{result.student?.rollNumber || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {result.student?.class} - {result.student?.section}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {result.totalMarks} / {result.maxTotalMarks}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{result.percentage.toFixed(1)}%</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(result.grade)}>
                          {result.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye className="h-4 w-4" />
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

      {showDetailModal && selectedResult && (
        <ResultDetailModal
          result={selectedResult}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
}
