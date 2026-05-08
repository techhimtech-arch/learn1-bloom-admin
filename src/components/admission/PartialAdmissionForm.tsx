import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Loader2 } from 'lucide-react';
import { admissionApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const partialSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  gender: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required')
    .refine((date) => {
      const age = new Date().getFullYear() - new Date(date).getFullYear();
      return age >= 5 && age <= 25;
    }, { message: 'Age between 5 and 25 years' }),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits').optional().or(z.literal('')),
  address: z.string().max(200, 'Max 200 characters').optional(),
  emergencyContact: z.string().regex(/^\d{10}$/, 'Must be 10 digits').optional().or(z.literal('')),
});

type PartialFormValues = z.infer<typeof partialSchema>;

interface PartialAdmissionFormProps {
  onSuccess?: () => void;
}

export function PartialAdmissionForm({ onSuccess }: PartialAdmissionFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<PartialFormValues>({
    resolver: zodResolver(partialSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PartialFormValues) => admissionApi.createPartial(data),
    onSuccess: (res) => {
      showApiSuccess(res, 'Partial admission created successfully.');
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['partial-admissions'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      showApiError(err, 'Failed to create partial admission');
    },
  });

  const onSubmit = (data: PartialFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Partial Admission Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
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
              
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Street" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input type="tel" placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Partial Admission
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
