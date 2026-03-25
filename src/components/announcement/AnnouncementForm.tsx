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
import { Loader2 } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be at most 200 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content must be at most 5000 characters'),
  type: z.enum(['general', 'academic', 'sports', 'events', 'emergency', 'examination', 'holiday']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  targetAudience: z.array(z.string()).min(1, 'Select at least one target audience'),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content?: string;
  message?: string;
  type: string;
  priority: string;
  targetAudience?: string[];
  targetType?: string;
  targetIds?: string[];
}

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  classes?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

const typeOptions = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'events', label: 'Events' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'examination', label: 'Examination' },
  { value: 'holiday', label: 'Holiday' },
];

const audienceOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'parents', label: 'Parents' },
  { value: 'admin', label: 'Admin' },
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
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content || announcement.message || '',
        type: (announcement.type as AnnouncementFormData['type']) || 'general',
        priority: (announcement.priority as AnnouncementFormData['priority']) || 'medium',
        targetAudience: announcement.targetAudience || ['all'],
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
      toast.error(error.response?.data?.message || 'Failed to create announcement');
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
      toast.error(error.response?.data?.message || 'Failed to update announcement');
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    if (announcement) {
      updateMutation.mutate({ id: announcement.id, data });
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
                    <Textarea
                      placeholder="Enter your announcement content (min 10 chars)"
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
                        {typeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience *</FormLabel>
                  <FormControl>
                    <div className="space-y-2 border rounded-md p-3">
                      {audienceOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`audience-${opt.value}`}
                            checked={field.value?.includes(opt.value) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (opt.value === 'all') {
                                field.onChange(checked ? ['all'] : []);
                              } else {
                                const withoutAll = current.filter((v) => v !== 'all');
                                if (checked) {
                                  field.onChange([...withoutAll, opt.value]);
                                } else {
                                  field.onChange(withoutAll.filter((v) => v !== opt.value));
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor={`audience-${opt.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {opt.label}
                          </label>
                        </div>
                      ))}
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
                {announcement ? 'Update Announcement' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
