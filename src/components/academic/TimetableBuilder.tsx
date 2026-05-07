import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  GripVertical, 
  Trash2, 
  Save, 
  Copy,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  timetableApi, 
  timetablePeriodApi, 
  teacherAssignmentApi,
  academicYearApi 
} from '@/pages/services/api';

interface TimetableBuilderProps {
  classId: string;
  sectionId: string;
  academicYearId: string;
}

interface Period {
  _id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  label?: string;
  isBreak?: boolean;
}

interface Assignment {
  _id: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  teacherId: {
    _id: string;
    name: string;
  };
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

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

export function TimetableBuilder({ classId, sectionId, academicYearId }: TimetableBuilderProps) {
  const queryClient = useQueryClient();
  const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null);

  // Fetch Academic Year if not provided
  const [activeYearId, setActiveYearId] = useState(academicYearId);
  useEffect(() => {
    if (!academicYearId) {
      academicYearApi.getCurrent().then(res => {
        setActiveYearId(res.data?.data?._id || res.data?._id);
      });
    } else {
      setActiveYearId(academicYearId);
    }
  }, [academicYearId]);

  // 1. Fetch Periods
  const { data: periodsData, isLoading: isLoadingPeriods } = useQuery({
    queryKey: ['timetable-periods', activeYearId],
    queryFn: async () => {
      const response = await timetablePeriodApi.getAll(activeYearId);
      return response.data?.data || response.data || [];
    },
    enabled: !!activeYearId,
  });

  // 2. Fetch Sidebar Inventory (Teacher Assignments for this class)
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['teacher-assignments', classId, sectionId, activeYearId],
    queryFn: async () => {
      const response = await teacherAssignmentApi.getByClassAndSection(classId, sectionId, activeYearId);
      return response.data?.data || response.data || [];
    },
    enabled: !!classId && !!sectionId && !!activeYearId,
  });

  // 3. Fetch Existing Timetable
  const { data: timetableData, isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['timetable-weekly', classId, sectionId, activeYearId],
    queryFn: async () => {
      const response = await timetableApi.getWeekly(classId, sectionId, activeYearId);
      return response.data?.data || response.data || [];
    },
    enabled: !!classId && !!sectionId && !!activeYearId,
  });

  // Mutations
  const createSlotMutation = useMutation({
    mutationFn: (data: any) => timetableApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-weekly'] });
      toast.success('Slot added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Conflict detected or server error';
      toast.error(message, {
        description: 'Check if teacher is busy or room is occupied.',
        duration: 5000,
      });
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => timetableApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-weekly'] });
      toast.success('Slot cleared');
    }
  });

  // Drag Handlers
  const onDragStart = (assignment: Assignment) => {
    setDraggedAssignment(assignment);
  };

  const onDrop = (day: string, period: Period) => {
    if (!draggedAssignment) return;

    const payload = {
      day: day.toUpperCase(),
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      subjectId: draggedAssignment.subjectId._id,
      teacherId: draggedAssignment.teacherId._id,
      classId,
      sectionId,
      academicYearId: activeYearId,
      room: 'TBD' // Default or could be prompted
    };

    createSlotMutation.mutate(payload);
    setDraggedAssignment(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoadingPeriods || isLoadingAssignments || isLoadingTimetable) {
    return <Skeleton className="w-full h-[600px] rounded-xl" />;
  }

  // Organize timetable data for easy lookup: grid[DAY][PERIOD_NUMBER]
  const grid: Record<string, Record<number, any>> = {};
  DAYS.forEach(day => {
    grid[day] = {};
  });
  (timetableData || []).forEach((slot: any) => {
    const day = (slot.day || '').toUpperCase();
    if (grid[day]) {
      grid[day][slot.periodNumber] = slot;
    }
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[700px]">
      {/* Sidebar: Inventory */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <Card className="flex-1 border-primary/20 shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Subject Inventory
            </CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Drag cards to the grid</p>
          </CardHeader>
          <CardContent className="p-3 space-y-3 overflow-y-auto max-h-[600px]">
            {assignmentsData.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No subjects assigned to this class yet.</p>
              </div>
            ) : (
              assignmentsData.map((assign: Assignment) => (
                <div
                  key={assign._id}
                  draggable
                  onDragStart={() => onDragStart(assign)}
                  className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:scale-[1.02] relative group ${getSubjectColor(assign.subjectId.name)}`}
                >
                  <GripVertical className="h-4 w-4 absolute right-2 top-2 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity" />
                  <div className="font-bold text-sm truncate pr-4">{assign.subjectId.name}</div>
                  <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {assign.teacherId.name}
                  </div>
                  <Badge variant="outline" className="mt-2 text-[10px] bg-white/50 backdrop-blur-sm border-none font-mono">
                    {assign.subjectId.code}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full text-xs gap-2 py-6 border-dashed" onClick={() => toast.info('Auto-generate feature coming soon!')}>
          <Save className="h-4 w-4" />
          Auto-Generate Schedule
        </Button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[900px] bg-card border rounded-xl shadow-lg overflow-hidden">
          {/* Grid Header */}
          <div className="grid grid-cols-[140px_repeat(6,1fr)] border-b bg-muted/50">
            <div className="p-4 border-r font-bold text-xs uppercase text-muted-foreground text-center">Time / Day</div>
            {DAYS.map(day => (
              <div key={day} className="p-4 font-bold text-xs uppercase text-center border-r last:border-r-0 tracking-widest text-primary">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="divide-y">
            {periodsData.length === 0 ? (
              <div className="p-20 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No Periods Configured</h3>
                <p className="text-muted-foreground mb-4">Please set up timetable periods first.</p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Configure Periods
                </Button>
              </div>
            ) : (
              periodsData.sort((a: Period, b: Period) => a.periodNumber - b.periodNumber).map((period: Period) => (
                <div key={period._id} className="grid grid-cols-[140px_repeat(6,1fr)] min-h-[100px] group">
                  {/* Period Time Column */}
                  <div className="p-3 border-r bg-muted/20 flex flex-col items-center justify-center gap-1">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {period.startTime} - {period.endTime}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Period {period.periodNumber}
                    </span>
                  </div>

                  {/* Day Slots */}
                  {DAYS.map(day => {
                    const slot = grid[day][period.periodNumber];
                    return (
                      <div
                        key={`${day}-${period._id}`}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(day, period)}
                        className={`p-2 border-r last:border-r-0 transition-colors relative flex flex-col justify-center items-center gap-1
                          ${!slot ? 'hover:bg-primary/5 bg-transparent border-dashed' : ''}`}
                      >
                        {slot ? (
                          <div className={`w-full h-full p-2 rounded-md border flex flex-col gap-1 relative group/slot animate-in fade-in zoom-in duration-300 ${getSubjectColor(slot.subjectId?.name || slot.subject?.name || '')}`}>
                            <button 
                              onClick={() => deleteSlotMutation.mutate(slot._id)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <div className="font-bold text-[11px] leading-tight truncate">
                              {slot.subjectId?.name || slot.subject?.name}
                            </div>
                            <div className="text-[10px] opacity-80 flex items-center gap-1 truncate">
                              <Users className="h-3 w-3 shrink-0" />
                              {slot.teacherId?.name || slot.teacher?.name}
                            </div>
                            <div className="text-[9px] opacity-70 flex items-center gap-1 mt-auto">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              {slot.room || 'TBD'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/30 font-medium uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            Empty
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend / Info */}
        <div className="mt-4 flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/20 border" />
            <span>Drop a card to assign</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/20 border" />
            <span>Clear slot</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.print()}>
              <Copy className="h-3 w-3" /> Print Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
