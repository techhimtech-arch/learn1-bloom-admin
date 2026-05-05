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
import { timetableApi, teacherAssignmentApi, sectionApi, academicYearApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const timetableSlotSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  day: z.string().min(1, 'Day is required'),
  periodNumber: z.number().min(1).max(12),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  room: z.string().min(1, 'Room is required'),
});

type TimetableSlotFormData = z.infer<typeof timetableSlotSchema>;

type TimetableSlotFormProps = {
  classes: Array<{ id?: string; _id?: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
};

const days = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
];

const periods = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Period ${i + 1}` }));

const timeSlots = ['08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:15'];

const normalizeArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.data?.users)) return value.data.users;
  if (Array.isArray(value?.users)) return value.users;
  return [];
};

export function TimetableSlotForm({ classes, onClose, onSuccess }: TimetableSlotFormProps) {
  const [open, setOpen] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSlots, setBulkSlots] = useState<TimetableSlotFormData[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');

  const form = useForm<TimetableSlotFormData>({
    resolver: zodResolver(timetableSlotSchema),
    defaultValues: {
      academicYearId: '',
      classId: '',
      sectionId: '',
      subjectId: '',
      teacherId: '',
      day: '',
      periodNumber: 1,
      startTime: '',
      endTime: '',
      room: '',
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await academicYearApi.getCurrent();
        const id = resp?.data?.data?._id || resp?.data?._id || resp?.data?.data?.id || resp?.data?.id || '';
        if (mounted) {
          setAcademicYearId(id);
          if (id) form.setValue('academicYearId', id);
        }
      } catch (err) {
        // ignore - optional
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { data: academicYearsData } = useQuery({
    queryKey: ['timetable-form', 'academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return normalizeArray(response.data);
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedSectionId = form.watch('sectionId');
  const selectedSubjectId = form.watch('subjectId');
  const selectedAcademicYearId = form.watch('academicYearId');

  const normalizedClasses = (Array.isArray(classes) ? classes : [])
    .map((cls: any, idx: number) => {
      const id = cls._id || cls.id || `class-${idx}`;
      if (!cls._id && !cls.id) console.warn('TimetableSlotForm: class item missing id, falling back to index', cls);
      return {
        ...cls,
        classId: id,
      };
    })
    .filter((cls: any) => cls.classId && cls.name);

  const { data: classSectionsData } = useQuery({
    queryKey: ['timetable-form', 'sections', 'class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await sectionApi.getByClass(selectedClassId);
      return normalizeArray(response.data);
    },
    enabled: !!selectedClassId,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['timetable-form', 'teacher-assignments', selectedClassId, selectedSectionId, selectedAcademicYearId],
    queryFn: async () => {
      if (!selectedClassId || !selectedSectionId || !selectedAcademicYearId) return [];
      const response = await teacherAssignmentApi.getAll({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        academicYearId: selectedAcademicYearId,
        isActive: true,
      });
      return normalizeArray(response.data);
    },
    enabled: !!selectedClassId && !!selectedSectionId && !!selectedAcademicYearId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => (bulkMode ? timetableApi.createBulk(payload) : timetableApi.create(payload)),
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

    // prefer form value for academic year
    const yearId = data.academicYearId || academicYearId || '';
    if (!yearId) {
      toast.error('Please select an academic year');
      return;
    }

    const payloadSlot = {
      classId: data.classId,
      sectionId: data.sectionId,
      day: data.day,
      periodNumber: data.periodNumber,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room,
    };

    if (bulkMode) {
      createMutation.mutate({
        academicYearId: yearId,
        timetableSlots: bulkSlots.map((slot) => ({
          classId: slot.classId,
          sectionId: slot.sectionId,
          day: slot.day,
          periodNumber: slot.periodNumber,
          subjectId: slot.subjectId,
          teacherId: slot.teacherId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room,
        })),
      });
    } else {
      createMutation.mutate({ academicYearId: yearId, ...payloadSlot });
    }
  };

  const addBulkSlot = () => {
    const currentData = form.getValues();
    if (!currentData.academicYearId || !currentData.classId || !currentData.sectionId || !currentData.subjectId || !currentData.teacherId || !currentData.day || !currentData.startTime || !currentData.endTime || !currentData.room) {
      toast.error('Please fill all fields before adding to bulk list');
      return;
    }

    const existingIndex = bulkSlots.findIndex(slot => slot.day === currentData.day && slot.periodNumber === currentData.periodNumber && slot.classId === currentData.classId && slot.sectionId === currentData.sectionId);

    if (existingIndex !== -1) {
      const updated = [...bulkSlots];
      updated[existingIndex] = { ...currentData };
      setBulkSlots(updated);
      toast.info('Slot updated in bulk list');
    } else {
      setBulkSlots([...bulkSlots, { ...currentData }]);
      toast.success('Slot added to bulk list');
    }
  };

  const removeBulkSlot = (index: number) => setBulkSlots(bulkSlots.filter((_, i) => i !== index));

  const isLoading = createMutation.isLoading;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const filteredSections = selectedClassId ? (Array.isArray(classSectionsData) ? classSectionsData : []) : [];
  const normalizedAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];

  const subjectOptions = normalizedAssignments.reduce<Array<{ id: string; name: string }>>((items, assignment: any) => {
    const subject = assignment?.subjectId;
    const id = subject?._id || subject?.id || subject;
    const name = subject?.name || subject?.title || '';
    if (!id || !name || items.some((item) => item.id === id)) return items;
    items.push({ id, name });
    return items;
  }, []);

  const teacherOptions = normalizedAssignments
    .filter((assignment: any) => {
      const subject = assignment?.subjectId;
      const id = subject?._id || subject?.id || subject;
      return !selectedSubjectId || id === selectedSubjectId;
    })
    .reduce<Array<{ id: string; name: string }>>((items, assignment: any) => {
      const teacher = assignment?.teacherId;
      const id = teacher?._id || teacher?.id || teacher;
      const name = teacher?.name || teacher?.email || '';
      if (!id || !name || items.some((item) => item.id === id)) return items;
      items.push({ id, name });
      return items;
    }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;

    const matchingAssignment = normalizedAssignments.find((assignment: any) => {
      const subject = assignment?.subjectId;
      const id = subject?._id || subject?.id || subject;
      return id === selectedSubjectId;
    });

    const teacher = matchingAssignment?.teacherId;
    const teacherId = teacher?._id || teacher?.id || teacher;
    if (teacherId && form.getValues('teacherId') !== teacherId) {
      form.setValue('teacherId', teacherId);
    }
  }, [form, normalizedAssignments, selectedSubjectId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bulkMode ? 'Create Bulk Timetable Slots' : 'Create Timetable Slot'}</DialogTitle>
          <DialogDescription>
            {bulkMode ? 'Add multiple slots and create them all at once.' : 'Fill in the details to create a new timetable slot.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bulk Mode</label>
            <Switch checked={bulkMode} onCheckedChange={setBulkMode} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <FormField control={form.control} name="academicYearId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(academicYearsData) ? academicYearsData : []).map((yr: any, idx: number) => (
                          <SelectItem key={`ay-${yr._id || yr.id || idx}`} value={yr._id || yr.id}>{yr.name || yr.label || `${yr.startYear || ''}-${yr.endYear || ''}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="classId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('sectionId', '');
                        form.setValue('subjectId', '');
                        form.setValue('teacherId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {normalizedClasses.map((cls: any, idx: number) => (
                          <SelectItem key={`class-${cls.classId || `class-${idx}`}`} value={cls.classId}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sectionId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section *</FormLabel>
                    <Select value={field.value} onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('subjectId', '');
                      form.setValue('teacherId', '');
                    }} disabled={!selectedClassId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClassId ? 'Select section' : 'Select class first'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSections?.map((section: any) => (
                          <SelectItem key={`section-${section.id || section._id}`} value={section.id || section._id}>{section.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="subjectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('teacherId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectOptions.map((subject) => (
                          <SelectItem key={`subject-${subject.id}`} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="teacherId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedSubjectId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSubjectId ? 'Select teacher' : 'Select subject first'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teacherOptions.map((teacher) => (
                          <SelectItem key={`teacher-${teacher.id}`} value={teacher.id}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="day" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {days.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="periodNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((p) => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="room" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {bulkMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Bulk Slots ({bulkSlots.length})</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addBulkSlot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Current Slot
                    </Button>
                  </div>

                  {bulkSlots.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bulkSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="text-sm">{slot.day} - Period {slot.periodNumber} - {slot.room}</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeBulkSlot(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create {bulkMode ? 'Slots' : 'Slot'}</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

