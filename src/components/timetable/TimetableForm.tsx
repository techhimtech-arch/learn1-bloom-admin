import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Input,
  Button,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { TimetableFormData, Subject, Teacher, Class, Section, AcademicSession } from '@/types/timetable';
import { timetableUtils } from '@/services/timetableService';

const timetableFormSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  day: z.string().min(1, 'Day is required'),
  periodNumber: z.number().min(1, 'Period must be between 1 and 12').max(12, 'Period must be between 1 and 12'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  room: z.string().min(1, 'Room is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
}).refine((data) => {
  const start = new Date(`2000-01-01T${data.startTime}`);
  const end = new Date(`2000-01-01T${data.endTime}`);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

interface TimetableFormProps {
  onSubmit: (data: TimetableFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  initialData?: Partial<TimetableFormData>;
  subjects?: Subject[];
  teachers?: Teacher[];
  classes?: Class[];
  academicSessions?: AcademicSession[];
  sections?: Section[];
  selectedClassId?: string;
  onClassChange?: (classId: string) => void;
}

const TimetableForm: React.FC<TimetableFormProps> = ({
  onSubmit,
  isLoading = false,
  error = null,
  initialData,
  subjects = [],
  teachers = [],
  classes = [],
  academicSessions = [],
  sections = [],
  selectedClassId,
  onClassChange,
}) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [filteredClasses, setFilteredClasses] = useState<Class[]>(classes);

  const form = useForm<TimetableFormData>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      classId: initialData?.classId || '',
      sectionId: initialData?.sectionId || '',
      day: initialData?.day || '',
      periodNumber: initialData?.periodNumber || 1,
      subjectId: initialData?.subjectId || '',
      teacherId: initialData?.teacherId || '',
      startTime: initialData?.startTime || '09:00',
      endTime: initialData?.endTime || '10:00',
      room: initialData?.room || '',
      academicYearId: initialData?.academicYearId || '',
      semester: initialData?.semester || 'FIRST',
    },
  });

  useEffect(() => {
    if (selectedAcademicYear) {
      const filtered = classes.filter(cls => (cls as any).academicYearId === selectedAcademicYear || cls.academicSessionId === selectedAcademicYear);
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedAcademicYear, classes]);

  const handleAcademicYearChange = (value: string) => {
    setSelectedAcademicYear(value);
    form.setValue('academicYearId', value);
    form.setValue('classId', '');
    form.setValue('sectionId', '');
  };

  const handleClassChange = (value: string) => {
    form.setValue('classId', value);
    form.setValue('sectionId', '');
    onClassChange?.(value);
  };

  const handleSubmit = async (data: TimetableFormData) => {
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          {initialData ? 'Edit Timetable Entry' : 'Create Timetable Entry'}
        </CardTitle>
        <CardDescription>
          Fill in the details to schedule a class period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Academic Session */}
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select onValueChange={handleAcademicYearChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicSessions.map((session) => (
                          <SelectItem key={session._id} value={session._id}>
                            <div className="flex items-center gap-2">
                              <span>{session.name}</span>
                              {session.isActive && (
                                <Badge variant="secondary" className="text-xs">Active</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Semester */}
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIRST">First Semester</SelectItem>
                        <SelectItem value="SECOND">Second Semester</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class */}
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={handleClassChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredClasses.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name} (Grade {cls.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section */}
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('classId')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections
                          .filter(section => section.classId === form.watch('classId'))
                          .map((section) => (
                            <SelectItem key={section._id} value={section._id}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Day */}
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timetableUtils.getDaysOfWeek().map((day) => (
                          <SelectItem key={day} value={day}>
                            {timetableUtils.formatDay(day)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Period Number */}
              <FormField
                control={form.control}
                name="periodNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timetableUtils.getPeriodNumbers().map((period) => (
                          <SelectItem key={period} value={period.toString()}>
                            Period {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Room */}
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject */}
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            <div className="flex items-center gap-2">
                              <span>{subject.name}</span>
                              <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teacher */}
              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            <div className="flex flex-col">
                              <span>{teacher.name}</span>
                              <span className="text-xs text-gray-500">{teacher.email}</span>
                            </div>
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
              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: HH:MM (24-hour format)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: HH:MM (24-hour format)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {initialData ? 'Update Entry' : 'Create Entry'}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TimetableForm;
