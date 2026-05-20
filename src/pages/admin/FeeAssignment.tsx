import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataTable, { Column } from '@/components/shared/DataTable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import {
  feeApi,
  classApi,
  sectionApi,
  academicYearApi,
  studentApi,
} from '@/services/api';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';

interface FeeStructureItem {
  _id: string;
  feeName: string;
  feeType: string;
  amount: number;
  dueDate: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

interface AssignmentRecord {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  totalStudents: number;
  totalAmount: number;
  status: 'pending' | 'assigned' | 'failed';
}

const FeeAssignment = () => {
  const queryClient = useQueryClient();
  const { selectedYearId } = useConfig();

  const [mode, setMode] = useState<'class' | 'individual'>('class');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);

  const [filters, setFilters] = useState({
    classId: '',
    sectionId: '',
    studentId: '',
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [assignmentRecords, setAssignmentRecords] = useState<AssignmentRecord[]>([]);
  const [confirmData, setConfirmData] = useState<{
    type: 'class' | 'individual';
    target: string;
    amount: number;
    count: number;
  } | null>(null);

  // Fetch setup data
  useEffect(() => {
    Promise.all([
      classApi.getAll().then(r => setClasses(r.data?.data || [])),
      sectionApi.getAll().then(r => setSections(r.data?.data || [])),
      feeApi.getStructure().then(r => {
        const structures = r.data?.data || [];
        setFeeStructures(structures);
      }).catch(() => setFeeStructures([])),
    ]).catch(err => showApiError(err));
  }, []);

  // Fetch sections for selected class
  useEffect(() => {
    if (filters.classId) {
      const filtered = sections.filter((s: any) => {
        const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
        return classId === filters.classId;
      });
      setSections(filtered);
    }
  }, [filters.classId]);

  // Fetch students for class/section
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', filters.classId, filters.sectionId],
    queryFn: async () => {
      if (!filters.classId) return [];

      try {
        let url = `/students/class/${filters.classId}`;
        if (filters.sectionId) {
          url += `?sectionId=${filters.sectionId}`;
        }
        const res = await studentApi.getByClass(
          filters.classId,
          filters.sectionId
        );
        const studentsList = res.data?.data || [];
        setStudents(studentsList);
        return studentsList;
      } catch (error) {
        showApiError(error);
        setStudents([]);
        return [];
      }
    },
    enabled: !!filters.classId && mode === 'individual',
  });

  // Assignment mutation
  const assignmentMutation = useMutation({
    mutationFn: async (data: {
      type: 'class' | 'individual';
      academicYearId: string;
      classId: string;
      sectionId?: string;
      studentId?: string;
    }) => {
      if (data.type === 'class') {
        return await feeApi.generateStudentFees({
          academicYearId: data.academicYearId,
          classId: data.classId,
          sectionId: data.sectionId,
        });
      } else {
        return await feeApi.generateStudentFees({
          academicYearId: data.academicYearId,
          studentId: data.studentId,
        });
      }
    },
    onSuccess: (res) => {
      showApiSuccess(res, 'Fees assigned successfully!');
      setShowConfirm(false);
      setConfirmData(null);
      setFilters({ classId: '', sectionId: '', studentId: '' });
      queryClient.invalidateQueries({ queryKey: ['fee-structure'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });

  const getSectionOptions = () => {
    if (!filters.classId) return [];
    return sections.filter((s: any) => {
      const classId = typeof s.classId === 'object' ? s.classId._id : s.classId;
      return classId === filters.classId;
    });
  };

  const getCurrentClassName = () => {
    return classes.find(c => c._id === filters.classId)?.name || '';
  };

  const getCurrentSectionName = () => {
    return sections.find(s => s._id === filters.sectionId)?.name || '';
  };

  const calculateTotalFeeAmount = () => {
    return feeStructures.reduce((sum, f) => sum + (f.amount || 0), 0);
  };

  const handleAssignClass = () => {
    if (!filters.classId) {
      toast.error('Please select a class');
      return;
    }

    if (feeStructures.length === 0) {
      toast.error('No fee structures defined');
      return;
    }

    const studentCount = students.length || 0;
    if (studentCount === 0) {
      toast.error('No students found in selected class/section');
      return;
    }

    setConfirmData({
      type: 'class',
      target: `${getCurrentClassName()}${filters.sectionId ? ' - ' + getCurrentSectionName() : ''}`,
      amount: calculateTotalFeeAmount(),
      count: studentCount,
    });
    setShowConfirm(true);
  };

  const handleAssignIndividual = () => {
    if (!filters.studentId) {
      toast.error('Please select a student');
      return;
    }

    if (feeStructures.length === 0) {
      toast.error('No fee structures defined');
      return;
    }

    const student = students.find(s => s._id === filters.studentId);
    setConfirmData({
      type: 'individual',
      target: student ? `${student.firstName} ${student.lastName}` : 'Selected Student',
      amount: calculateTotalFeeAmount(),
      count: 1,
    });
    setShowConfirm(true);
  };

  const handleConfirmAssignment = () => {
    if (!confirmData) return;

    const data =
      confirmData.type === 'class'
        ? {
            type: 'class' as const,
            academicYearId: selectedYearId,
            classId: filters.classId,
            sectionId: filters.sectionId,
          }
        : {
            type: 'individual' as const,
            academicYearId: selectedYearId,
            classId: filters.classId,
            studentId: filters.studentId,
          };

    assignmentMutation.mutate(data);
  };

  const columns: Column<FeeStructureItem>[] = [
    { key: 'feeName', label: 'Fee Name' },
    { key: 'feeType', label: 'Type' },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (value: number) => <span>₹ {value.toLocaleString()}</span>,
    },
    { key: 'dueDate', label: 'Due Date' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Fee Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Assign fee structures to students, classes, or sections
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirm Fee Assignment
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-semibold">{confirmData?.target}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Students Affected</p>
                  <p className="font-semibold">{confirmData?.count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Fee per Student</p>
                  <p className="font-semibold text-lg">
                    ₹ {confirmData?.amount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p className="text-blue-900">
                    This will assign all defined fee structures to the selected
                    {confirmData?.type === 'class' ? ' class/section' : ' student'}.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssignment}
              disabled={assignmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {assignmentMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Mode</CardTitle>
          <CardDescription>Choose how to assign fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={mode === 'class' ? 'default' : 'outline'}
              onClick={() => {
                setMode('class');
                setFilters({ classId: '', sectionId: '', studentId: '' });
              }}
            >
              Assign to Class
            </Button>
            <Button
              variant={mode === 'individual' ? 'default' : 'outline'}
              onClick={() => {
                setMode('individual');
                setFilters({ classId: '', sectionId: '', studentId: '' });
              }}
            >
              Assign to Individual Student
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Class Mode */}
      {mode === 'class' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assign Fees to Class</CardTitle>
            <CardDescription>
              Select a class and optional section to assign fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    value={filters.classId}
                    onValueChange={v =>
                      setFilters(prev => ({ ...prev, classId: v, sectionId: '' }))
                    }
                  >
                    <SelectTrigger id="class">
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
                  <Label htmlFor="section">Section (Optional)</Label>
                  <Select
                    value={filters.sectionId}
                    onValueChange={v =>
                      setFilters(prev => ({ ...prev, sectionId: v }))
                    }
                  >
                    <SelectTrigger id="section">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {getSectionOptions().map(s => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAssignClass}
                disabled={!filters.classId || assignmentMutation.isPending}
                className="w-full"
              >
                Proceed to Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Mode */}
      {mode === 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assign Fees to Individual Student</CardTitle>
            <CardDescription>
              Select a student to assign fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="class-ind">Class *</Label>
                  <Select
                    value={filters.classId}
                    onValueChange={v =>
                      setFilters(prev => ({ ...prev, classId: v, sectionId: '' }))
                    }
                  >
                    <SelectTrigger id="class-ind">
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
                  <Label htmlFor="student">Student *</Label>
                  <Select
                    value={filters.studentId}
                    onValueChange={v =>
                      setFilters(prev => ({ ...prev, studentId: v }))
                    }
                  >
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsLoading ? (
                        <SelectItem value="">Loading...</SelectItem>
                      ) : (
                        students.map(s => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.firstName} {s.lastName} ({s.admissionNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAssignIndividual}
                disabled={
                  !filters.studentId || studentsLoading || assignmentMutation.isPending
                }
                className="w-full"
              >
                Proceed to Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Structures Summary */}
      {feeStructures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Structures to Assign</CardTitle>
            <CardDescription>
              Total: ₹ {calculateTotalFeeAmount().toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={feeStructures} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {feeStructures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              No fee structures defined
            </p>
            <p className="text-sm text-muted-foreground">
              Define fee structures first before assigning them to students
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeAssignment;
