import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DataTable, { Column } from '@/components/shared/DataTable';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import {
  enrollmentApi,
  classApi,
  sectionApi,
  academicYearApi,
} from '@/services/api';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StudentEnrollment {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  className: string;
  sectionName: string;
  rollNumber: string;
  selected?: boolean;
}

interface PromotionRequest {
  studentId: string;
  currentEnrollmentId: string;
  newClassId: string;
  newSectionId: string;
  newRollNumber: string;
}

interface BulkPromotionProps {
  onClose?: () => void;
}

const BulkPromotion = ({ onClose }: BulkPromotionProps) => {
  const queryClient = useQueryClient();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    currentAcademicYearId: '',
    currentClassId: '',
    currentSectionId: '',
    newClassId: '',
    newSectionId: '',
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [promotionProgress, setPromotionProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Fetch setup data
  useEffect(() => {
    Promise.all([
      classApi.getAll().then(r => setClasses(r.data?.data || [])),
      academicYearApi.getAll().then(r => setAcademicYears(r.data?.data || [])),
      sectionApi.getAll().then(r => setSections(r.data?.data || [])),
    ]).catch(err => showApiError(err));
  }, []);

  // Update current sections when current class changes
  useEffect(() => {
    if (filters.currentClassId) {
      const filtered = sections.filter((s: any) => {
        const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
        return classId === filters.currentClassId;
      });
      setSections(filtered);
    }
  }, [filters.currentClassId]);

  // Get current section options
  const currentSectionOptions = sections.filter((s: any) => {
    const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
    return classId === filters.currentClassId;
  });

  // Get new section options
  const newSectionOptions = sections.filter((s: any) => {
    const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
    return classId === filters.newClassId;
  });

  // Fetch enrollments
  const { isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['bulk-promotion-enrollments', filters],
    queryFn: async () => {
      if (!filters.currentAcademicYearId || !filters.currentClassId) {
        setEnrollments([]);
        return [];
      }

      try {
        const res = await enrollmentApi.getClassEnrollments({
          academicYearId: filters.currentAcademicYearId,
          classId: filters.currentClassId,
          sectionId: filters.currentSectionId,
        });

        const data = (res.data?.data || []).map((item: any) => ({
          _id: item._id,
          studentId: item.studentId,
          className: item.classId?.name || '-',
          sectionName: item.sectionId?.name || '-',
          rollNumber: item.rollNumber || '-',
          selected: false,
        }));

        setEnrollments(data);
        setSelectedStudents([]);
        return data;
      } catch (error) {
        showApiError(error);
        setEnrollments([]);
        return [];
      }
    },
    enabled: !!filters.currentAcademicYearId && !!filters.currentClassId,
  });

  // Promotion mutation
  const promotionMutation = useMutation({
    mutationFn: async (requests: PromotionRequest[]) => {
      const results = {
        total: requests.length,
        completed: 0,
        failed: 0,
        errors: [] as string[],
      };

      setPromotionProgress(results);

      for (let i = 0; i < requests.length; i++) {
        try {
          await enrollmentApi.promote(requests[i]);
          results.completed++;
        } catch (error: any) {
          results.failed++;
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
          results.errors.push(
            `${enrollments.find(e => e._id === requests[i].currentEnrollmentId)?.studentId.firstName} - ${errorMsg}`
          );
        }
        setPromotionProgress({ ...results });
      }

      return results;
    },
    onSuccess: (results) => {
      if (results.failed === 0) {
        showApiSuccess(
          { data: { message: `All ${results.completed} students promoted successfully` } },
          `Successfully promoted ${results.completed} students!`
        );
        setSelectedStudents([]);
        setEnrollments([]);
        setFilters({
          currentAcademicYearId: '',
          currentClassId: '',
          currentSectionId: '',
          newClassId: '',
          newSectionId: '',
        });
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        onClose?.();
      } else if (results.completed > 0) {
        toast.warning(
          `Promotion completed with issues: ${results.completed} succeeded, ${results.failed} failed`
        );
      }
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      showApiError(error);
      setPromotionProgress(null);
    },
  });

  const handleSelectStudent = (enrollmentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(enrollmentId)
        ? prev.filter(id => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === enrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(enrollments.map(e => e._id));
    }
  };

  const handlePromoteBulk = () => {
    if (selectedStudents.length === 0) {
      showApiError(
        { response: { data: { message: 'Select at least one student' } } } as any
      );
      return;
    }

    if (!filters.newClassId || !filters.newSectionId) {
      showApiError(
        {
          response: {
            data: { message: 'Select target class and section' },
          },
        } as any
      );
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmPromotion = () => {
    const requests: PromotionRequest[] = selectedStudents.map(enrollmentId => {
      const enrollment = enrollments.find(e => e._id === enrollmentId);
      return {
        studentId: enrollment?.studentId._id || '',
        currentEnrollmentId: enrollmentId,
        newClassId: filters.newClassId,
        newSectionId: filters.newSectionId,
        newRollNumber: '',
      };
    });

    promotionMutation.mutate(requests);
  };

  const columns: Column<StudentEnrollment>[] = [
    {
      key: '_id',
      label: 'Select',
      width: '50px',
      render: (_, row) => (
        <Checkbox
          checked={selectedStudents.includes(row._id)}
          onCheckedChange={() => handleSelectStudent(row._id)}
        />
      ),
    },
    {
      key: 'studentId',
      label: 'Student Name',
      render: (student: any) =>
        student
          ? `${student.firstName} ${student.lastName}`
          : '-',
    },
    {
      key: 'studentId',
      label: 'Admission No.',
      render: (student: any) =>
        student?.admissionNumber || '-',
    },
    { key: 'className', label: 'Current Class' },
    { key: 'sectionName', label: 'Current Section' },
    { key: 'rollNumber', label: 'Roll Number' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Bulk Student Promotion
        </h2>
        <p className="text-sm text-muted-foreground">
          Promote multiple students from current class to a new class at once
        </p>
      </div>

      {/* Progress Modal */}
      {promotionProgress && (
        <Dialog open={!!promotionProgress}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Promotion Progress
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total: {promotionProgress.total}</span>
                  <span>
                    {promotionProgress.completed}/{promotionProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(promotionProgress.completed / promotionProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {promotionProgress.completed === promotionProgress.total && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      {promotionProgress.completed} promoted successfully
                    </span>
                  </div>
                  {promotionProgress.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {promotionProgress.failed} failed
                      </span>
                    </div>
                  )}
                  {promotionProgress.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Errors:
                      </p>
                      {promotionProgress.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {promotionProgress.completed === promotionProgress.total && (
              <DialogFooter>
                <Button
                  onClick={() => {
                    setPromotionProgress(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to promote {selectedStudents.length} student
              {selectedStudents.length !== 1 ? 's' : ''} to{' '}
              <strong>
                {classes.find(c => c._id === filters.newClassId)?.name}
              </strong>
              ,{' '}
              <strong>
                {sections.find(s => s._id === filters.newSectionId)?.name}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPromotion}
              disabled={promotionMutation.isPending}
            >
              {promotionMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Current Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="current-ay">Academic Year *</Label>
              <Select
                value={filters.currentAcademicYearId}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    currentAcademicYearId: value,
                    currentClassId: '',
                    currentSectionId: '',
                  }))
                }
              >
                <SelectTrigger id="current-ay">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(ay => (
                    <SelectItem key={ay._id} value={ay._id}>
                      {ay.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-class">Class *</Label>
              <Select
                value={filters.currentClassId}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    currentClassId: value,
                    currentSectionId: '',
                  }))
                }
              >
                <SelectTrigger id="current-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-section">Section (Optional)</Label>
              <Select
                value={filters.currentSectionId}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, currentSectionId: value }))
                }
              >
                <SelectTrigger id="current-section">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {currentSectionOptions.map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Class Selection */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Target Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-class">New Class *</Label>
                <Select
                  value={filters.newClassId}
                  onValueChange={value =>
                    setFilters(prev => ({
                      ...prev,
                      newClassId: value,
                      newSectionId: '',
                    }))
                  }
                >
                  <SelectTrigger id="new-class">
                    <SelectValue placeholder="Select new class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-section">New Section *</Label>
                <Select
                  value={filters.newSectionId}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, newSectionId: value }))
                  }
                >
                  <SelectTrigger id="new-section">
                    <SelectValue placeholder="Select new section" />
                  </SelectTrigger>
                  <SelectContent>
                    {newSectionOptions.map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Select Students ({selectedStudents.length} selected)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === enrollments.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={enrollments} loading={enrollmentsLoading} />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {enrollments.length > 0 && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                currentAcademicYearId: '',
                currentClassId: '',
                currentSectionId: '',
                newClassId: '',
                newSectionId: '',
              });
              setEnrollments([]);
              setSelectedStudents([]);
            }}
          >
            Clear
          </Button>
          <Button
            onClick={handlePromoteBulk}
            disabled={
              selectedStudents.length === 0 ||
              !filters.newClassId ||
              !filters.newSectionId ||
              promotionMutation.isPending
            }
          >
            Promote {selectedStudents.length > 0 && `(${selectedStudents.length})`}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!enrollmentsLoading && enrollments.length === 0 && filters.currentClassId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              No students found
            </p>
            <p className="text-sm text-muted-foreground">
              The selected class/section has no enrolled students
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkPromotion;
