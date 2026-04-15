import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, User, Clock, Award, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { SubjectPaperForm } from '@/components/exam/SubjectPaperForm';
import { examApi, subjectApi, userApi } from '@/pages/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface SubjectPaper {
  id: string;
  examId: string;
  subjectId: string;
  teacherId: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string;
  startTime: string;
  endTime: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
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
}

export default function ExamSubjectPapers() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingPaper, setEditingPaper] = useState<SubjectPaper | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<SubjectPaper | null>(null);

  const queryClient = useQueryClient();

  const {
    data: papersData,
    isLoading: papersLoading,
    refetch,
  } = useQuery({
    queryKey: ['exam-papers', examId],
    queryFn: async () => {
      if (!examId) return { data: [] };
      const response = await examApi.getPapers(examId);
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

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectApi.getAll();
      return response.data;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await userApi.getAll({ role: 'teacher' });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (paperId: string) => examApi.deletePaper(examId!, paperId),
    onSuccess: () => {
      toast.success('Subject paper deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-papers', examId] });
      setDeletingPaper(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete subject paper');
    },
  });

  const handleEdit = (paper: SubjectPaper) => {
    setEditingPaper(paper);
    setShowForm(true);
  };

  const handleDelete = (paper: SubjectPaper) => {
    setDeletingPaper(paper);
  };

  const confirmDelete = () => {
    if (deletingPaper) {
      deleteMutation.mutate(deletingPaper.id);
    }
  };

  useEffect(() => {
    if (!examId) {
      navigate('/exams');
    }
  }, [examId, navigate]);

  const exam = examData?.data as Exam;
  const papers = papersData?.data || [];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Papers</h1>
          <p className="text-muted-foreground">
            Manage subject papers for: <span className="font-medium">{exam.name}</span>
          </p>
        </div>
        <PermissionGuard permission="create_exam_paper">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Subject Paper
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Subject Papers ({papers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {papersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No subject papers found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding subject papers for this exam
              </p>
              <PermissionGuard permission="create_exam_paper">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject Paper
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assigned Teacher</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Passing Marks</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((paper: SubjectPaper) => (
                    <TableRow key={paper.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{paper.subject?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{paper.subject?.code || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{paper.teacher?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{paper.teacher?.email || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{paper.maxMarks}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{paper.passingMarks}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {paper.examDate ? format(new Date(paper.examDate), 'MMM dd, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {paper.startTime && paper.endTime ? (
                            <span>{paper.startTime} - {paper.endTime}</span>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="edit_exam_paper">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(paper)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="delete_exam_paper">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(paper)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subject Paper</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the subject paper for "{paper.subject?.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <SubjectPaperForm
          exam={exam}
          paper={editingPaper}
          subjects={subjectsData?.data || []}
          teachers={teachersData?.data || []}
          onClose={() => {
            setShowForm(false);
            setEditingPaper(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingPaper(null);
          }}
        />
      )}
    </div>
  );
}
