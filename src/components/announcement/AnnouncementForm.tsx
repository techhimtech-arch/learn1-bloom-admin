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
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { announcementApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Upload, X, Paperclip } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000),
  type: z.enum(['general', 'academic', 'sports', 'events', 'emergency', 'examination', 'holiday']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  targetAudience: z.array(z.string()).min(1, 'Select at least one target audience'),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  targetAudience: string[];
  publishDate?: string;
  expiryDate?: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  classes?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

const targetAudienceOptions = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'All Students' },
  { value: 'teachers', label: 'All Teachers' },
  { value: 'parents', label: 'All Parents' },
  { value: 'admin', label: 'Admin Only' },
];

export function AnnouncementForm({
  announcement,
  onClose,
  onSuccess,
}: AnnouncementFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      targetAudience: ['all'],
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      attachmentUrl: '',
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type as AnnouncementFormData['type'],
        priority: announcement.priority as AnnouncementFormData['priority'],
        targetAudience: announcement.targetAudience || ['all'],
        publishDate: announcement.publishDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        expiryDate: announcement.expiryDate?.split('T')[0] || '',
        attachmentUrl: announcement.attachmentUrl || '',
      });
    }
  }, [announcement, form]);

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementFormData) => announcementApi.create(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Announcement created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementFormData }) =>
      announcementApi.update(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Announcement updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to update announcement');
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    const payload = {
      title: data.title,
      content: data.content,
      type: data.type,
      priority: data.priority,
      targetAudience: data.targetAudience,
      publishDate: data.publishDate,
      expiryDate: data.expiryDate,
      attachmentUrl: data.attachmentUrl,
    };

    if (announcement) {
      updateMutation.mutate({ id: announcement.id, data: payload as AnnouncementFormData });
    } else {
      createMutation.mutate(payload as AnnouncementFormData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const watchedAudience = form.watch('targetAudience');

  const toggleAudience = (value: string) => {
    const current = watchedAudience || [];
    if (value === 'all') {
      form.setValue('targetAudience', ['all']);
      return;
    }
    const withoutAll = current.filter(v => v !== 'all');
    if (current.includes(value)) {
      const next = withoutAll.filter(v => v !== value);
      form.setValue('targetAudience', next.length > 0 ? next : ['all']);
    } else {
      form.setValue('targetAudience', [...withoutAll, value]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </DialogTitle>
          <DialogDescription>
            {announcement
              ? 'Update the announcement details below.'
              : 'Create a new announcement to share with the school community.'}
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
                    <Input placeholder="Enter announcement title (3-200 chars)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <div className="bg-background">
                      <ReactQuill
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[150px]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetAudience"
              render={() => (
                <FormItem>
                  <FormLabel>Target Audience *</FormLabel>
                  <div className="space-y-2 border rounded-md p-3">
                    {targetAudienceOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`audience-${opt.value}`}
                          checked={watchedAudience?.includes(opt.value) || false}
                          onCheckedChange={() => toggleAudience(opt.value)}
                        />
                        <label htmlFor={`audience-${opt.value}`} className="text-sm font-medium leading-none">
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
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

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
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
            </div>

            {/* Attachments */}
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
                      label="Add Notice/Circular PDF or Image"
                      onUploadSuccess={field.onChange}
                      previewUrl={field.value}
                      uploadType="announcement"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSize={5}
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
                {announcement ? 'Update Announcement' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
