import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { subjectApi, academicYearApi, classApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  academicSessionId: z.string().min(1, 'Academic session is required'),
  department: z.string().min(1, 'Department is required'),
  credits: z.number().min(1).max(10),
  weeklyHours: z.number().min(1).max(40),
  isOptional: z.boolean().default(false),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  classId: string;
  academicSessionId: string;
  department: string;
  credits: number;
  weeklyHours: number;
  isOptional: boolean;
}

interface SubjectFormProps {
  subject?: Subject | null;
  onClose: () => void;
  onSuccess: () => void;
}

const departments = [
  { value: 'SCIENCE', label: 'Science' },
  { value: 'COMMERCE', label: 'Commerce' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
  { value: 'OTHER', label: 'Other' },
];

export function SubjectForm({ subject, onClose, onSuccess }: SubjectFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      classId: '',
      academicSessionId: '',
      department: '',
      credits: 1,
      weeklyHours: 1,
      isOptional: false,
    },
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return response.data;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const academicYears = academicYearsData?.data || [];
  const classes = classesData?.data || [];

  useEffect(() => {
    if (subject) {
      form.reset({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        classId: subject.classId,
        academicSessionId: subject.academicSessionId,
        department: subject.department,
        credits: subject.credits,
        weeklyHours: subject.weeklyHours,
        isOptional: subject.isOptional,
      });
    } else {
      // Set default academic year
      const currentYear = academicYears.find((year: any) => year.isActive);
      if (currentYear) {
        form.setValue('academicSessionId', currentYear._id || currentYear.id);
      }
    }
  }, [subject, form, academicYearsData]);

  const createMutation = useMutation({
    mutationFn: subjectApi.create,
    onSuccess: () => {
      toast.success('Subject created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to create subject');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
      subjectApi.update(id, data),
    onSuccess: () => {
      toast.success('Subject updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to update subject');
    },
  });

  const onSubmit = (data: SubjectFormData) => {
    if (subject) {
      updateMutation.mutate({ id: subject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Edit Subject' : 'Create New Subject'}
          </DialogTitle>
          <DialogDescription>
            {subject 
              ? 'Update the subject information below.'
              : 'Fill in the details to create a new subject.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MATH101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the subject..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academicSessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year._id || year.id} value={year._id || year.id}>
                            {year.name} {year.isActive && '(Current)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1-10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weeklyHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Hours *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="40"
                        placeholder="1-40"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOptional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Optional Subject</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Students can choose whether to take this subject
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {subject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
