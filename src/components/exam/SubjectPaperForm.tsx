import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { examApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

const subjectPaperSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  maxMarks: z.number().min(1, 'Max marks must be at least 1'),
  passingMarks: z.number().min(0, 'Passing marks must be at least 0'),
  examDate: z.string().min(1, 'Exam date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => data.passingMarks <= data.maxMarks, {
  message: 'Passing marks cannot be greater than max marks',
  path: ['passingMarks'],
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type SubjectPaperFormData = z.infer<typeof subjectPaperSchema>;

interface SubjectPaper {
  id: string;
  examId: string;
  subjectId: string;
  teacherId: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string;
  startTime: string;
  endTime: string;
}

interface Exam {
  id: string;
  name: string;
  examType: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface SubjectPaperFormProps {
  exam: Exam;
  paper?: SubjectPaper | null;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

export function SubjectPaperForm({ 
  exam, 
  paper, 
  subjects, 
  teachers, 
  onClose, 
  onSuccess 
}: SubjectPaperFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<SubjectPaperFormData>({
    resolver: zodResolver(subjectPaperSchema),
    defaultValues: {
      subjectId: '',
      teacherId: '',
      maxMarks: 100,
      passingMarks: 40,
      examDate: '',
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    if (paper) {
      form.reset({
        subjectId: paper.subjectId,
        teacherId: paper.teacherId,
        maxMarks: paper.maxMarks,
        passingMarks: paper.passingMarks,
        examDate: paper.examDate,
        startTime: paper.startTime,
        endTime: paper.endTime,
      });
    }
  }, [paper, form]);

  const createMutation = useMutation({
    mutationFn: (data: SubjectPaperFormData) => examApi.createPaper(exam.id, data),
    onSuccess: () => {
      toast.success('Subject paper created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      const response = error.response?.data;
      if (response?.conflict) {
        toast.error(`Conflict: ${response.message || 'Failed to create subject paper'}`);
      } else {
        handleApiError(error, 'Failed to create subject paper');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ data }: { data: SubjectPaperFormData }) =>
      examApi.updatePaper(exam.id, paper!.id, data),
    onSuccess: () => {
      toast.success('Subject paper updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      const response = error.response?.data;
      if (response?.conflict) {
        toast.error(`Conflict: ${response.message || 'Failed to update subject paper'}`);
      } else {
        handleApiError(error, 'Failed to update subject paper');
      }
    },
  });

  const onSubmit = (data: SubjectPaperFormData) => {
    if (paper) {
      updateMutation.mutate({ data });
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
            {paper ? 'Edit Subject Paper' : 'Add Subject Paper'}
          </DialogTitle>
          <DialogDescription>
            {paper 
              ? 'Update the subject paper information below.'
              : 'Fill in the details to create a new subject paper.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
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
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Teacher *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
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
                name="maxMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Marks *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
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
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Marks *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="40"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="examDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
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
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
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
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Validation Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Validation Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Max Marks: </span>
                  <span className="font-medium">{form.watch('maxMarks')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Passing Marks: </span>
                  <span className="font-medium">{form.watch('passingMarks')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pass Percentage: </span>
                  <span className="font-medium">
                    {form.watch('maxMarks') > 0 
                      ? Math.round((form.watch('passingMarks') / form.watch('maxMarks')) * 100)
                      : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time Duration: </span>
                  <span className="font-medium">
                    {form.watch('startTime') && form.watch('endTime') ? (
                      <span>{form.watch('startTime')} - {form.watch('endTime')}</span>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {paper ? 'Update Subject Paper' : 'Add Subject Paper'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
