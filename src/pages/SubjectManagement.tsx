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
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatWidget from '@/components/shared/StatWidget';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { subjectApi, classApi } from '@/services/api';
import { Plus, CreditCard as Edit, Trash2, BookOpen, School, GraduationCap, Loader as Loader2 } from 'lucide-react';

interface ClassOption {
  _id: string;
  name: string;
  isActive: boolean;
}

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
