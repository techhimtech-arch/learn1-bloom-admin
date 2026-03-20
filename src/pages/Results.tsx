import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Download, FileText, CheckCircle, XCircle, AlertTriangle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { ResultDetailModal } from '@/components/exam/ResultDetailModal';
import { examApi, classApi, sectionApi } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Result {
  id: string;
  examId: string;
  studentId: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  status: 'pass' | 'fail';
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
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

export default function Results() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [filters, setFilters] = useState({
    classId: '',
    sectionId: '',
    search: '',
  });
  const [publishing, setPublishing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: resultsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['exam-results', examId, filters],
    queryFn: async () => {
      if (!examId) return { data: [] };
      const response = await examApi.getResults(examId, filters);
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

  const { data: classSectionsData } = useQuery({
    queryKey: ['sections', 'class', filters.classId],
    queryFn: async () => {
      if (!filters.classId) return { data: [] };
      const response = await sectionApi.getByClass(filters.classId);
      return response.data;
    },
    enabled: !!filters.classId,
  });

  const publishMutation = useMutation({
    mutationFn: () => examApi.publishResults(examId!),
    onSuccess: () => {
      toast.success('Results published successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setPublishing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish results');
      setPublishing(false);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => examApi.unpublishResults(examId!),
    onSuccess: () => {
      toast.success('Results unpublished successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setPublishing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish results');
      setPublishing(false);
    },
  });

  const handleViewDetails = (result: Result) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const handlePublish = () => {
    setPublishing(true);
    publishMutation.mutate();
  };

  const handleUnpublish = () => {
    setPublishing(true);
    unpublishMutation.mutate();
  };

  const handleDownloadResults = () => {
    // Generate CSV data
    const csvContent = [
      'Roll Number,Student Name,Class,Section,Total Marks,Obtained Marks,Percentage,Grade,Status',
      ...results.map((result: Result) => [
        result.student?.rollNumber || '',
        result.student?.name || '',
        result.student?.class || '',
        result.student?.section || '',
        result.totalMarks || 0,
        result.obtainedMarks || 0,
        result.percentage || 0,
        result.grade || '',
        result.status || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${examData?.data?.name || 'exam'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!examId) {
      navigate('/exams');
    }
  }, [examId, navigate]);

  const exam = examData?.data as Exam;
  const results = resultsData?.data || [];
  const isPublished = exam?.isPublished || false;

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

  const getStatusIcon = (status: string) => {
    return status === 'pass' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Results</h1>
          <p className="text-muted-foreground">
            Results for: <span className="font-medium">{exam.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? "default" : "secondary"} className="flex items-center gap-1">
            {isPublished ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          
          <PermissionGuard permission="publish_results">
            {isPublished ? (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={publishing}
              >
                {publishing ? 'Processing...' : 'Unpublish'}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? 'Publishing...' : 'Publish Results'}
              </Button>
            )}
          </PermissionGuard>

          <Button variant="outline" onClick={handleDownloadResults}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search students..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value, sectionId: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classesData?.data?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
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
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {(filters.classId ? classSectionsData?.data : sectionsData?.data)?.map((section: any) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
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
            Results ({results.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                {filters.search || filters.classId || filters.sectionId
                  ? 'Try adjusting your filters'
                  : 'No results are available for this exam yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Obtained Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result: Result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">{result.student?.name || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{result.student?.rollNumber || '-'}</span>
                      </TableCell>
                      <TableCell>{result.student?.class || '-'}</TableCell>
                      <TableCell>{result.student?.section || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{result.totalMarks}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{result.obtainedMarks}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.percentage.toFixed(2)}%</span>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${Math.min(result.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(result.grade)}>
                          {result.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium capitalize">{result.status}</span>
                        </div>
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

      {/* Result Detail Modal */}
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
