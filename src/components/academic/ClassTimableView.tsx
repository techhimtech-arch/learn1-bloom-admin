import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { timetableApi, academicYearApi } from '@/pages/services/api';
import { useEffect, useState } from 'react';

interface ClassTimetableViewProps {
  classId: string;
  sectionId: string;
  viewMode: 'grid' | 'list';
}

interface TimetableSlot {
  id: string;
  day: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: {
    _id: string;
    name: string;
    code: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacherId?: {
    _id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  room: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const periods = Array.from({ length: 8 }, (_, i) => i + 1);

const getSubjectColor = (subjectName: string) => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
  ];
  const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function ClassTimetableView({ classId, sectionId, viewMode }: ClassTimetableViewProps) {
  const [academicSessionId, setAcademicSessionId] = useState('');

  useEffect(() => {
    const loadCurrentSession = async () => {
      try {
        const response = await academicYearApi.getCurrent();
        const currentSession = response.data?.data || response.data;
        setAcademicSessionId(currentSession?._id || '');
      } catch {
        setAcademicSessionId('');
      }
    };

    loadCurrentSession();
  }, []);

  const {
    data: timetableData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['timetable', 'class', classId, sectionId],
    queryFn: async () => {
      const response = await timetableApi.getByClass(classId, sectionId, academicSessionId);
      return response.data;
    },
    enabled: !!classId && !!sectionId && !!academicSessionId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2">
          <div></div>
          {periods.map((period) => (
            <Skeleton key={period} className="h-10" />
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="grid grid-cols-8 gap-2">
            <Skeleton className="h-16" />
            {periods.map((period) => (
              <Skeleton key={period} className="h-16" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Timetable</h3>
            <p className="text-muted-foreground">
              Failed to load timetable data. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timetable = timetableData?.data || [];
  const slotsByDayAndPeriod = new Map<string, TimetableSlot>();

  timetable.forEach((slot: any) => {
    // Backend uses periodNumber, handle both just in case
    const pNum = slot.periodNumber || slot.period;
    const dayName = (slot.day || '').toUpperCase();
    const key = `${dayName}-${pNum}`;
    
    // Normalize nested objects (handle both populated and raw)
    const normalizedSlot: TimetableSlot = {
      ...slot,
      periodNumber: pNum,
      subject: slot.subject || slot.subjectId || { name: 'N/A' },
      teacher: slot.teacher || slot.teacherId || { name: 'N/A' }
    };
    slotsByDayAndPeriod.set(key, normalizedSlot);
  });

  const getSlotForDayAndPeriod = (day: string, period: number) => {
    return slotsByDayAndPeriod.get(`${day.toUpperCase()}-${period}`);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {days.map((day) => {
          const daySlots = periods
            .map((period) => getSlotForDayAndPeriod(day, period))
            .filter(Boolean);

          if (daySlots.length === 0) return null;

          return (
            <Card key={day}>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-lg">{day}</h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot!.id}
                      className={`p-3 rounded-lg border ${getSubjectColor(slot!.subject?.name || 'Empty')}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className="text-xs">
                               Period {slot!.periodNumber}
                             </Badge>
                             <span className="text-sm font-medium">
                               {slot!.startTime} - {slot!.endTime}
                             </span>
                           </div>
                           <div className="font-medium">{slot!.subject?.name || 'N/A'}</div>
                           <div className="text-sm opacity-75">{slot!.subject?.code || ''}</div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                             <div className="flex items-center gap-1">
                               <User className="h-3 w-3" />
                               {slot!.teacher?.name || 'N/A'}
                             </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {slot!.room}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="font-medium text-sm p-2">Day</div>
          {periods.map((period) => (
            <div key={period} className="font-medium text-sm text-center p-2">
              Period {period}
            </div>
          ))}
        </div>

        {/* Timetable Grid */}
        <div className="space-y-2">
          {days.map((day) => (
            <div key={day} className="grid grid-cols-8 gap-2">
              <div className="font-medium text-sm p-2 bg-muted rounded">
                {day.slice(0, 3)}
              </div>
              {periods.map((period) => {
                const slot = getSlotForDayAndPeriod(day, period);
                
                if (!slot) {
                  return (
                    <div
                      key={period}
                      className="p-2 border border-dashed border-muted-foreground/20 rounded min-h-[80px]"
                    />
                  );
                }

                return (
                  <div
                    key={period}
                    className={`p-2 border rounded min-h-[80px] ${getSubjectColor(slot.subject?.name || 'Empty')}`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {slot.startTime}
                    </div>
                     <div className="font-medium text-sm mb-1 leading-tight">
                       {slot.subject?.name || 'N/A'}
                     </div>
                     <div className="text-xs opacity-75 mb-1">
                       {slot.subject?.code || ''}
                     </div>
                     <div className="flex items-center gap-1 text-xs">
                       <User className="h-3 w-3" />
                       <span className="truncate">{slot.teacher?.name || 'N/A'}</span>
                     </div>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{slot.room}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
