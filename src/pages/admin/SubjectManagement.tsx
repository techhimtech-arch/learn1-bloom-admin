import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users, BookOpen, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AcademicFilters, AcademicFiltersState } from '@/components/shared/AcademicFilters';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { SubjectForm } from '@/components/academic/SubjectForm';
import { TeacherAssignmentDialog } from '@/components/academic/TeacherAssignmentDialog';
import { subjectApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkSubjectDialog } from '@/components/academic/BulkSubjectDialog';
import { CloneSubjectsDialog } from '@/components/academic/CloneSubjectsDialog';
import { Copy, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

interface Subject {
  id: string;
  _id?: string;
  name: string;
  code: string;
  description?: string;
  department: string;
  credits: number;
  weeklyHours: number;
  isOptional: boolean;
  status: 'active' | 'inactive' | 'archived';
  classId: string | { _id: string; name: string };
  academicSessionId: string | { _id: string; name: string };
  teachers?: Array<{
    id: string;
    name: string;
    email: string;
    role: 'primary' | 'assistant';
  }>;
  class?: {
    id: string;
    name: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
}

export default function SubjectManagement() {
  const [filters, setFilters] = useState<AcademicFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    department: '',
    status: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: subjectsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['subjects', filters],
    queryFn: async () => {
      // If a class is selected, use the dedicated class-based endpoint
      if (filters.classId) {
        const response = await subjectApi.getByClass(filters.classId);
        const data = response.data?.data || response.data || [];
        return {
          ...response.data,
          data: data.map((s: any) => ({ ...s, id: s.id || s._id }))
        };
      }

      // Otherwise use the general getAll with filters
      const params: Record<string, any> = {};
      if (filters.search) params.search = filters.search;
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const response = await subjectApi.getAll(params);
      const data = response.data?.data || response.data || [];
      return {
        ...response.data,
        data: data.map((s: any) => ({ ...s, id: s.id || s._id }))
      };
    },
  });

  // Only fetch teachers when the assignment dialog is open
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await userApi.getAll({ role: 'teacher' });
      return response.data;
    },
    enabled: showTeacherDialog,
  });

  const deleteMutation = useMutation({
    mutationFn: subjectApi.delete,
    onSuccess: () => {
      toast.success('Subject deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDeletingSubject(null);
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to delete subject');
    },
  });

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setShowForm(true);
  };

  const handleDelete = (subject: Subject) => {
    setDeletingSubject(subject);
  };

  const confirmDelete = () => {
    if (deletingSubject) {
      deleteMutation.mutate(deletingSubject.id);
    }
  };

  const handleTeacherAssignment = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowTeacherDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      science: 'bg-blue-100 text-blue-800',
      commerce: 'bg-green-100 text-green-800',
      arts: 'bg-purple-100 text-purple-800',
      mathematics: 'bg-orange-100 text-orange-800',
      computer: 'bg-cyan-100 text-cyan-800',
      languages: 'bg-pink-100 text-pink-800',
      physical: 'bg-indigo-100 text-indigo-800',
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground">Manage academic subjects and teacher assignments</p>
        </div>
        <PermissionGuard resource="subject" action="create">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-primary/20 hover:border-primary/50">
                  <Layers className="h-4 w-4" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowBulkDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Bulk Add Subjects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCloneDialog(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone from Class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>
        </PermissionGuard>
      </div>

      <AcademicFilters
        onFiltersChange={setFilters}
        loading={isLoading}
        showSection={false}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subjects ({subjectsData?.data?.length || 0})
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
          ) : subjectsData?.data?.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No subjects found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.classId || filters.department || filters.status
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first subject'}
              </p>
              {!filters.search && !filters.classId && !filters.department && !filters.status && (
                <PermissionGuard resource="subject" action="create">
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </PermissionGuard>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Hours/Week</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsData?.data?.map((subject: Subject, index) => (
                    <TableRow key={subject.id || `subject-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          {subject.isOptional && (
                            <Badge variant="outline" className="mt-1">
                              Optional
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {subject.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {typeof subject.classId === 'object' 
                          ? subject.classId.name 
                          : (subject.class?.name || '-')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {typeof subject.academicYearId === 'object' 
                            ? subject.academicYearId.name 
                            : (subject.academicYear?.name || '-')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentColor(subject.department)}>
                          {subject.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {subject.credits}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {subject.weeklyHours}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {((subject as any).teacherIds || subject.teachers)?.slice(0, 2).map((teacher: any, index: number) => (
                            <div key={teacher._id || teacher.id || `teacher-${index}`} className="text-sm">
                              <span className="font-medium text-primary">{teacher.name}</span>
                              {teacher.role && (
                                <Badge variant="outline" className="ml-2 text-[10px] h-4">
                                  {teacher.role}
                                </Badge>
                              )}
                            </div>
                          ))}
                          {((subject as any).teacherIds || subject.teachers)?.length > 2 && (
                            <div className="text-xs text-muted-foreground italic">
                              +{((subject as any).teacherIds || subject.teachers).length - 2} more...
                            </div>
                          )}
                          {(!((subject as any).teacherIds || subject.teachers) || ((subject as any).teacherIds || subject.teachers).length === 0) && (
                            <div className="text-xs text-muted-foreground">Not assigned</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subject.status)}>
                          {subject.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGuard permission="assign_teacher">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleTeacherAssignment(subject)}
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top"><p>Assign Teacher</p></TooltipContent>
                            </Tooltip>
                          </PermissionGuard>
                          <PermissionGuard resource="subject" action="edit">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleEdit(subject)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top"><p>Edit Subject</p></TooltipContent>
                            </Tooltip>
                          </PermissionGuard>
                          <PermissionGuard resource="subject" action="delete">
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDelete(subject)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="top"><p>Delete Subject</p></TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{subject.name}"? This action cannot be undone.
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
        <SubjectForm
          subject={editingSubject}
          onClose={() => {
            setShowForm(false);
            setEditingSubject(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingSubject(null);
          }}
        />
      )}

      {showTeacherDialog && selectedSubject && (
        <TeacherAssignmentDialog
          subject={selectedSubject}
          teachers={teachersData?.data?.users || teachersData?.data || []}
          onClose={() => {
            setShowTeacherDialog(false);
            setSelectedSubject(null);
          }}
          onSuccess={() => {
            refetch();
            setShowTeacherDialog(false);
            setSelectedSubject(null);
          }}
        />
      )}

      <BulkSubjectDialog
        isOpen={showBulkDialog}
        onClose={() => setShowBulkDialog(false)}
        classId={filters.classId || ''}
        academicYearId={filters.academicYearId || ''}
      />

      <CloneSubjectsDialog
        isOpen={showCloneDialog}
        onClose={() => setShowCloneDialog(false)}
        academicYearId={filters.academicYearId || ''}
        defaultSourceClassId={filters.classId || ''}
      />
    </div>
  );
};
