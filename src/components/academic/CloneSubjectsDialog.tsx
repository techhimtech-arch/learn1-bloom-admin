import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ArrowRight, X, Save } from 'lucide-react';
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
import { classApi, subjectApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Label } from '@/components/ui/label';

interface CloneSubjectsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  academicYearId: string;
  defaultSourceClassId?: string;
}

export function CloneSubjectsDialog({ isOpen, onClose, academicYearId, defaultSourceClassId }: CloneSubjectsDialogProps) {
  const [sourceClassId, setSourceClassId] = useState(defaultSourceClassId || '');
  const [targetClassId, setTargetClassId] = useState('');

  const queryClient = useQueryClient();

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
    enabled: isOpen,
  });

  const cloneMutation = useMutation({
    mutationFn: (data: any) => subjectApi.clone(data),
    onSuccess: () => {
      toast.success('Subjects cloned successfully');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onClose();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to clone subjects');
    },
  });

  const handleClone = () => {
    if (!sourceClassId || !targetClassId) {
      toast.error('Please select both source and target classes');
      return;
    }

    if (sourceClassId === targetClassId) {
      toast.error('Source and target classes cannot be the same');
      return;
    }

    cloneMutation.mutate({
      sourceClassId,
      targetClassId,
      academicYearId,
    });
  };

  const classes = classesData?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Clone Subjects
          </DialogTitle>
          <DialogDescription>
            Copy all subjects from one class to another for the current academic year.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="source-class">Source Class</Label>
            <Select
              value={sourceClassId}
              onValueChange={setSourceClassId}
            >
              <SelectTrigger id="source-class">
                <SelectValue placeholder="Select source class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Subjects will be copied from this class.</p>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-class">Target Class</Label>
            <Select
              value={targetClassId}
              onValueChange={setTargetClassId}
            >
              <SelectTrigger id="target-class">
                <SelectValue placeholder="Select target class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id} disabled={cls.id === sourceClassId}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Subjects will be added to this class.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={cloneMutation.isPending || !sourceClassId || !targetClassId}
            className="bg-primary hover:bg-primary/90"
          >
            {cloneMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Cloning...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clone Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
