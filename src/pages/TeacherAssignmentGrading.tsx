import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Award,
  Eye,
  Save,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignmentApi } from '@/services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  dueDate: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  attachmentUrl?: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  attachmentUrl?: string;
  submittedAt: string;
  isLate: boolean;
  marks?: number;
  remarks?: string;
  status: 'submitted' | 'graded';
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    email: string;
  };
}

interface GradingFilters {
  search: string;
  status: string;
}

export default function TeacherAssignmentGrading() {
  const { user } = useAuth();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GradingFilters>({
    search: '',
    status: '',
  });
  const [gradingData, setGradingData] = useState<Record<string, { marks: number; remarks: string }>>({});

  const queryClient = useQueryClient();

  const {
    data: assignmentData,
    isLoading: assignmentLoading,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return { data: null };
      const response = await assignmentApi.getById(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
  });

  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    refetch,
  } = useQuery({
    queryKey: ['assignment-submissions', assignmentId, filters],
    queryFn: async () => {
      if (!assignmentId) return { data: [] };
      const response = await assignmentApi.getSubmissions(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { submissions: Array<{ studentId: string; marks: number; remarks?: string }> }) =>
      assignmentApi.grade(assignmentId!, data),
    onSuccess: () => {
      toast.success('Grades saved successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
      setGradingData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save grades');
    },
  });

  useEffect(() => {
    if (!assignmentId) {
      navigate('/assignments');
    }
  }, [assignmentId, navigate]);

  const assignment = assignmentData?.data as Assignment;
  const submissions = submissionsData?.data || [];

  const handleGradeChange = (submissionId: string, field: 'marks' | 'remarks', value: string | number) => {
    setGradingData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleSaveGrade = (submissionId: string) => {
    const submission = submissions.find((sub: Submission) => sub.id === submissionId);
    if (!submission) return;

    const gradeData = gradingData[submissionId];
    if (!gradeData) return;

    gradeMutation.mutate({
      submissions: [{
        studentId: submission.studentId,
        marks: gradeData.marks,
        remarks: gradeData.remarks
      }]
    });
  };

  const handleBulkSave = () => {
    const validGrades = Object.entries(gradingData)
      .filter(([_, data]) => data.marks !== undefined && data.marks >= 0)
      .map(([submissionId, data]) => {
        const submission = submissions.find((sub: Submission) => sub.id === submissionId);
        return {
          studentId: submission?.studentId || '',
          marks: data.marks,
          remarks: data.remarks
        };
      })
      .filter(grade => grade.studentId);

    if (validGrades.length === 0) {
      toast.error('Please enter at least one valid grade');
      return;
    }

    gradeMutation.mutate({ submissions: validGrades });
  };

  const hasUnsavedGrades = Object.keys(gradingData).length > 0;

  const getStatusColor = (status: string) => {
    return status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const getGradeColor = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  if (!assignmentId || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Assignment Not Found</h3>
          <p className="text-muted-foreground">The requested assignment could not be found.</p>
        </div>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return submission.student?.name?.toLowerCase().includes(searchLower) ||
             submission.student?.rollNumber?.toLowerCase().includes(searchLower);
    }
    if (filters.status) {
      return submission.status === filters.status;
    }
    return true;
  });

  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submittedCount - gradedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Grading</h1>
          <p className="text-muted-foreground">
            {assignment.subject?.name} - {assignment.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {submittedCount} submitted
          </Badge>
          <Badge variant="outline">
            {gradedCount} graded
          </Badge>
          <Badge variant="outline" className="text-orange-600">
            {pendingCount} pending
          </Badge>
        </div>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Due Date</div>
                <div className="font-medium">
                  {format(new Date(assignment.dueDate), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Max Marks</div>
                <div className="font-medium">{assignment.maxMarks}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Class</div>
                <div className="font-medium">
                  {assignment.class?.name} - {assignment.section?.name}
                </div>
              </div>
            </div>
          </div>

          {assignment.attachmentUrl && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Assignment Attachment</div>
              <Button variant="outline" size="sm" asChild>
                <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Attachment
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Alert */}
      {hasUnsavedGrades && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  You have unsaved grade changes for {Object.keys(gradingData).length} student(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGradingData({})}
                >
                  Discard
                </Button>
                <Button 
                  size="sm"
                  onClick={handleBulkSave}
                  disabled={gradeMutation.isPending}
                >
                  {gradeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Submissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No submissions found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.status
                  ? 'Try adjusting your filters'
                  : 'No students have submitted this assignment yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission: Submission) => {
                    const currentGrade = gradingData[submission.id];
                    const displayMarks = currentGrade?.marks ?? submission.marks ?? 0;
                    const displayRemarks = currentGrade?.remarks ?? submission.remarks ?? '';
                    const isGraded = submission.status === 'graded' || currentGrade?.marks !== undefined;

                    return (
                      <TableRow 
                        key={submission.id} 
                        className={currentGrade ? 'bg-blue-50' : ''}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{submission.student?.name || '-'}</div>
                            <div className="text-sm text-muted-foreground">{submission.student?.email || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{submission.student?.rollNumber || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                          {submission.isLate && (
                            <Badge variant="destructive" className="ml-2">
                              Late
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={assignment.maxMarks}
                              value={displayMarks}
                              onChange={(e) => handleGradeChange(submission.id, 'marks', parseInt(e.target.value) || 0)}
                              className="w-20"
                              disabled={isGraded}
                            />
                            <span className="text-sm text-muted-foreground">/ {assignment.maxMarks}</span>
                            {displayMarks > 0 && (
                              <span className={`font-bold ${getGradeColor(displayMarks, assignment.maxMarks)}`}>
                                ({getGrade(displayMarks, assignment.maxMarks)})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={displayRemarks}
                            onChange={(e) => handleGradeChange(submission.id, 'remarks', e.target.value)}
                            placeholder="Add remarks..."
                            rows={2}
                            className="min-w-[150px]"
                            disabled={isGraded}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {submission.submissionText && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* TODO: View submission modal */}}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {currentGrade && (
                              <Button
                                size="sm"
                                onClick={() => handleSaveGrade(submission.id)}
                                disabled={gradeMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
