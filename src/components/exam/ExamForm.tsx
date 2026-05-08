import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { examApi, academicYearApi, classApi, sectionApi, subjectApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examType: z.string().min(1, 'Exam type is required'),
  classes: z.array(z.string()).min(1, 'At least one class is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required'),
  sessionId: z.string().min(1, 'Session is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['DRAFT', 'SCHEDULED', 'COMPLETED', 'PUBLISHED']).default('DRAFT'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  passingPercentage: z.coerce.number().min(0).max(100).optional(),
  duration: z.coerce.number().min(1).optional(),
  subjects: z.array(z.object({
    subject_id: z.string().min(1, 'Subject is required'),
    max_marks: z.coerce.number().min(1, 'Required'),
  })).min(1, 'At least one subject is required'),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type ExamFormData = z.infer<typeof examSchema>;

interface Exam {
  id: string;
  name: string;
  examType: string;
  classes?: string[];
  sections?: string[];
  sectionId?: string | { _id: string; id?: string };
  sessionId?: string | { _id: string; id?: string };
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'PUBLISHED';
  description?: string;
  instructions?: string;
  passingPercentage?: number;
  duration?: number;
  subjects?: Array<{ subject_id: string; max_marks: number }>;
}

interface ExamFormProps {
  exam?: Exam | null;
  onClose: () => void;
  onSuccess: () => void;
}

const examTypes = [
  { value: 'UNIT_TEST', label: 'Unit Test' },
  { value: 'MID_TERM', label: 'Midterm Exam' },
  { value: 'FINAL_TERM', label: 'Final Exam' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'PRACTICAL', label: 'Practical Exam' },
  { value: 'VIVA', label: 'Viva Exam' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PUBLISHED', label: 'Published' },
];

function extractId(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.id || val._id || '';
}

export function ExamForm({ exam, onClose, onSuccess }: ExamFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: '',
      examType: '',
      classes: [],
      sections: [],
      sessionId: '',
      startDate: '',
      endDate: '',
      status: 'DRAFT',
      description: '',
      instructions: '',
      passingPercentage: 50,
      duration: 60,
      subjects: [{ subject_id: '', max_marks: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subjects',
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

  const selectedClassIds = form.watch('classes') as string[];

  const { data: classSectionsData } = useQuery({
    queryKey: ['sections', 'classes', ...(selectedClassIds || [])],
    queryFn: async () => {
      if (!selectedClassIds || selectedClassIds.length === 0) return { data: [] };
      const responses = await Promise.all(selectedClassIds.map((c) => sectionApi.getByClass(c)));
      const lists = responses.flatMap((r: any) => (r?.data?.data || r?.data || []));
      // unique by _id
      const map: Record<string, any> = {};
      lists.forEach((s: any) => { map[s._id || s.id] = s; });
      return { data: Object.values(map) };
    },
    enabled: !!selectedClassIds && selectedClassIds.length > 0,
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: ['subjects', 'classes', ...(selectedClassIds || [])],
    queryFn: async () => {
      if (!selectedClassIds || selectedClassIds.length === 0) return { data: [] };
      const responses = await Promise.all(selectedClassIds.map((c) => subjectApi.getByClass(c)));
      const lists = responses.flatMap((r: any) => (r?.data?.data || r?.data || []));
      const map: Record<string, any> = {};
      lists.forEach((s: any) => { map[s._id || s.id] = s; });
      return { data: Object.values(map) };
    },
    enabled: !!selectedClassIds && selectedClassIds.length > 0,
  });

  useEffect(() => {
    if (exam) {
      const formattedStartDate = exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '';
      const formattedEndDate = exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '';

      form.reset({
        name: exam.name,
        examType: exam.examType,
        classes: exam.classes || (exam.classId ? [extractId(exam.classId)] : []),
        sections: exam.sections || (exam.sectionId ? [extractId(exam.sectionId)] : []),
        sessionId: extractId(exam.sessionId),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: exam.status,
        description: exam.description,
        instructions: exam.instructions,
        passingPercentage: exam.passingPercentage || 50,
        duration: exam.duration || 60,
        subjects: exam.subjects?.length ? exam.subjects : [{ subject_id: '', max_marks: 100 }],
      });
    } else {
      const currentYear = academicYearsData?.data?.find((year: any) => year.isActive);
      if (currentYear) {
        form.setValue('sessionId', extractId(currentYear));
      }
    }
  }, [exam, form, academicYearsData]);

  useEffect(() => {
    // Clear selections when classes change to prevent mismatches
    const examClassesFirst = Array.isArray(exam?.classes) ? (exam.classes[0] || '') : extractId(exam?.classId);
    if (selectedClassIds && examClassesFirst !== (selectedClassIds[0] || '')) {
      if (!exam) {
        form.setValue('sections', []);
        form.setValue('subjects', [{ subject_id: '', max_marks: 100 }]);
      }
    }
  }, [selectedClassIds, form, exam]);

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
    mutationFn: ({ id, data }: { id: string; data: any }) =>
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
    const startDateTime = new Date(data.startDate);
    const endDateTime = new Date(data.endDate);

    if (endDateTime <= startDateTime) {
      toast.error('End date must be after start date');
      return;
    }

    const payload = {
      name: data.name,
      // Support multiple classes while keeping single-class compatibility
      classes: data.classes || [],
      class_id: (data.classes && data.classes.length > 0) ? data.classes[0] : undefined,
      exam_type: data.examType,
      sections: data.sections,
      subjects: data.subjects,
      session_id: data.sessionId,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      status: data.status,
      description: data.description,
      instructions: data.instructions,
      passing_percentage: data.passingPercentage,
      duration: data.duration,
    };

    if (exam) {
      updateMutation.mutate({ id: exam.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const availableSections = Array.isArray(classSectionsData?.data) ? classSectionsData.data : (Array.isArray(classSectionsData) ? classSectionsData : []);
  const availableSubjects = Array.isArray(classSubjectsData?.data) ? classSubjectsData.data : (Array.isArray(classSubjectsData) ? classSubjectsData : []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYearsData?.data?.map((year: any) => (
                          <SelectItem key={`year-${extractId(year)}`} value={extractId(year)}>
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
                name="classes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classes *</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-3 rounded-md">
                      {classesData?.data?.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-full">No classes available.</p>
                      )}
                      {classesData?.data?.map((cls: any) => (
                        <div key={`class-${extractId(cls)}`} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(extractId(cls))}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), extractId(cls)])
                                : field.onChange((field.value || []).filter((v: string) => v !== extractId(cls)));
                            }}
                          />
                          <div className="text-sm">{cls.name}</div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sections"
              render={() => (
                <FormItem>
                  <div className="mb-4 text-sm font-medium">Sections *</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-4 rounded-md">
                    {availableSections.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full">No sections available or select a class first.</p>
                    )}
                    {availableSections.map((section: any) => (
                      <FormField
                        key={extractId(section)}
                        control={form.control}
                        name="sections"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={extractId(section)}
                              className="flex flex-row items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(extractId(section))}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, extractId(section)])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== extractId(section))
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {section.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Subjects *</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ subject_id: '', max_marks: 100 })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Subject
                </Button>
              </div>
              <div className="space-y-3">
                 {fields.map((field, index) => (
                   <div key={field.id} className="flex items-start gap-3">
                     <div className="flex-1">
                       <FormField
                         control={form.control}
                         name={`subjects.${index}.subject_id`}
                         render={({ field }) => (
                           <FormItem>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select Subject" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                  {availableSubjects.map((sub: any) => (
                                    <SelectItem key={`sub-${extractId(sub)}`} value={extractId(sub)}>
                                      {sub.name} {sub.code && `(${sub.code})`}
                                    </SelectItem>
                                  ))}
                               </SelectContent>
                             </Select>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                     <div className="w-32">
                       <FormField
                         control={form.control}
                         name={`subjects.${index}.max_marks`}
                         render={({ field }) => (
                           <FormItem>
                             <FormControl>
                               <Input type="number" placeholder="Max Marks" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="text-destructive h-10 w-10 shrink-0"
                       onClick={() => remove(index)}
                       disabled={fields.length === 1}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 ))}
                 <FormMessage>
                    {form.formState.errors.subjects?.message}
                 </FormMessage>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passingPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exam instructions (optional)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exam description (optional)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
