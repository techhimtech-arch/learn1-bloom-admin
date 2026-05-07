import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ArrowRight, X, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { academicYearApi, subjectApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MigrateSubjectsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceYearId?: string;
  defaultTargetYearId?: string;
}

export function MigrateSubjectsDialog({ isOpen, onClose, defaultSourceYearId, defaultTargetYearId }: MigrateSubjectsDialogProps) {
  const [sourceYearId, setSourceYearId] = useState(defaultSourceYearId || '');
  const [targetYearId, setTargetYearId] = useState(defaultTargetYearId || '');

  const queryClient = useQueryClient();

  const { data: yearsData, isLoading: isLoadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return response.data;
    },
    enabled: isOpen,
  });

  const migrateMutation = useMutation({
    mutationFn: (data: any) => subjectApi.migrate(data),
    onSuccess: () => {
      toast.success('Academic year migration completed successfully');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onClose();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to migrate subjects');
    },
  });

  const handleMigrate = () => {
    if (!sourceYearId || !targetYearId) {
      toast.error('Please select both source and target academic years');
      return;
    }

    if (sourceYearId === targetYearId) {
      toast.error('Source and target academic years cannot be the same');
      return;
    }

    migrateMutation.mutate({
      sourceAcademicYearId: sourceYearId,
      targetAcademicYearId: targetYearId,
    });
  };

  const years = yearsData?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Migrate Subjects to New Year
          </DialogTitle>
          <DialogDescription>
            Copy all subjects from a previous academic year to a new one. This is typically done during year-end transitions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This will copy ALL subjects from the source year. Make sure the target year classes are already set up.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="source-year">Source Academic Year</Label>
            <Select
              value={sourceYearId}
              onValueChange={setSourceYearId}
            >
              <SelectTrigger id="source-year">
                <SelectValue placeholder="Select source year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year: any) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isCurrent ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-year">Target Academic Year</Label>
            <Select
              value={targetYearId}
              onValueChange={setTargetYearId}
            >
              <SelectTrigger id="target-year">
                <SelectValue placeholder="Select target year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year: any) => (
                  <SelectItem key={year.id} value={year.id} disabled={year.id === sourceYearId}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={migrateMutation.isPending || !sourceYearId || !targetYearId}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {migrateMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Migration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
