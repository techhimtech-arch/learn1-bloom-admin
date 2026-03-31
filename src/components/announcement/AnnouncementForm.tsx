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
import { Loader2, Upload, X } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.string().transform(val => val.toLowerCase()).refine((val) => ['general', 'academic', 'sports', 'events', 'emergency', 'examination', 'holiday'].includes(val), {
    message: 'Invalid type. Must be one of: general, academic, sports, events, emergency, examination, holiday'
  }),
  priority: z.string().transform(val => val.toLowerCase()).refine((val) => ['low', 'medium', 'high', 'urgent'].includes(val), {
    message: 'Invalid priority. Must be one of: low, medium, high, urgent'
  }),
  targetAudience: z.union([
    z.array(z.string()),
    z.string().transform(val => [val])
  ]).refine((val) => Array.isArray(val) && val.length > 0, {
    message: 'Target audience is required'
  }),
  targetClasses: z.array(z.object({ classId: z.string(), className: z.string() })).optional(),
  targetSections: z.array(z.object({ sectionId: z.string(), sectionName: z.string() })).optional(),
  publishDate: z.string().min(1, 'Publish date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  attachment: z.any().optional(),
}).refine((data) => {
  if (data.targetAudience.includes('specific_classes') && (!data.targetClasses || data.targetClasses.length === 0)) {
    return false;
  }
  if (data.targetAudience.includes('specific_sections') && (!data.targetSections || data.targetSections.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Please select specific targets',
  path: ['targetClasses'],
}).refine((data) => {
  return new Date(data.expiryDate) > new Date(data.publishDate);
}, {
  message: 'Expiry date must be after publish date',
  path: ['expiryDate'],
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'sports' | 'events' | 'emergency' | 'examination' | 'holiday';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  targetClasses?: Array<{ classId: string; className: string }>;
  targetSections?: Array<{ sectionId: string; sectionName: string }>;
  publishDate: string;
  expiryDate: string;
  attachmentUrl?: string;
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
  { value: 'specific_classes', label: 'Specific Classes' },
  { value: 'specific_sections', label: 'Specific Sections' },
];

export function AnnouncementForm({
  announcement,
  onClose,
  onSuccess,
}: AnnouncementFormProps) {
  const [open, setOpen] = useState(true);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      targetAudience: ['all'],
      targetClasses: [],
      targetSections: [],
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachment: undefined,
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        targetClasses: announcement.targetClasses || [],
        targetSections: announcement.targetSections || [],
        publishDate: announcement.publishDate.split('T')[0],
        expiryDate: announcement.expiryDate.split('T')[0],
        attachment: undefined,
      });
      
      if (announcement.attachmentUrl) {
        setAttachmentPreview(announcement.attachmentUrl);
      }
    }
  }, [announcement, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
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
  };

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
    // Create JSON payload with correct field names and lowercase values
    const payload: any = {
      title: data.title,
      content: data.content, // Keep as 'content' not 'message'
      type: data.type,
      priority: data.priority,
      targetAudience: data.targetAudience, // Send as array
      publishDate: data.publishDate,
      expiryDate: data.expiryDate,
    };
    
    // Add specific targets if needed
    if (data.targetAudience.includes('specific_classes') && data.targetClasses) {
      payload.targetClasses = data.targetClasses;
    }
    
    if (data.targetAudience.includes('specific_sections') && data.targetSections) {
      payload.targetSections = data.targetSections;
    }
    
    // Use FormData only if there's an attachment
    if (attachmentFile) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (Array.isArray(payload[key])) {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key]);
        }
      });
      formData.append('attachment', attachmentFile);
      
      if (announcement) {
        updateMutation.mutate({ id: announcement.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } else {
      // Send as JSON if no attachment
      if (announcement) {
        updateMutation.mutate({ id: announcement.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const targetTypeOptions = [
  { value: 'all', label: 'Everyone' },
  { value: 'student', label: 'All Students' },
  { value: 'teacher', label: 'All Teachers' },
  { value: 'parent', label: 'All Parents' },
  { value: 'admin', label: 'Admin Only' },
  { value: 'class', label: 'Specific Classes' },
  { value: 'section', label: 'Specific Sections' },
];

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
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="ACADEMIC">Academic</SelectItem>
                        <SelectItem value="SPORTS">Sports</SelectItem>
                        <SelectItem value="EVENTS">Events</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        <SelectItem value="EXAM">Examination</SelectItem>
                        <SelectItem value="HOLIDAY">Holiday</SelectItem>
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
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
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
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Clear target IDs when targetType changes
                    form.setValue('targetIds', []);
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {targetTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('targetType') !== 'all' && (
              <FormField
                control={form.control}
                name="targetIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Targets *</FormLabel>
                    <FormControl>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                        {form.watch('targetType') === 'class' && classes.map((cls) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={field.value?.includes(cls.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, cls.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== cls.id));
                                }
                              }}
                            />
                            <label htmlFor={`class-${cls.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {cls.name}
                            </label>
                          </div>
                        ))}
                        
                        {form.watch('targetType') === 'section' && sections.map((section) => (
                          <div key={section.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`section-${section.id}`}
                              checked={field.value?.includes(section.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...withoutAll, opt.value]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== section.id));
                                }
                              }}
                            />
                            <label htmlFor={`section-${section.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {section.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date *</FormLabel>
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
                    <FormLabel>Expiry Date *</FormLabel>
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
                          accept="image/*,.pdf,.doc,.docx"
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
                {announcement ? 'Update Announcement' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
