import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subjectApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';

interface BulkSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  academicYearId: string;
}

interface SubjectRow {
  name: string;
  code: string;
  department: string;
  credits: string;
  weeklyHours: string;
}

const DEPARTMENTS = [
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'COMMERCE', label: 'Commerce' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'COMPUTER', label: 'Computer Science' },
  { value: 'PHYSICAL', label: 'Physical Education' },
];

export function BulkSubjectDialog({ isOpen, onClose, classId, academicYearId }: BulkSubjectDialogProps) {
  const [rows, setRows] = useState<SubjectRow[]>([
    { name: '', code: '', department: 'SCIENCE', credits: '4', weeklyHours: '5' },
  ]);

  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: (data: any) => subjectApi.bulkCreate(data),
    onSuccess: (response) => {
      const data = response.data;
      // Handle both { data: { created: [], errors: [] } } and { created: [], errors: [] }
      const resultData = data.data || data;
      const createdCount = resultData.created?.length || 0;
      const errors = resultData.errors || [];
      
      if (errors.length > 0) {
        toast.warning(`Created ${createdCount} subjects. ${errors.length} failed.`, {
          description: "Some subjects could not be created due to duplicate codes or other issues."
        });
        console.error('Bulk creation errors:', errors);
      } else {
        toast.success(data.message || `Successfully created ${createdCount || 'all'} subjects`);
      }
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onClose();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to perform bulk creation');
    },
  });

  const addRow = () => {
    setRows([...rows, { name: '', code: '', department: 'SCIENCE', credits: '4', weeklyHours: '5' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
  };

  const updateRow = (index: number, field: keyof SubjectRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = () => {
    // Basic validation
    const validRows = rows.filter(row => row.name && row.code);
    if (validRows.length === 0) {
      toast.error('Please add at least one subject with name and code');
      return;
    }

    if (!classId || !academicYearId) {
      toast.error('Class and Academic Year must be selected in filters');
      return;
    }

    bulkMutation.mutate({
      classId,
      academicYearId,
      subjects: validRows.map(row => ({
        ...row,
        credits: parseInt(row.credits),
        weeklyHours: parseInt(row.weeklyHours),
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Bulk Add Subjects
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 font-semibold text-sm text-muted-foreground px-2">
              <div className="col-span-3">Subject Name *</div>
              <div className="col-span-2">Code *</div>
              <div className="col-span-3">Department</div>
              <div className="col-span-2">Credits</div>
              <div className="col-span-1">Hours</div>
              <div className="col-span-1"></div>
            </div>

            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-lg group animate-in fade-in slide-in-from-top-1">
                <div className="col-span-3">
                  <Input
                    placeholder="e.g. Mathematics"
                    value={row.name}
                    onChange={(e) => updateRow(index, 'name', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="MATH101"
                    value={row.code}
                    onChange={(e) => updateRow(index, 'code', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="col-span-3">
                  <Select
                    value={row.department}
                    onValueChange={(val) => updateRow(index, 'department', val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={row.credits}
                    onChange={(e) => updateRow(index, 'credits', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    value={row.weeklyHours}
                    onChange={(e) => updateRow(index, 'weeklyHours', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="mt-4 w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Row
          </Button>
        </div>

        <DialogFooter className="pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={bulkMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {bulkMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Subjects
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
