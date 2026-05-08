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
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { academicCalendarApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

const calendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['holiday', 'exam', 'event', 'meeting']),
  subtype: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  venue: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'holiday' | 'exam' | 'event' | 'meeting';
  subtype?: string;
  priority: 'low' | 'medium' | 'high';
  venue?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
}

interface AcademicCalendarFormProps {
  event?: CalendarEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

const eventTypes = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'exam', label: 'Exam' },
  { value: 'event', label: 'Event' },
  { value: 'meeting', label: 'Meeting' },
];

const priorityLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const eventSubtypes: Record<string, Array<{ value: string; label: string }>> = {
  holiday: [
    { value: 'national', label: 'National Holiday' },
    { value: 'religious', label: 'Religious Holiday' },
    { value: 'seasonal', label: 'Seasonal Break' },
    { value: 'weekend', label: 'Weekend' },
  ],
  exam: [
    { value: 'midterm', label: 'Midterm Exam' },
    { value: 'final', label: 'Final Exam' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'practical', label: 'Practical Exam' },
    { value: 'assignment', label: 'Assignment Due' },
  ],
  event: [
    { value: 'cultural', label: 'Cultural Event' },
    { value: 'sports', label: 'Sports Event' },
    { value: 'academic', label: 'Academic Event' },
    { value: 'social', label: 'Social Event' },
    { value: 'workshop', label: 'Workshop' },
  ],
  meeting: [
    { value: 'faculty', label: 'Faculty Meeting' },
    { value: 'parent', label: 'Parent-Teacher Meeting' },
    { value: 'department', label: 'Department Meeting' },
    { value: 'committee', label: 'Committee Meeting' },
    { value: 'staff', label: 'Staff Meeting' },
  ],
};

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

export function AcademicCalendarForm({ event, onClose, onSuccess }: AcademicCalendarFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      type: 'event',
      subtype: '',
      priority: 'medium',
      venue: '',
      startTime: '',
      endTime: '',
      isRecurring: false,
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || '',
        date: event.date,
        type: event.type,
        subtype: event.subtype || '',
        priority: event.priority,
        venue: event.venue || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        isRecurring: event.isRecurring || false,
      });
    }
  }, [event, form]);

  useEffect(() => {
    // Reset subtype when type changes
    form.setValue('subtype', '');
  }, [selectedType, form]);

  const createMutation = useMutation({
    mutationFn: academicCalendarApi.create,
    onSuccess: () => {
      toast.success('Event created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create event');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventFormData }) =>
      academicCalendarApi.update(id, data),
    onSuccess: () => {
      toast.success('Event updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update event');
    },
  });

  const onSubmit = (data: CalendarEventFormData) => {
    if (event) {
      updateMutation.mutate({ id: event.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const currentSubtypes = eventSubtypes[selectedType] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {event 
              ? 'Update the event information below.'
              : 'Fill in the details to create a new calendar event.'
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
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Day Celebration" {...field} />
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
                      placeholder="Detailed description of the event..."
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
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
            </div>

            {currentSubtypes.length > 0 && (
              <FormField
                control={form.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Subtype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentSubtypes.map((subtype) => (
                          <SelectItem key={subtype.value} value={subtype.value}>
                            {subtype.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
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
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Auditorium, Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
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
                    <FormLabel>End Time</FormLabel>
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

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Recurring Event</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      This event repeats on a regular basis
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
