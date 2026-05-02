import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { admissionApi, classApi, sectionApi, academicYearApi } from '@/pages/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const fullSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  admissionNumber: z.string().min(3, 'At least 3 characters').max(20, 'Max 20 characters'),
  gender: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required').refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 5 && age <= 25;
  }, { message: 'Age between 5 and 25 years' }),
  bloodGroup: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^\d{10}$/, 'Must be 10 digits').optional().or(z.literal('')),
  address: z.string().max(200, 'Max 200 characters').optional(),
  academicYearId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().min(1, 'Required'),
  rollNumber: z.string().optional(),
});

type FullFormValues = z.infer<typeof fullSchema>;

interface FullAdmissionFormProps {
  onSuccess?: () => void;
}

export function FullAdmissionForm({ onSuccess }: FullAdmissionFormProps) {
  const queryClient = useQueryClient();

  const { data: academicYearsResp } = useQuery({ queryKey: ['academic-years'], queryFn: academicYearApi.getAll });
  const { data: classesResp } = useQuery({ queryKey: ['classes'], queryFn: classApi.getAll });
  const { data: sectionsResp } = useQuery({ queryKey: ['sections'], queryFn: sectionApi.getAll });

  const academicYears = academicYearsResp?.data?.data || [];
  const classes = classesResp?.data?.data || [];
  const sections = sectionsResp?.data?.data || [];

  const form = useForm<FullFormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      firstName: '', lastName: '', admissionNumber: '', gender: '', dateOfBirth: '', 
      bloodGroup: '', email: '', password: '', emergencyContact: '', address: '', 
      academicYearId: '', classId: '', sectionId: '', rollNumber: ''
    },
  });

  const selectedClassId = form.watch('classId');
  const availableSections = sections.filter((s: any) => {
    const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
    return cId === selectedClassId;
  });

  const mutation = useMutation({
    mutationFn: (data: FullFormValues) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.rollNumber) payload.rollNumber = parseInt(data.rollNumber);
      if (!data.password) delete payload.password;
      return admissionApi.create(payload);
    },
    onSuccess: (res) => {
      showApiSuccess(res, 'Student admitted successfully.');
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['full-admissions'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      showApiError(err, 'Failed to admit student');
    },
  });

  const onSubmit = (data: FullFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" /> Full Admission Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground border-b pb-1">Personal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="admissionNumber" render={({ field }) => (
                  <FormItem><FormLabel>Admission Number *</FormLabel><FormControl><Input placeholder="ADM-2026" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
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
                  <FormItem><FormLabel>Date of Birth *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
              </div>
            </div>

            {/* Contact & Account */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground border-b pb-1">Contact & Account</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Auto-generated if empty" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                  <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input type="tel" placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-3"><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Street" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            {/* Academic Details */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground border-b pb-1">Academic Details</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="academicYearId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {academicYears.map((a: any) => <SelectItem key={a._id} value={a._id}>{a.name || a.year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
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
                <FormField control={form.control} name="rollNumber" render={({ field }) => (
                  <FormItem><FormLabel>Roll Number</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>Clear</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Admit Student
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
