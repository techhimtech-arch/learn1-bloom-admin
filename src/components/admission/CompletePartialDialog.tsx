import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { admissionApi, classApi, sectionApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const completeSchema = z.object({
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().min(1, 'Required'),
  admissionNumber: z.string().min(1, 'Required'),
  rollNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
});

type CompleteFormValues = z.infer<typeof completeSchema>;

interface CompletePartialDialogProps {
  partialStudent: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompletePartialDialog({ partialStudent, open, onOpenChange, onSuccess }: CompletePartialDialogProps) {
  const queryClient = useQueryClient();

  const { data: classesResp } = useQuery({ queryKey: ['classes'], queryFn: classApi.getAll, enabled: open });
  const { data: sectionsResp } = useQuery({ queryKey: ['sections'], queryFn: sectionApi.getAll, enabled: open });

  const classes = classesResp?.data?.data || [];
  const sections = sectionsResp?.data?.data || [];

  const form = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      classId: '',
      sectionId: '',
      admissionNumber: '',
      rollNumber: '',
      bloodGroup: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        classId: '',
        sectionId: '',
        admissionNumber: '',
        rollNumber: '',
        bloodGroup: '',
      });
    }
  }, [open, form]);

  const selectedClassId = form.watch('classId');
  const availableSections = sections.filter((s: any) => {
    const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
    return cId === selectedClassId;
  });

  const mutation = useMutation({
    mutationFn: (data: CompleteFormValues) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.rollNumber) payload.rollNumber = parseInt(data.rollNumber);
      const studentId = partialStudent.studentId?._id || partialStudent.studentId || partialStudent._id;
      return admissionApi.completePartial(studentId, payload);
    },
    onSuccess: (res) => {
      showApiSuccess(res, 'Admission completed successfully.');
      queryClient.invalidateQueries({ queryKey: ['partial-admissions'] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      showApiError(err, 'Failed to complete admission');
    },
  });

  if (!partialStudent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Admission — {partialStudent.firstName} {partialStudent.lastName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="classId" render={({ field }) => (
              <FormItem>
                <FormLabel>Class *</FormLabel>
                <Select onValueChange={(val) => { field.onChange(val); form.setValue('sectionId', ''); }} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {classes.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sectionId" render={({ field }) => (
              <FormItem>
                <FormLabel>Section *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {availableSections.map((s: any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="admissionNumber" render={({ field }) => (
              <FormItem><FormLabel>Admission Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="rollNumber" render={({ field }) => (
              <FormItem><FormLabel>Roll Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bloodGroup" render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {BLOOD_GROUP_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Admission
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
