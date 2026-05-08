import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hash, Users, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AcademicFilters, AcademicFiltersState } from '@/components/shared/AcademicFilters';
import { BulkRollNumberForm } from '@/components/academic/BulkRollNumberForm';
import { rollNumberApi, classApi, sectionApi, academicYearApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Skeleton } from '@/components/ui/skeleton';
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

interface RollNumber {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
}

interface ValidationError {
  studentId: string;
  studentName: string;
  error: string;
}

export default function RollNumberManagement() {
  const [filters, setFilters] = useState<AcademicFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    department: '',
    status: '',
  });

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [reassignData, setReassignData] = useState({
    prefix: '',
    startingNumber: 1,
    preserveExisting: true,
  });

  const queryClient = useQueryClient();

  const {
    data: rollNumbersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['roll-numbers', filters],
    queryFn: async () => {
      if (!filters.classId || !filters.sectionId) return { data: [] };
      const response = await rollNumberApi.getByClass(filters.classId, filters.sectionId);
      return response.data;
    },
    enabled: !!filters.classId && !!filters.sectionId,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return response.data;
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: rollNumberApi.autoAssignSession,
    onSuccess: () => {
      toast.success('Roll numbers assigned successfully');
      refetch();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to assign roll numbers');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: rollNumberApi.reassign,
    onSuccess: () => {
      toast.success('Roll numbers reassigned successfully');
      refetch();
      setShowReassignDialog(false);
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to reassign roll numbers');
    },
  });

  const validateMutation = useMutation({
    mutationFn: rollNumberApi.validate,
    onSuccess: (response) => {
      const errors = response.data?.errors || [];
      if (errors.length === 0) {
        toast.success('All roll numbers are valid');
        setValidationErrors([]);
      } else {
        toast.warning(`Found ${errors.length} validation errors`);
        setValidationErrors(errors);
      }
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to validate roll numbers');
    },
  });

  const handleAutoAssign = () => {
    if (!filters.academicYearId) {
      toast.error('Please select an academic year');
      return;
    }

    autoAssignMutation.mutate({
      academicYearId: filters.academicYearId,
      classId: filters.classId,
      sectionId: filters.sectionId,
    });
  };

  const handleValidate = () => {
    if (!filters.classId || !filters.sectionId) {
      toast.error('Please select a class and section');
      return;
    }

    validateMutation.mutate({
      classId: filters.classId,
      sectionId: filters.sectionId,
      academicYearId: filters.academicYearId,
    });
  };

  const handleReassign = () => {
    if (!filters.classId || !filters.sectionId) {
      toast.error('Please select a class and section');
      return;
    }

    reassignMutation.mutate({
      classId: filters.classId,
      sectionId: filters.sectionId,
      ...reassignData,
    });
  };

  const hasValidFilters = filters.classId && filters.sectionId;
  const rollNumbers = rollNumbersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roll Number Management</h1>
          <p className="text-muted-foreground">Manage student roll numbers and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={!hasValidFilters || validateMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Validate
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowReassignDialog(true)}
            disabled={!hasValidFilters}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reassign
          </Button>
          <Button
            variant="outline"
            onClick={handleAutoAssign}
            disabled={!filters.academicYearId || autoAssignMutation.isPending}
          >
            <Hash className="h-4 w-4 mr-2" />
            Auto Assign
          </Button>
          <Button onClick={() => setShowBulkForm(true)} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Assign
          </Button>
        </div>
      </div>

      <AcademicFilters
        onFiltersChange={setFilters}
        showDepartment={false}
        showStatus={false}
        showSearch={false}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Validation Errors ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <div>
                    <span className="font-medium">{error.studentName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (ID: {error.studentId})
                    </span>
                  </div>
                  <Badge variant="destructive">{error.error}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Roll Numbers ({rollNumbers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasValidFilters ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select Class and Section</h3>
              <p className="text-muted-foreground">
                Please select a class and section to view roll numbers
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : rollNumbers.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Roll Numbers Found</h3>
              <p className="text-muted-foreground mb-4">
                No roll numbers assigned to students in this class and section
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={handleAutoAssign} disabled={autoAssignMutation.isPending}>
                  {autoAssignMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Hash className="mr-2 h-4 w-4" />
                  )}
                  Auto Assign Roll Numbers
                </Button>
                <Button variant="outline" onClick={() => setShowBulkForm(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Bulk Assign
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Academic Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rollNumbers.map((rollNumber: RollNumber) => (
                    <TableRow key={rollNumber.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {rollNumber.rollNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {rollNumber.studentName}
                      </TableCell>
                      <TableCell>{rollNumber.class?.name || '-'}</TableCell>
                      <TableCell>{rollNumber.section?.name || '-'}</TableCell>
                      <TableCell>{rollNumber.academicYear?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showBulkForm && (
        <BulkRollNumberForm
          classes={classesData?.data || []}
          academicYears={academicYearsData?.data || []}
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            refetch();
            setShowBulkForm(false);
          }}
        />
      )}

      <AlertDialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Roll Numbers</AlertDialogTitle>
            <AlertDialogDescription>
              This will reassign roll numbers for all students in the selected class and section.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="prefix">Roll Number Prefix</Label>
              <Input
                id="prefix"
                placeholder="e.g., 2024-"
                value={reassignData.prefix}
                onChange={(e) => setReassignData(prev => ({ ...prev, prefix: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="startingNumber">Starting Number</Label>
              <Input
                id="startingNumber"
                type="number"
                min="1"
                value={reassignData.startingNumber}
                onChange={(e) => setReassignData(prev => ({ ...prev, startingNumber: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="preserveExisting"
                checked={reassignData.preserveExisting}
                onCheckedChange={(checked) => setReassignData(prev => ({ ...prev, preserveExisting: checked }))}
              />
              <Label htmlFor="preserveExisting">Preserve existing roll numbers where possible</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReassign} disabled={reassignMutation.isPending}>
              {reassignMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reassign Roll Numbers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
