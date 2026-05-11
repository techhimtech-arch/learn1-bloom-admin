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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { assignmentApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Upload, X, Paperclip } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description cannot exceed 5000 characters'),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxMarks: z.number().min(1, 'Max marks must be at least 1'),
  allowLateSubmission: z.boolean().optional().default(false),
  lateSubmissionPenalty: z.number().min(0).max(100, 'Penalty must be between 0-100').optional().default(0),
  attachmentUrl: z.string().optional(),
}).refine((data) => {
  return new Date(data.dueDate) > new Date();
}, {
  message: 'Due date must be in the future',
  path: ['dueDate'],
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
}

interface AssignmentFormProps {
  assignment?: Assignment | null;
  classes: Array<{
    id: string;
    _id?: string;
    name: string;
  }>;
  sections: Array<{
    id: string;
    _id?: string;
    name: string;
  }>;
  subjects: Array<{
    id: string;
    _id?: string;
    name: string;
    code: string;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignmentForm({ 
  assignment, 
  classes, 
  sections, 
  subjects, 
  onClose, 
  onSuccess 
}: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      subjectId: '',
      classId: '',
      sectionId: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxMarks: 100,
      allowLateSubmission: false,
      lateSubmissionPenalty: 0,
      attachmentUrl: '',
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description,
        subjectId: assignment.subjectId,
        classId: assignment.classId,
        sectionId: assignment.sectionId,
        dueDate: assignment.dueDate.split('T')[0],
        maxMarks: assignment.maxMarks,
        allowLateSubmission: false,
        lateSubmissionPenalty: 0,
        attachmentUrl: assignment.attachmentUrl || '',
      });
    }
  }, [assignment, form]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => assignmentApi.create(data as any),
    onSuccess: () => {
      toast.success('Assignment created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error creating assignment:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to create assignment';
      toast.error(message);
      handleApiError(error, message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => 
      assignmentApi.update(id, data as any),
    onSuccess: () => {
      toast.success('Assignment updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error updating assignment:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to update assignment';
      toast.error(message);
      handleApiError(error, message);
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    // Convert date to ISO 8601 format
    const dueDateISO = new Date(data.dueDate).toISOString();
    
    const payload: any = {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      classId: data.classId,
      sectionId: data.sectionId,
      dueDate: dueDateISO,
      maxMarks: data.maxMarks,
      attachmentUrl: data.attachmentUrl || undefined
    };

    if (data.allowLateSubmission) {
      payload.allowLateSubmission = true;
      if (data.lateSubmissionPenalty) {
        payload.lateSubmissionPenalty = data.lateSubmissionPenalty;
      }
    }

    if (assignment) {
      updateMutation.mutate({ id: assignment.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Edit Assignment' : 'New Assignment'}
          </DialogTitle>
          <DialogDescription>
            {assignment 
              ? 'Update the assignment details below.'
              : 'Create a new assignment for students.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter assignment title"
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter assignment description and instructions"
                      rows={4}
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
                          <SelectItem key={`subject-${subject.id || subject._id}`} value={subject.id || subject._id}>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {classes.map((cls) => (
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
                        {sections.map((section) => (
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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
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
                name="allowLateSubmission"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 mt-2">
                    <div>
                      <input 
                        type="checkbox"
                        id="allowLateSubmission"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                    <FormLabel htmlFor="allowLateSubmission" className="mt-0 cursor-pointer">
                      Allow Late Submission
                    </FormLabel>
                  </FormItem>
                )}
              />

              {form.watch('allowLateSubmission') && (
                <FormField
                  control={form.control}
                  name="lateSubmissionPenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late Submission Penalty (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="attachmentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachment (Optional)
                  </FormLabel>
                  <FormControl>
                    <FileUpload 
                      label="Add Resource/Material"
                      onUploadSuccess={field.onChange}
                      previewUrl={field.value}
                      uploadType="assignment"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      maxSize={10}
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
                {assignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
