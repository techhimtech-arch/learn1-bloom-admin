import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, Send, Calendar, Filter, Search, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { AssignmentForm } from '@/components/assignment/AssignmentForm';
import { assignmentApi, classApi, sectionApi, subjectApi } from '@/services/api';
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
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
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
  teacher?: {
    id: string;
    name: string;
  };
  submissionStatus?: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    pendingCount: number;
  };
}

interface AssignmentFilters {
  search: string;
  classId: string;
  sectionId: string;
  status: string;
  subjectId: string;
}

export default function AssignmentManagement() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AssignmentFilters>({
    search: '',
    classId: '',
    sectionId: '',
    status: '',
    subjectId: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);

  const queryClient = useQueryClient();

  // Different query based on user role
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch,
  } = useQuery({
    queryKey: ['assignments', user?.role, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);
      if (filters.status) params.append('status', filters.status);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      
      // Add teacher filter for teachers
      if (user?.role === 'teacher') {
        params.append('teacherId', user.id);
      }

      const response = await assignmentApi.getAll(Object.fromEntries(params));
      return response.data;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
    enabled: user?.role === 'school_admin',
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
    enabled: user?.role === 'school_admin',
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentApi.delete(id),
    onSuccess: () => {
      toast.success('Assignment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setDeletingAssignment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => assignmentApi.publish(id),
    onSuccess: () => {
      toast.success('Assignment published successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish assignment');
    },
  });

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
  };

  const confirmDelete = () => {
    if (deletingAssignment) {
      deleteMutation.mutate(deletingAssignment.id);
    }
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const assignments = assignmentsData?.data || [];
  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];
  const subjects = subjectsData?.data || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-green-100 text-green-800',
      'closed': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getSubmissionProgress = (submissionStatus?: any) => {
    if (!submissionStatus) return null;
    const percentage = submissionStatus.totalStudents > 0 
      ? (submissionStatus.submittedCount / submissionStatus.totalStudents) * 100 
      : 0;
    return percentage;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            Manage {user?.role === 'teacher' ? 'your ' : ''}assignments and track submissions
          </p>
        </div>
        <PermissionGuard permission="create_assignment">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </PermissionGuard>
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
                placeholder="Search assignments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            {user?.role === 'school_admin' && (
              <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {user?.role === 'school_admin' && (
              <Select value={filters.sectionId} onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {sections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.subjectId} onValueChange={(value) => setFilters(prev => ({ ...prev, subjectId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.classId || filters.sectionId || filters.status || filters.subjectId
                  ? 'Try adjusting your filters'
                  : `Get started by creating your first ${user?.role === 'teacher' ? '' : 'assignment'}`}
              </p>
              <PermissionGuard permission="create_assignment">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Status</TableHead>
                    {user?.role === 'teacher' && <TableHead>Submissions</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment: Assignment) => (
                    <TableRow key={assignment.id} className={isOverdue(assignment.dueDate) ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.subject?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{assignment.subject?.code || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {assignment.class?.name || '-'} {assignment.section?.name ? `- ${assignment.section.name}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue(assignment.dueDate) ? 'text-red-600' : ''}>
                            {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </span>
                          {isOverdue(assignment.dueDate) && (
                            <Badge variant="destructive" className="ml-2">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.maxMarks}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      {user?.role === 'teacher' && (
                        <TableCell>
                          {assignment.submissionStatus && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${getSubmissionProgress(assignment.submissionStatus)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">
                                  {getSubmissionProgress(assignment.submissionStatus)}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.submissionStatus.submittedCount}/{assignment.submissionStatus.totalStudents} submitted
                              </div>
                              {assignment.submissionStatus.pendingCount > 0 && (
                                <div className="text-xs text-orange-600">
                                  {assignment.submissionStatus.pendingCount} pending grading
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="view_assignment">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: View assignment modal */}}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="edit_assignment">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(assignment)}
                              disabled={assignment.status === 'closed'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>

                          {assignment.status === 'draft' && (
                            <PermissionGuard permission="publish_assignment">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublish(assignment.id)}
                                disabled={publishMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                          )}

                          <PermissionGuard permission="delete_assignment">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(assignment)}
                                  disabled={assignment.status !== 'draft'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{assignment.title}"? This action cannot be undone.
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
        <AssignmentForm
          assignment={editingAssignment}
          classes={classes}
          sections={sections}
          subjects={subjects}
          onClose={() => {
            setShowForm(false);
            setEditingAssignment(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingAssignment(null);
          }}
        />
      )}
    </div>
  );
}
