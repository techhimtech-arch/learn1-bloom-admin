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
import { assignmentApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Upload, X } from 'lucide-react';

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
  attachment: z.any().optional(),
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
    name: string;
  }>;
  sections: Array<{
    id: string;
    name: string;
  }>;
  subjects: Array<{
    id: string;
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
  const [open, setOpen] = useState(true);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

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
      attachment: undefined,
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
        attachment: undefined,
      });
      
      if (assignment.attachmentUrl) {
        setAttachmentPreview(assignment.attachmentUrl);
      }
    }
  }, [assignment, form]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => assignmentApi.create(data),
    onSuccess: () => {
      console.log('✅ Assignment created successfully');
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
    mutationFn: ({ id, data }: { id: string; data: FormData }) => 
      assignmentApi.update(id, data),
    onSuccess: () => {
      console.log('✅ Assignment updated successfully');
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    form.setValue('attachment', undefined);
  };

  const onSubmit = (data: AssignmentFormData) => {
    // Convert date to ISO 8601 format
    const dueDateISO = new Date(data.dueDate).toISOString();
    
    // Prepare payload matching API spec exactly
    const payload: any = {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      classId: data.classId,
      sectionId: data.sectionId,
      dueDate: dueDateISO,  // ISO 8601 format: "2026-04-25T23:59:59.000Z"
      maxMarks: data.maxMarks,  // Number, not string
      attachments: []  // Array format as per API spec
    };

    // Add optional fields only if they have values
    if (data.allowLateSubmission) {
      payload.allowLateSubmission = true;  // Boolean, not string
      if (data.lateSubmissionPenalty) {
        payload.lateSubmissionPenalty = data.lateSubmissionPenalty;  // Number
      }
    }

    console.log('📤 Submitting assignment with payload:', payload);
    console.log('📋 Payload structure:', {
      title: typeof payload.title,
      description: typeof payload.description,
      subjectId: typeof payload.subjectId,
      classId: typeof payload.classId,
      sectionId: typeof payload.sectionId,
      dueDate: payload.dueDate,
      maxMarks: typeof payload.maxMarks,
      allowLateSubmission: typeof payload.allowLateSubmission,
      lateSubmissionPenalty: typeof payload.lateSubmissionPenalty,
    });

    // If there's a file attachment, use FormData to send it
    if (attachmentFile) {
      const formData = new FormData();
      // Append all fields
      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // For arrays, we'll handle specially if needed
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      // Append file
      formData.append('attachments', attachmentFile);
      
      console.log('📦 FormData with file attachment prepared');
      
      if (assignment) {
        updateMutation.mutate({ id: assignment.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } else {
      // Send as JSON (cleaner for API when no files)
      console.log('📄 Sending as JSON (no attachments)');
      
      // We need a different mutation that sends JSON instead of FormData
      // For now, create FormData without file
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      
      if (assignment) {
        updateMutation.mutate({ id: assignment.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
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
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeAttachment}
                          disabled={!attachmentFile && !attachmentPreview}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {(attachmentFile || attachmentPreview) && (
                        <div className="mt-2 p-2 border rounded-md bg-muted/50">
                          {attachmentPreview ? (
                            <img 
                              src={attachmentPreview} 
                              alt="Attachment preview" 
                              className="max-w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <Upload className="h-4 w-4" />
                              <span>{attachmentFile?.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
