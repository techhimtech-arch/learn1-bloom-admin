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
import { studentApi, classApi, sectionApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const editSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditStudentDialogProps {
  studentId: string | null;
  initialData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditStudentDialog({ studentId, initialData, open, onOpenChange, onSuccess }: EditStudentDialogProps) {
  const queryClient = useQueryClient();

  const { data: classesResp } = useQuery({ queryKey: ['classes'], queryFn: classApi.getAll, enabled: open });
  const { data: sectionsResp } = useQuery({ queryKey: ['sections'], queryFn: sectionApi.getAll, enabled: open });

  const classes = classesResp?.data?.data || [];
  const sections = sectionsResp?.data?.data || [];

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: '', lastName: '', gender: '', dateOfBirth: '', classId: '',
      sectionId: '', rollNumber: '', parentName: '', parentPhone: '', parentEmail: '', address: ''
    },
  });

  useEffect(() => {
    if (initialData && open) {
      const currentEnrollment = initialData.currentEnrollment || {};
      form.reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth ? String(initialData.dateOfBirth).slice(0, 10) : '',
        classId: currentEnrollment.classId?._id || currentEnrollment.classId || '',
        sectionId: currentEnrollment.sectionId?._id || currentEnrollment.sectionId || '',
        rollNumber: currentEnrollment.rollNumber ? String(currentEnrollment.rollNumber) : '',
        parentName: initialData.parentName || initialData.parentUserId?.name || '',
        parentPhone: initialData.parentPhone || initialData.parentUserId?.phone || '',
        parentEmail: initialData.parentEmail || initialData.parentUserId?.email || '',
        address: initialData.address || '',
      });
    }
  }, [initialData, open, form]);

  const selectedClassId = form.watch('classId');
  const availableSections = sections.filter((s: any) => {
    const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
    return cId === selectedClassId;
  });

  const mutation = useMutation({
    mutationFn: (data: EditFormValues) => {
      const payload: Record<string, unknown> = {
        firstName: data.firstName, lastName: data.lastName, gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth || undefined, classId: data.classId || undefined,
        sectionId: data.sectionId || undefined, parentName: data.parentName || undefined,
        parentPhone: data.parentPhone || undefined, parentEmail: data.parentEmail || undefined,
        address: data.address || undefined,
      };
      if (data.rollNumber) payload.rollNumber = parseInt(data.rollNumber);
      return studentApi.update(studentId!, payload);
    },
    onSuccess: (res) => {
      showApiSuccess(res, 'Student profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admitted-students'] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      showApiError(err, 'Failed to update student profile');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Student Profile</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="classId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
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
                  <FormLabel>Section</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availableSections.map((s: any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rollNumber" render={({ field }) => (
                <FormItem><FormLabel>Roll Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="parentName" render={({ field }) => (
                <FormItem><FormLabel>Parent Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="parentPhone" render={({ field }) => (
                <FormItem><FormLabel>Parent Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="parentEmail" render={({ field }) => (
                <FormItem><FormLabel>Parent Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
