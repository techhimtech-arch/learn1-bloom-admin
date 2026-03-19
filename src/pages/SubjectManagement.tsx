import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users, BookOpen, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AcademicFilters, AcademicFiltersState } from '@/components/shared/AcademicFilters';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { SubjectForm } from '@/components/academic/SubjectForm';
import { TeacherAssignmentDialog } from '@/components/academic/TeacherAssignmentDialog';
import { subjectApi, userApi } from '@/services/api';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  department: string;
  credits: number;
  weeklyHours: number;
  isOptional: boolean;
  status: 'active' | 'inactive' | 'archived';
  classId: string;
  academicYearId: string;
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

  const queryClient = useQueryClient();

  const {
    data: subjectsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['subjects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);

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
    mutationFn: subjectApi.delete,
    onSuccess: () => {
      toast.success('Subject deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDeletingSubject(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
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
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
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
                    <TableHead>Department</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Hours/Week</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsData?.data?.map((subject: Subject) => (
                    <TableRow key={subject.id}>
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
                        <Badge className={getDepartmentColor(subject.department)}>
                          {subject.department}
                        </Badge>
                      </TableCell>
                      <TableCell>{subject.class?.name || '-'}</TableCell>
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
                          {subject.teachers?.slice(0, 2).map((teacher) => (
                            <div key={teacher.id} className="text-sm">
                              <span className="font-medium">{teacher.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {teacher.role}
                              </Badge>
                            </div>
                          ))}
                          {subject.teachers && subject.teachers.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{subject.teachers.length - 2} more
                            </div>
                          )}
                          {(!subject.teachers || subject.teachers.length === 0) && (
                            <div className="text-sm text-muted-foreground">No teachers assigned</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subject.status)}>
                          {subject.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="assign_teacher">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTeacherAssignment(subject)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard resource="subject" action="edit">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(subject)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard resource="subject" action="delete">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(subject)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
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
          teachers={teachersData?.data || []}
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
    </div>
  );
export default SubjectManagement;

interface SubjectData {
  _id: string;
  name: string;
  classId: { _id: string; name: string } | string;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filterClass, setFilterClass] = useState('');

  const [form, setForm] = useState({
    name: '',
    classId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const { data } = await classApi.getAll();
      setClasses(data.data || []);
    } catch (err: any) {
      showApiError(err, 'Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = filterClass
        ? await subjectApi.getByClass(filterClass)
        : await subjectApi.getAll();
      setSubjects(data.data || []);
    } catch (err: any) {
      showApiError(err, 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errors.name = 'Subject name must be at least 2 characters';
    if (!form.classId)
      errors.classId = 'Please select a class';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingSubject) {
        const res = await subjectApi.update(editingSubject._id, { name: form.name.trim() });
        showApiSuccess(res, 'Subject updated successfully');
      } else {
        const res = await subjectApi.create({ name: form.name.trim(), classId: form.classId });
        showApiSuccess(res, 'Subject created successfully');
      }
      setDialogOpen(false);
      setEditingSubject(null);
      resetForm();
      fetchSubjects();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await subjectApi.delete(deleteTarget._id);
      showApiSuccess(res, 'Subject deleted successfully');
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err: any) {
      showApiError(err, 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (subject: SubjectData) => {
    setEditingSubject(subject);
    const classId = typeof subject.classId === 'object' ? subject.classId._id : subject.classId;
    setForm({ name: subject.name, classId });
    setFormErrors({});
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: '', classId: '' });
    setFormErrors({});
  };

  const getClassName = (subject: SubjectData) => {
    if (typeof subject.classId === 'object' && subject.classId?.name) return subject.classId.name;
    const cls = classes.find(c => c._id === subject.classId);
    return cls?.name || '-';
  };

  const subjectsByClass = subjects.reduce((acc, sub) => {
    const cId = typeof sub.classId === 'object' ? sub.classId._id : sub.classId;
    acc[cId] = (acc[cId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostSubjectsClass = classes.reduce((max, cls) => {
    const count = subjectsByClass[cls._id] || 0;
    return count > (subjectsByClass[max?._id] || 0) ? cls : max;
  }, classes[0]);

  const columns: Column<SubjectData>[] = [
    { key: 'name', label: 'Subject Name' },
    { key: 'classId', label: 'Class', render: (_: any, row: SubjectData) => getClassName(row) },
    {
      key: 'isActive',
      label: 'Status',
      render: (val: boolean) => <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subject Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage subjects for different classes — {subjects.length} total subjects
          </p>
        </div>
        <Button onClick={() => { setEditingSubject(null); resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatWidget
          title="Total Subjects"
          value={subjects.length}
          icon={BookOpen}
          iconColor="bg-primary/10 text-primary"
        />
        <StatWidget
          title="Total Classes"
          value={classes.length}
          icon={School}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatWidget
          title="Most Subjects"
          value={mostSubjectsClass ? `${mostSubjectsClass.name} (${subjectsByClass[mostSubjectsClass._id] || 0})` : '-'}
          icon={GraduationCap}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <Label className="whitespace-nowrap">Filter by Class:</Label>
        <Select value={filterClass || "all"} onValueChange={(v) => setFilterClass(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterClass && (
          <Button variant="outline" size="sm" onClick={() => setFilterClass('')}>Clear</Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={subjects}
        loading={loading}
        searchPlaceholder="Search subjects..."
        actions={(row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingSubject(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>
                Subject Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mathematics"
                maxLength={100}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            {!editingSubject && (
              <div className="space-y-2">
                <Label>
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading classes...</div>
                    ) : classes.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No classes available</div>
                    ) : (
                      classes.map(cls => (
                        <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.classId && <p className="text-xs text-destructive">{formErrors.classId}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSubject ? 'Update' : 'Create'} Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubjectManagement;
