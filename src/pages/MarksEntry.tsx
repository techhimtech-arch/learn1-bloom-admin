import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Lock, Unlock, AlertTriangle, CheckCircle, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { BulkMarksForm } from '@/components/exam/BulkMarksForm';
import { examApi } from '@/services/api';
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

interface MarkEntry {
  id: string;
  examId: string;
  studentId: string;
  subjectPaperId: string;
  marksObtained: number;
  remarks?: string;
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  subjectPaper?: {
    id: string;
    subject: {
      name: string;
      code: string;
    };
    maxMarks: number;
    passingMarks: number;
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
  isMarksLocked: boolean;
}

export default function MarksEntry() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingMark, setEditingMark] = useState<MarkEntry | null>(null);
  const [deletingMark, setDeletingMark] = useState<MarkEntry | null>(null);
  const [markValues, setMarkValues] = useState<Record<string, { marks: number; remarks: string }>>({});

  const queryClient = useQueryClient();

  const {
    data: marksData,
    isLoading: marksLoading,
    refetch,
  } = useQuery({
    queryKey: ['exam-marks', examId],
    queryFn: async () => {
      if (!examId) return { data: [] };
      const response = await examApi.getMarks(examId);
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

  const updateMutation = useMutation({
    mutationFn: ({ markId, data }: { markId: string; data: any }) =>
      examApi.updateMarks(examId!, markId, data),
    onSuccess: () => {
      toast.success('Mark updated successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-marks', examId] });
      setEditingMark(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update mark';
      if (error.response?.data?.validation) {
        toast.error(`Validation Error: ${message}`);
      } else {
        toast.error(message);
      }
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: any) => examApi.createMarks(examId!, data),
    onSuccess: () => {
      toast.success('Marks updated successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-marks', examId] });
      setShowBulkForm(false);
      setMarkValues({});
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update marks';
      if (error.response?.data?.validation) {
        toast.error(`Validation Error: ${message}`);
      } else {
        toast.error(message);
      }
    },
  });

  const lockMutation = useMutation({
    mutationFn: () => examApi.lockMarks(examId!),
    onSuccess: () => {
      toast.success('Marks locked successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to lock marks');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => examApi.unlockMarks(examId!),
    onSuccess: () => {
      toast.success('Marks unlocked successfully');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlock marks');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (markId: string) => examApi.updateMarks(examId!, markId, { marksObtained: 0, remarks: '' }),
    onSuccess: () => {
      toast.success('Mark deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-marks', examId] });
      setDeletingMark(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete mark');
    },
  });

  const handleMarkChange = (markId: string, field: 'marks' | 'remarks', value: string | number) => {
    setMarkValues(prev => ({
      ...prev,
      [markId]: {
        ...prev[markId],
        [field]: value
      }
    }));
  };

  const handleSaveMark = (markId: string) => {
    const markValue = markValues[markId];
    if (!markValue) return;

    updateMutation.mutate({
      markId,
      data: {
        marksObtained: markValue.marks,
        remarks: markValue.remarks
      }
    });
  };

  const handleBulkSave = () => {
    const updates = Object.entries(markValues).map(([markId, data]) => ({
      markId,
      marksObtained: data.marks,
      remarks: data.remarks
    }));

    bulkUpdateMutation.mutate({ marks: updates });
  };

  const handleEdit = (mark: MarkEntry) => {
    setEditingMark(mark);
    setMarkValues(prev => ({
      ...prev,
      [mark.id]: {
        marks: mark.marksObtained,
        remarks: mark.remarks || ''
      }
    }));
  };

  const handleDelete = (mark: MarkEntry) => {
    setDeletingMark(mark);
  };

  const confirmDelete = () => {
    if (deletingMark) {
      deleteMutation.mutate(deletingMark.id);
    }
  };

  useEffect(() => {
    if (!examId) {
      navigate('/exams');
    }
  }, [examId, navigate]);

  const exam = examData?.data as Exam;
  const marks = marksData?.data || [];
  const isLocked = exam?.isMarksLocked || false;

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

  const hasUnsavedChanges = Object.keys(markValues).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marks Entry</h1>
          <p className="text-muted-foreground">
            Enter marks for: <span className="font-medium">{exam.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isLocked ? "destructive" : "default"} className="flex items-center gap-1">
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {isLocked ? 'Locked' : 'Unlocked'}
          </Badge>
          
          <PermissionGuard permission="lock_marks">
            <Button
              variant={isLocked ? "outline" : "default"}
              onClick={() => isLocked ? unlockMutation.mutate() : lockMutation.mutate()}
              disabled={lockMutation.isPending || unlockMutation.isPending}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Marks
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Marks
                </>
              )}
            </Button>
          </PermissionGuard>

          <Button onClick={() => setShowBulkForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Bulk Entry
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">You have unsaved changes</span>
                <span className="text-sm text-muted-foreground">
                  ({Object.keys(markValues).length} student{Object.keys(markValues).length !== 1 ? 's' : ''} affected)
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMarkValues({})}>
                  Discard
                </Button>
                <Button size="sm" onClick={handleBulkSave} disabled={bulkUpdateMutation.isPending}>
                  {bulkUpdateMutation.isPending ? 'Saving...' : 'Save All'}
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
            Marks Entry ({marks.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marksLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : marks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                No students are enrolled for this exam yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marks.map((mark: MarkEntry) => {
                    const isEditing = editingMark?.id === mark.id;
                    const currentValue = markValues[mark.id];
                    const marksExceeded = currentValue?.marks > (mark.subjectPaper?.maxMarks || 0);
                    const isFailed = currentValue?.marks < (mark.subjectPaper?.passingMarks || 0);

                    return (
                      <TableRow key={mark.id} className={currentValue ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <div className="font-medium">{mark.student?.name || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{mark.student?.rollNumber || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {mark.student?.class} - {mark.student?.section}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{mark.subjectPaper?.subject?.name || '-'}</div>
                            <div className="text-sm text-muted-foreground">{mark.subjectPaper?.subject?.code || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{mark.subjectPaper?.maxMarks || '-'}</div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={mark.subjectPaper?.maxMarks}
                                value={currentValue?.marks ?? mark.marksObtained}
                                onChange={(e) => handleMarkChange(mark.id, 'marks', parseInt(e.target.value) || 0)}
                                className={`w-24 ${marksExceeded ? 'border-red-500' : ''}`}
                              />
                              {marksExceeded && (
                                <span className="text-xs text-red-500">Exceeds max</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isFailed ? 'text-red-600' : mark.marksObtained > 0 ? 'text-green-600' : ''}`}>
                                {mark.marksObtained}
                              </span>
                              {mark.marksObtained > 0 && (
                                <Badge variant={isFailed ? "destructive" : "default"}>
                                  {isFailed ? 'Fail' : 'Pass'}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Textarea
                              value={currentValue?.remarks ?? mark.remarks || ''}
                              onChange={(e) => handleMarkChange(mark.id, 'remarks', e.target.value)}
                              placeholder="Add remarks..."
                              className="min-w-[150px]"
                              rows={2}
                            />
                          ) : (
                            <span className="text-sm">{mark.remarks || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isLocked && (
                              <>
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveMark(mark.id)}
                                      disabled={updateMutation.isPending || marksExceeded}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingMark(null);
                                        const newMarkValues = { ...markValues };
                                        delete newMarkValues[mark.id];
                                        setMarkValues(newMarkValues);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(mark)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            <PermissionGuard permission="delete_marks">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(mark)}
                                    disabled={isLocked}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Mark Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the mark entry for "{mark.student?.name}"? This action cannot be undone.
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showBulkForm && (
        <BulkMarksForm
          exam={exam}
          marks={marks}
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            refetch();
            setShowBulkForm(false);
          }}
        />
      )}
    </div>
  );
}
