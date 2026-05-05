import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Lock, Unlock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { examApi, subjectApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Skeleton } from '@/components/ui/skeleton';

interface Exam {
  id: string;
  _id?: string;
  name: string;
  examType: string;
  status: string;
  isPublished?: boolean;
  subjects?: Array<{ subject_id: string; max_marks: number }>;
}

interface StudentEnrollment {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  rollNumber?: string;
  class?: string;
  section?: string;
}

export default function MarksEntry() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // markValues[enrollment_id][subject_id] = marks
  const [markValues, setMarkValues] = useState<Record<string, Record<string, string | number>>>({});

  // 1. Fetch Exam Configuration (to get subjects and max_marks)
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await examApi.getById(examId);
      return response.data;
    },
    enabled: !!examId,
  });

  const exam = examData?.data || examData;

  // 2. Fetch Students (active enrollments for the exam's sections)
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['exam-students', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await examApi.getStudentsForExam(examId);
      return response.data;
    },
    enabled: !!examId,
  });

  // 3. Fetch Subject Details (to map subject_id to names)
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectApi.getAll();
      return response.data;
    },
  });

  // 4. Fetch Results (to pre-fill existing marks if any)
  const { data: resultsData } = useQuery({
    queryKey: ['exam-results-raw', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await examApi.getResults(examId);
      return response.data;
    },
    enabled: !!examId,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: any) => examApi.bulkCreateMarks(data),
    onSuccess: () => {
      toast.success('Marks bulk updated successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-results-raw', examId] });
      setMarkValues({});
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to update marks');
    },
  });

  useEffect(() => {
    if (!examId) {
      navigate('/exams');
    }
  }, [examId, navigate]);

  const students: StudentEnrollment[] = studentsData?.data || studentsData || [];
  const allSubjects = subjectsData?.data || subjectsData || [];
  const existingResults = resultsData?.data || resultsData || [];
  
  const filterSubjectId = searchParams.get('subjectId');
  let examSubjects = exam?.subjects || [];
  if (filterSubjectId) {
    examSubjects = examSubjects.filter((s: any) => s.subject_id === filterSubjectId);
  }
  const isLocked = exam?.status === 'COMPLETED' || exam?.status === 'PUBLISHED';

  // Helper to extract subject name
  const getSubjectName = (subjectId: string) => {
    const sub = allSubjects.find((s: any) => s.id === subjectId || s._id === subjectId);
    return sub ? sub.name : 'Unknown Subject';
  };

  // Pre-fill existing marks logic
  const getExistingMark = (enrollmentId: string, subjectId: string): number | string => {
    const resultRow = existingResults.find((r: any) => r.enrollment_id === enrollmentId);
    if (!resultRow || !resultRow.subject_marks) return '';
    // Look up either by matching subject_id if backend returns it, or by subject_name
    const subjectName = getSubjectName(subjectId);
    const markEntry = resultRow.subject_marks.find((sm: any) => sm.subject_id === subjectId || sm.subject_name === subjectName);
    return markEntry ? markEntry.marks_obtained : '';
  };

  const handleMarkChange = (enrollmentId: string, subjectId: string, value: string) => {
    if (!value) {
      setMarkValues(prev => {
         const next = { ...prev };
         if (next[enrollmentId]) {
             delete next[enrollmentId][subjectId];
         }
         return next;
      });
      return;
    }
    
    setMarkValues(prev => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        [subjectId]: parseInt(value) || 0,
      }
    }));
  };

  const handleBulkSave = () => {
    const marksPayload: any[] = [];
    
    // We only push the marks that were explicitly typed in by the user in this session.
    // If they want to update everything, they should type it in. 
    Object.entries(markValues).forEach(([enrollment_id, subjectsMap]) => {
      Object.entries(subjectsMap).forEach(([subject_id, marks]) => {
        if (marks !== '') {
          marksPayload.push({
            enrollment_id,
            subject_id,
            marks: Number(marks)
          });
        }
      });
    });

    if (marksPayload.length === 0) {
      toast.error('No new marks entered to save');
      return;
    }

    bulkUpdateMutation.mutate({
      exam_id: examId,
      marks: marksPayload
    });
  };

  if (!examId || (!examLoading && !exam)) {
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

  const hasUnsavedChanges = Object.keys(markValues).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marks Entry Grid</h1>
          <p className="text-muted-foreground">
            Bulk Entry for: <span className="font-medium">{exam?.name || 'Loading...'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isLocked ? "destructive" : "default"} className="flex items-center gap-1">
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {isLocked ? 'Locked' : 'Active'}
          </Badge>
          
          <Button onClick={handleBulkSave} disabled={bulkUpdateMutation.isPending || isLocked}>
            {bulkUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Bulk Matrix
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && !isLocked && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">You have unsaved changes in the grid</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMarkValues({})}>
                  Discard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Eligible Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading || examLoading ? (
             <div className="space-y-4">
               {Array.from({ length: 5 }).map((_, i) => (
                 <Skeleton key={i} className="h-12 w-full" />
               ))}
             </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                No active enrollments match the sections of this exam.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Student Name</TableHead>
                    {examSubjects.map((subject: any) => (
                      <TableHead key={subject.subject_id} className="min-w-[150px]">
                        <div>{getSubjectName(subject.subject_id)}</div>
                        <div className="text-xs text-muted-foreground font-normal">Max: {subject.max_marks}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: StudentEnrollment) => (
                    <TableRow key={student.enrollment_id}>
                      <TableCell>
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {student.enrollment_id.slice(-6)}</div>
                      </TableCell>
                      {examSubjects.map((subject: any) => {
                        const currentValue = markValues[student.enrollment_id]?.[subject.subject_id];
                        const displayValue = currentValue !== undefined ? currentValue : getExistingMark(student.enrollment_id, subject.subject_id);
                        
                        // Validate mark
                        const exceedsMax = Number(displayValue) > subject.max_marks;
                        
                        return (
                           <TableCell key={`${student.enrollment_id}-${subject.subject_id}`}>
                             <div className="flex flex-col gap-1">
                               <Input
                                 type="number"
                                 min="0"
                                 max={subject.max_marks}
                                 value={displayValue}
                                 onChange={(e) => handleMarkChange(student.enrollment_id, subject.subject_id, e.target.value)}
                                 disabled={isLocked}
                                 className={`w-24 ${exceedsMax ? 'border-red-500 focus-visible:ring-red-500' : ''} ${currentValue !== undefined ? 'bg-blue-50 border-blue-200' : ''}`}
                                 placeholder="-"
                               />
                               {exceedsMax && (
                                 <span className="text-[10px] text-red-500 font-medium leading-none">Exceeds max</span>
                               )}
                             </div>
                           </TableCell>
                        )
                      })}
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
