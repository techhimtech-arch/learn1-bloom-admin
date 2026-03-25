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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { examApi, academicYearApi, classApi, sectionApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examType: z.string().min(1, 'Exam type is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['draft', 'scheduled', 'completed', 'published']).default('draft'),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type ExamFormData = z.infer<typeof examSchema>;

interface Exam {
  id: string;
  name: string;
  examType: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'completed' | 'published';
}

interface ExamFormProps {
  exam?: Exam | null;
  onClose: () => void;
  onSuccess: () => void;
}

const examTypes = [
  { value: 'midterm', label: 'Midterm Exam' },
  { value: 'final', label: 'Final Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'practical', label: 'Practical Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'test', label: 'Unit Test' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'published', label: 'Published' },
];

export function ExamForm({ exam, onClose, onSuccess }: ExamFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: '',
      examType: '',
      classId: '',
      sectionId: '',
      academicYearId: '',
      startDate: '',
      endDate: '',
      status: 'draft',
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

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
  });

  const selectedClassId = form.watch('classId');
  const { data: classSectionsData } = useQuery({
    queryKey: ['sections', 'class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return { data: [] };
      const response = await sectionApi.getByClass(selectedClassId);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    if (exam) {
      form.reset({
        name: exam.name,
        examType: exam.examType,
        classId: exam.classId,
        sectionId: exam.sectionId,
        academicYearId: exam.academicYearId,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
      });
    } else {
      // Set default academic year
      const currentYear = academicYearsData?.data?.find((year: any) => year.isActive);
      if (currentYear) {
        form.setValue('academicYearId', currentYear.id);
      }
    }
  }, [exam, form, academicYearsData]);

  useEffect(() => {
    // Reset section when class changes
    if (selectedClassId && exam?.classId !== selectedClassId) {
      form.setValue('sectionId', '');
    }
  }, [selectedClassId, form, exam]);

  const createMutation = useMutation({
    mutationFn: examApi.create,
    onSuccess: () => {
      toast.success('Exam created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to create exam');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExamFormData }) =>
      examApi.update(id, data),
    onSuccess: () => {
      toast.success('Exam updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to update exam');
    },
  });

  const onSubmit = (data: ExamFormData) => {
    if (exam) {
      updateMutation.mutate({ id: exam.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const filteredSections = selectedClassId 
    ? classSectionsData?.data || []
    : sectionsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {exam ? 'Edit Exam' : 'Create New Exam'}
          </DialogTitle>
          <DialogDescription>
            {exam 
              ? 'Update the exam information below.'
              : 'Fill in the details to create a new exam.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Midterm Examination" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {examTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYearsData?.data?.map((year: any) => (
                          <SelectItem key={`year-${year.id || year._id}`} value={year.id || year._id}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classesData?.data?.map((cls: any) => (
                          <SelectItem key={`class-${cls.id || cls._id}`} value={cls.id || cls._id}>
                            {cls.name}
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
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSections.map((section: any) => (
                          <SelectItem key={`section-${section.id || section._id}`} value={section.id || section._id}>
                            {section.name}
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                {exam ? 'Update Exam' : 'Create Exam'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
