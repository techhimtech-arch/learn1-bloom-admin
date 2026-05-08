import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { teacherApi } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTeacherContext } from '@/contexts/TeacherContext';
import { Loader2 } from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subjectId: { _id: string; name: string };
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  dueDate: string;
  maxMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  teacherId: string;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
}

const TeacherAssignments = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { classes } = useTeacherContext();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeleteAssignment] = useState<Assignment | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 50,
    allowLateSubmission: false,
    lateSubmissionPenalty: 0,
  });

  const teacherClasses = Array.from(
    new Map(classes.map(c => [c.classId._id, c.classId])).values()
  );

  const teacherSubjectsForClass = selectedClass
    ? Array.from(
        new Map(
          classes
            .filter(c => c.classId._id === selectedClass)
            .map(c => [c.subjectId._id, c.subjectId])
        ).values()
      )
    : [];

  const teacherSectionsForSubject = selectedClass && selectedSubject
    ? Array.from(
        new Map(
          classes
            .filter(c => c.classId._id === selectedClass && c.subjectId._id === selectedSubject)
            .map(c => [c.sectionId._id, c.sectionId])
        ).values()
      )
    : [];

  const selectedClassData = selectedClass && selectedSubject && selectedSection
    ? classes.find(
        c =>
          c.classId._id === selectedClass &&
          c.subjectId._id === selectedSubject &&
          c.sectionId._id === selectedSection
      )
    : null;

  const { data: assignmentsResponse, isLoading: assignmentsLoading, refetch } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => teacherApi.getAssignments(),
  });

  const assignments = (assignmentsResponse?.data?.data || []) as Assignment[];
  const filteredAssignments = selectedClass && selectedClass !== 'all'
    ? assignments.filter(a => a.classId._id === selectedClass)
    : assignments;

  const createMutation = useMutation({
    mutationFn: (data: any) => teacherApi.createAssignment(data),
    onSuccess: () => {
      toast.success('✅ Assignment created successfully');
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to create assignment'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!editingAssignment) throw new Error('No assignment selected');
      return teacherApi.updateAssignment(editingAssignment._id, data);
    },
    onSuccess: () => {
      toast.success('✅ Assignment updated successfully');
      setShowCreateDialog(false);
      setEditingAssignment(null);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to update assignment'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherApi.deleteAssignment(id),
    onSuccess: () => {
      toast.success('✅ Assignment deleted successfully');
      setDeleteAssignment(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to delete assignment'}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => teacherApi.publishAssignment(id),
    onSuccess: () => {
      toast.success('✅ Assignment published successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to publish assignment'}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      maxMarks: 50,
      allowLateSubmission: false,
      lateSubmissionPenalty: 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.dueDate || !selectedClass || !selectedSubject || !selectedSection) {
      toast.error('❌ Please fill all required fields (Class, Subject, Section, Title, Description, Due Date)');
      return;
    }

    if (!selectedClassData) {
      toast.error('❌ Invalid class/subject/section selection');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      classId: selectedClass,
      subjectId: selectedSubject,
      sectionId: selectedSection,
      dueDate: new Date(formData.dueDate).toISOString(),
      maxMarks: formData.maxMarks,
      allowLateSubmission: formData.allowLateSubmission,
      lateSubmissionPenalty: formData.lateSubmissionPenalty,
    };

    console.log('📤 Submitting assignment:', payload);

    if (editingAssignment) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedClass(assignment.classId._id);
    setSelectedSubject(assignment.subjectId._id);
    setSelectedSection(assignment.sectionId._id);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.split('T')[0],
      maxMarks: assignment.maxMarks,
      allowLateSubmission: assignment.allowLateSubmission || false,
      lateSubmissionPenalty: assignment.lateSubmissionPenalty || 0,
    });
    setShowCreateDialog(true);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'CLOSED';
    
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      PUBLISHED: { color: isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800', label: isOverdue ? 'Overdue' : 'Active' },
      CLOSED: { color: 'bg-slate-100 text-slate-800', label: 'Closed' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📝 Assignments</h1>
          <p className="text-muted-foreground">Create and manage assignments for your classes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              resetForm(); 
              setEditingAssignment(null);
              setSelectedClass('');
              setSelectedSubject('');
              setSelectedSection('');
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? '✏️ Edit Assignment' : '➕ Create New Assignment'}</DialogTitle>
              <DialogDescription>
                {editingAssignment ? 'Update the assignment details' : 'Fill in all required fields to create a new assignment'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info Box - Show Assignment Context */}
              {selectedClass && selectedSubject && selectedSection && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">📚 Assignment Context</p>
                    <p className="text-blue-800 text-xs mt-1">
                      Class: <span className="font-semibold">{teacherClasses.find(c => c._id === selectedClass)?.name}</span> • 
                      Subject: <span className="font-semibold">{teacherSubjectsForClass.find(s => s._id === selectedSubject)?.name}</span> • 
                      Section: <span className="font-semibold">{teacherSectionsForSubject.find(sec => sec._id === selectedSection)?.name}</span>
                    </p>
                  </div>
                </div>
              )}
              {/* Class, Subject, Section Selection */}
              <div className="space-y-2">
                <Label>Class * (Required)</Label>
                <Select value={selectedClass} onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedSubject('');
                  setSelectedSection('');
                }} disabled={!!editingAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map(cls => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection - Only show if class is selected */}
              {selectedClass && (
                <div className="space-y-2">
                  <Label>Subject * (Required)</Label>
                  <Select value={selectedSubject} onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedSection('');
                  }} disabled={!!editingAssignment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherSubjectsForClass.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No subjects assigned for this class
                        </div>
                      ) : (
                        teacherSubjectsForClass.map(subject => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Section Selection - Only show if subject is selected */}
              {selectedSubject && (
                <div className="space-y-2">
                  <Label>Section * (Required)</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!!editingAssignment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherSectionsForSubject.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No sections assigned for this subject
                        </div>
                      ) : (
                        teacherSectionsForSubject.map(section => (
                          <SelectItem key={section._id} value={section._id}>
                            {section.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Title * (Max 200 characters)</Label>
                <Input
                  placeholder="e.g., Algebra Chapter 5 Homework"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description * (Max 5000 characters)</Label>
                <Textarea
                  placeholder="Provide detailed instructions for students..."
                  maxLength={5000}
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Due Date & Max Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date * (Must be future date)</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Marks * (must be positive)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Late Submission */}
              <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowLateSubmission: e.target.checked }))}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium">Allow Late Submission</span>
                </label>

                {formData.allowLateSubmission && (
                  <div className="space-y-2 pl-7">
                    <Label>Penalty (%) - 0 to 100</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lateSubmissionPenalty}
                      onChange={(e) => setFormData(prev => ({ ...prev, lateSubmissionPenalty: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Class</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass || 'all'} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {teacherClasses.map(cls => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Assignments</span>
            <Badge variant="secondary">{filteredAssignments.length} assignments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No assignments yet</h3>
              <p className="text-muted-foreground">Create your first assignment to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map(assignment => (
                    <TableRow key={assignment._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{assignment.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{assignment.description.substring(0, 50)}...</div>
                      </TableCell>
                      <TableCell>{assignment.classId.name}</TableCell>
                      <TableCell>{assignment.subjectId.name}</TableCell>
                      <TableCell>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{assignment.maxMarks}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status, assignment.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {assignment.status === 'DRAFT' && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => publishMutation.mutate(assignment._id)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              </>
                            )}
                            {assignment.status === 'PUBLISHED' && (
                                <DropdownMenuItem onClick={() => navigate(`/teacher/assignments/${assignment._id}/grading`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Submissions
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteAssignment(assignment)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingAssignment} onOpenChange={(open) => !open && setDeleteAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The assignment "{deletingAssignment?.title}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAssignment && deleteMutation.mutate(deletingAssignment._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherAssignments;

// Import missing icon
import { BookOpen } from 'lucide-react';
