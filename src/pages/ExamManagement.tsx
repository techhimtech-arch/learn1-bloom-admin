import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FileText, Calendar, Users, Clock, ClipboardEdit, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExamFilters, ExamFiltersState } from '@/components/shared/ExamFilters';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { ExamForm } from '@/components/exam/ExamForm';
import { examApi } from '@/pages/services/api';
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

interface Exam {
  _id: string;
  id?: string;
  name: string;
  examType: string;
  classId: {
    _id: string;
    name: string;
  };
  sectionId: {
    _id: string;
    name: string;
  };
  sessionId: {
    _id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'PUBLISHED';
  description?: string;
  instructions?: string;
  passingPercentage?: number;
  duration?: number;
  totalMarks?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ExamManagement() {
  const [filters, setFilters] = useState<ExamFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    examType: '',
    status: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: examsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['exams', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.examType) params.append('examType', filters.examType);
      if (filters.status) params.append('status', filters.status);

      const response = await examApi.getAll(Object.fromEntries(params));
      return response.data;
    },
  });

  const exams = Array.isArray(examsData) ? examsData : examsData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: examApi.delete,
    onSuccess: () => {
      toast.success('Exam deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setDeletingExam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete exam');
    },
  });

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setShowForm(true);
  };

  const handleDelete = (exam: Exam) => {
    setDeletingExam(exam);
  };

  const confirmDelete = () => {
    if (deletingExam) {
      deleteMutation.mutate(deletingExam.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExamTypeColor = (examType: string) => {
    const colors: Record<string, string> = {
      midterm: 'bg-purple-100 text-purple-800',
      final: 'bg-red-100 text-red-800',
      quiz: 'bg-green-100 text-green-800',
      practical: 'bg-orange-100 text-orange-800',
      assignment: 'bg-cyan-100 text-cyan-800',
      test: 'bg-indigo-100 text-indigo-800',
    };
    return colors[examType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Create and manage examinations</p>
        </div>
        <PermissionGuard resource="exam" action="create">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        </PermissionGuard>
      </div>

      <ExamFilters
        onFiltersChange={setFilters}
        loading={isLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exams ({exams.length || 0})
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
          ) : exams.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No exams found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.classId || filters.examType || filters.status
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first exam'}
              </p>
              {!filters.search && !filters.classId && !filters.examType && !filters.status && (
                <PermissionGuard resource="exam" action="create">
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Exam
                  </Button>
                </PermissionGuard>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam: Exam) => (
                    <TableRow key={exam._id || exam.id}>
                      <TableCell>
                        <div className="font-medium">{exam.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getExamTypeColor(exam.examType)}>
                          {exam.examType}
                        </Badge>
                      </TableCell>
                      <TableCell>{exam.classId?.name || '-'}</TableCell>
                      <TableCell>{exam.sectionId?.name || '-'}</TableCell>
                      <TableCell>{exam.sessionId?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {exam.startDate ? format(new Date(exam.startDate), 'MMM dd, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {exam.endDate ? format(new Date(exam.endDate), 'MMM dd, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(exam.status)}>
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard resource="exam" action="edit">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/exams/${exam._id || exam.id}/marks`)}
                              title="Enter Marks"
                            >
                              <ClipboardEdit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard resource="exam" action="read">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/exams/${exam._id || exam.id}/results`)}
                              title="View Results"
                            >
                              <BarChart2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard resource="exam" action="edit">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit({
                                ...exam,
                                id: exam._id || exam.id || '',
                              } as Exam)}
                              title="Edit Exam"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard resource="exam" action="delete">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(exam)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{exam.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(exam._id || exam.id || '')}>
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
        <ExamForm
          exam={editingExam as any}
          onClose={() => {
            setShowForm(false);
            setEditingExam(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingExam(null);
          }}
        />
      )}
    </div>
  );
}
