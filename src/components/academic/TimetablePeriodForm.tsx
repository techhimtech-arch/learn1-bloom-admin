import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Clock, Save, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { timetablePeriodApi } from '@/services/api';

interface TimetablePeriodFormProps {
  academicYearId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PeriodInput {
  periodNumber: number;
  startTime: string;
  endTime: string;
  label: string;
}

export function TimetablePeriodForm({ academicYearId, onClose, onSuccess }: TimetablePeriodFormProps) {
  const queryClient = useQueryClient();
  const [periods, setPeriods] = useState<PeriodInput[]>([
    { periodNumber: 1, startTime: '08:00', endTime: '08:50', label: 'Period 1' },
    { periodNumber: 2, startTime: '09:00', endTime: '09:50', label: 'Period 2' },
  ]);

  const addPeriod = () => {
    const nextNum = periods.length > 0 ? Math.max(...periods.map(p => p.periodNumber)) + 1 : 1;
    setPeriods([...periods, { periodNumber: nextNum, startTime: '', endTime: '', label: `Period ${nextNum}` }]);
  };

  const removePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const updatePeriod = (index: number, field: keyof PeriodInput, value: string | number) => {
    const newPeriods = [...periods];
    newPeriods[index] = { ...newPeriods[index], [field]: value };
    setPeriods(newPeriods);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => timetablePeriodApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-periods'] });
      toast.success('Timetable periods configured successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save periods');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const invalid = periods.some(p => !p.startTime || !p.endTime);
    if (invalid) {
      toast.error('Please fill in all start and end times');
      return;
    }

    mutation.mutate({
      academicYearId,
      periods: periods.map(p => ({
        ...p,
        schoolId: '' // Backend usually handles this from token
      }))
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Configure Timetable Periods
          </DialogTitle>
          <DialogDescription>
            Define the daily schedule for the academic year. These periods will appear as rows in your timetable builder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr_120px_120px_40px] gap-3 px-1 text-xs font-bold text-muted-foreground uppercase">
              <div>No.</div>
              <div>Label (Optional)</div>
              <div>Start Time</div>
              <div>End Time</div>
              <div></div>
            </div>

            {periods.map((period, index) => (
              <div key={index} className="grid grid-cols-[80px_1fr_120px_120px_40px] gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                <Input
                  type="number"
                  value={period.periodNumber}
                  onChange={(e) => updatePeriod(index, 'periodNumber', parseInt(e.target.value))}
                  placeholder="1"
                  className="bg-muted/30"
                />
                <Input
                  value={period.label}
                  onChange={(e) => updatePeriod(index, 'label', e.target.value)}
                  placeholder="e.g. Maths"
                />
                <Input
                  type="time"
                  value={period.startTime}
                  onChange={(e) => updatePeriod(index, 'startTime', e.target.value)}
                />
                <Input
                  type="time"
                  value={period.endTime}
                  onChange={(e) => updatePeriod(index, 'endTime', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removePeriod(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-dashed gap-2" 
            onClick={addPeriod}
          >
            <Plus className="h-4 w-4" /> Add Another Period
          </Button>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={mutation.isPending}>
              <Save className="h-4 w-4" />
              {mutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
