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
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { timetableApi, subjectApi, sectionApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const timetableSlotSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  day: z.string().min(1, 'Day is required'),
  period: z.number().min(1).max(8),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().min(1, 'Room is required'),
});

type TimetableSlotFormData = z.infer<typeof timetableSlotSchema>;

interface TimetableSlotFormProps {
  classes: Array<{
    id: string;
    name: string;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

const days = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
];

const periods = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Period ${i + 1}`,
}));

const timeSlots = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:15'
];

export function TimetableSlotForm({ classes, onClose, onSuccess }: TimetableSlotFormProps) {
  const [open, setOpen] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSlots, setBulkSlots] = useState<TimetableSlotFormData[]>([]);

  const form = useForm<TimetableSlotFormData>({
    resolver: zodResolver(timetableSlotSchema),
    defaultValues: {
      classId: '',
      sectionId: '',
      subjectId: '',
      teacherId: '',
      day: '',
      period: 1,
      startTime: '',
      endTime: '',
      room: '',
    },
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectApi.getAll();
      return response.data;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await userApi.getAll({ role: 'teacher' });
      return response.data;
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedSubjectId = form.watch('subjectId');

  const { data: classSectionsData } = useQuery({
    queryKey: ['sections', 'class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return { data: [] };
      const response = await sectionApi.getByClass(selectedClassId);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  const { data: subjectTeachersData } = useQuery({
    queryKey: ['subjects', 'teachers', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return { data: [] };
      const response = await subjectApi.getByTeacher(selectedSubjectId);
      return response.data;
    },
    enabled: !!selectedSubjectId,
  });

  const createMutation = useMutation({
    mutationFn: bulkMode ? timetableApi.createBulk : timetableApi.create,
    onSuccess: () => {
      toast.success(`Timetable slot${bulkMode ? 's' : ''} created successfully`);
      onSuccess();
    },
    onError: (error: any) => {
      const response = error.response?.data;
      if (response?.conflicts) {
        toast.error(`Scheduling conflict: ${response.message || 'Failed to create timetable slot'}`);
      } else {
        handleApiError(error, 'Failed to create timetable slot');
      }
    },
  });

  const onSubmit = (data: TimetableSlotFormData) => {
    if (bulkMode && bulkSlots.length === 0) {
      toast.error('Please add at least one slot for bulk creation');
      return;
    }

    if (bulkMode) {
      createMutation.mutate(bulkSlots);
    } else {
      createMutation.mutate(data);
    }
  };

  const addBulkSlot = () => {
    const currentData = form.getValues();
    if (!currentData.classId || !currentData.sectionId || !currentData.subjectId || 
        !currentData.teacherId || !currentData.day || !currentData.startTime || 
        !currentData.endTime || !currentData.room) {
      toast.error('Please fill all fields before adding to bulk list');
      return;
    }

    const existingIndex = bulkSlots.findIndex(
      slot => slot.day === currentData.day && slot.period === currentData.period
    );

    if (existingIndex !== -1) {
      bulkSlots[existingIndex] = { ...currentData };
      toast.info('Slot updated in bulk list');
    } else {
      setBulkSlots([...bulkSlots, { ...currentData }]);
      toast.success('Slot added to bulk list');
    }
  };

  const removeBulkSlot = (index: number) => {
    setBulkSlots(bulkSlots.filter((_, i) => i !== index));
  };

  const isLoading = createMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const filteredSections = selectedClassId 
    ? classSectionsData?.data || []
    : sectionsData?.data || [];

  const filteredTeachers = selectedSubjectId
    ? teachersData?.data?.filter((teacher: any) => 
        subjectTeachersData?.data?.some((subjectTeacher: any) => subjectTeacher.id === teacher.id)
      ) || []
    : teachersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bulkMode ? 'Create Bulk Timetable Slots' : 'Create Timetable Slot'}
          </DialogTitle>
          <DialogDescription>
            {bulkMode 
              ? 'Add multiple slots and create them all at once.'
              : 'Fill in the details to create a new timetable slot.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bulk Mode</label>
            <Switch checked={bulkMode} onCheckedChange={setBulkMode} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          {subjectsData?.data?.map((subject: any) => (
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
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredTeachers.map((teacher: any) => (
                            <SelectItem key={`teacher-${teacher.id || teacher._id}`} value={teacher.id || teacher._id}>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periods.map((period) => (
                            <SelectItem key={period.value} value={period.value.toString()}>
                              {period.label}
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
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Room 101" {...field} />
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

              {bulkMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Bulk Slots ({bulkSlots.length})</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBulkSlot}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Current Slot
                    </Button>
                  </div>

                  {bulkSlots.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bulkSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="text-sm">
                            {slot.day} - Period {slot.period} - {slot.room}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBulkSlot(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create {bulkMode ? 'Slots' : 'Slot'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
