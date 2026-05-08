import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  TrendingUp, 
  Award, 
  Calendar,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResultDetailModal } from '@/components/exam/ResultDetailModal';
import { studentPortalApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface StudentResult {
  id: string;
  studentId?: string;
  examId: string;
  totalMarks: number;
  obtainedMarks?: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail';
  rank?: number;
  exam?: {
    id: string;
    name: string;
    examType: string;
    startDate: string;
    endDate: string;
    status: string;
    isPublished: boolean;
  };
  subjectResults?: Array<{
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    status: 'pass' | 'fail';
  }>;
}

interface ResultFilters {
  search: string;
  examType: string;
  status: string;
  grade: string;
}

export default function StudentResults() {
  const [filters, setFilters] = useState<ResultFilters>({
    search: '',
    examType: '',
    status: '',
    grade: '',
  });
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const {
    data: resultsData,
    isLoading: resultsLoading,
    refetch,
  } = useQuery({
    queryKey: ['student-results', filters],
    queryFn: async () => {
      const response = await studentPortalApi.getExamResults();
      // New API returns { results: [...], overallPerformance: {...} }
      return response.data;
    },
  });

  const results = resultsData?.data?.results || [];

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

  const getExamTypeColor = (examType: string) => {
    const colors: Record<string, string> = {
      'midterm': 'bg-purple-100 text-purple-800',
      'final': 'bg-red-100 text-red-800',
      'quiz': 'bg-green-100 text-green-800',
      'practical': 'bg-orange-100 text-orange-800',
      'assignment': 'bg-cyan-100 text-cyan-800',
      'test': 'bg-indigo-100 text-indigo-800',
    };
    return colors[examType] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (result: StudentResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  // Calculate statistics
  const totalExams = results.length;
  const passedExams = results.filter(r => r.status === 'pass').length;
  const failedExams = results.filter(r => r.status === 'fail').length;
  const averagePercentage = totalExams > 0 
    ? results.reduce((sum, r) => sum + r.percentage, 0) / totalExams 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-muted-foreground">
            View your examination results and performance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedExams}</div>
            <p className="text-xs text-muted-foreground">
              {totalExams > 0 ? ((passedExams / totalExams) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Award className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedExams}</div>
            <p className="text-xs text-muted-foreground">
              {totalExams > 0 ? ((failedExams / totalExams) * 100).toFixed(1) : 0}% fail rate
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select value={filters.examType} onValueChange={(value) => setFilters(prev => ({ ...prev, examType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="midterm">Midterm</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.grade} onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
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
            Examination Results ({results.length})
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
                {filters.search || filters.examType || filters.status || filters.grade
                  ? 'Try adjusting your filters'
                  : 'No examination results available yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result: StudentResult) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">{result.exam?.name || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getExamTypeColor(result.exam?.examType || '')}>
                          {result.exam?.examType || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {result.exam?.startDate ? format(new Date(result.exam.startDate), 'MMM dd, yyyy') : '-'}
                        </div>
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
          result={selectedResult as any}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
}
