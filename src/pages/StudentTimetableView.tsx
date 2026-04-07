import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { studentPortalApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';

interface TimeSlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
  type?: 'lecture' | 'practical' | 'lab';
}

interface TimetableData {
  _id: string;
  classId: string;
  sectionId: string;
  academicYear: string;
  days: TimeSlot[];
}

const StudentTimetableView = () => {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<string>(
    format(new Date(), 'EEEE').toLowerCase()
  );

  const {
    data: timetable,
    isLoading,
    error,
  } = useQuery<TimetableData>({
    queryKey: ['student-timetable'],
    queryFn: async () => {
      try {
        // Fetch timetable for logged-in student using new API
        const response = await studentPortalApi.getTimetable();
        const timetableData = response.data?.data || {};
        // New API returns { dailyTimetable: [...], weeklySchedule: "..." }
        // Convert to TimetableData format
        const dailyTimetable = timetableData.dailyTimetable || [];
        return {
          _id: 'student-timetable',
          classId: '',
          sectionId: '',
          academicYear: new Date().getFullYear().toString(),
          days: dailyTimetable,
        };
      } catch (err) {
        console.error('Failed to fetch timetable:', err);
        return null;
      }
    },
  });

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2024-01-01 ${time}`), 'hh:mm a');
    } catch {
      return time;
    }
  };

  const getDaySlots = () => {
    if (!timetable?.days) return [];
    if (viewType === 'daily') {
      return timetable.days.filter(
        (slot) => slot.day.toLowerCase() === selectedDay.toLowerCase()
      );
    }
    return timetable.days;
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'practical':
        return 'bg-green-100 text-green-800';
      case 'lab':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const daySlots = getDaySlots();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = format(new Date(), 'EEEE').toLowerCase();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timetable</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your daily class schedule and timetable
          </p>
        </div>
      </div>

      {/* Class Info */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Student Name
                </p>
                <p className="text-lg font-bold mt-1">{user.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Email
                </p>
                <p className="text-lg font-bold mt-1">{user.email || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewType === 'weekly' ? 'default' : 'outline'}
          onClick={() => setViewType('weekly')}
        >
          Weekly View
        </Button>
        <Button
          variant={viewType === 'daily' ? 'default' : 'outline'}
          onClick={() => setViewType('daily')}
        >
          Daily View
        </Button>
        {viewType === 'daily' && (
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((day) => (
                <SelectItem key={day} value={day.toLowerCase()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Timetable Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert className="border-red-200 bg-red-50">
          <Alert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load timetable. Please try again later.
          </AlertDescription>
        </Alert>
      ) : !timetable ? (
        <Card className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Timetable Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your timetable hasn't been set up yet. Please contact your administrator.
          </p>
        </Card>
      ) : viewType === 'weekly' ? (
        // Weekly Grid View
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const daySchedule = timetable.days?.filter(
              (slot) =>
                slot.day.toLowerCase() === day.toLowerCase()
            ) || [];
            const isCurrentDay = day.toLowerCase() === currentDay;

            return (
              <Card
                key={day}
                className={isCurrentDay ? 'border-blue-500 border-2' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{day}</CardTitle>
                    {isCurrentDay && (
                      <Badge className="bg-blue-500">Today</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {daySchedule.length > 0 ? (
                    <div className="space-y-2">
                      {daySchedule.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <div className="flex-shrink-0">
                            <div className="text-sm font-semibold text-muted-foreground">
                              {formatTime(slot.startTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              to
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground">
                              {formatTime(slot.endTime)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{slot.subject}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {slot.type && (
                                <Badge className={getTypeColor(slot.type)}>
                                  {slot.type
                                    .charAt(0)
                                    .toUpperCase() +
                                    slot.type.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                              {slot.teacher && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {slot.teacher}
                                </div>
                              )}
                              {slot.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {slot.room}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      No classes scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Daily Table View
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDay.charAt(0).toUpperCase() +
                selectedDay.slice(1)}'s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {daySlots.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daySlots.map((slot, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="text-sm font-semibold">
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {slot.subject}
                        </TableCell>
                        <TableCell>
                          {slot.type ? (
                            <Badge className={getTypeColor(slot.type)}>
                              {slot.type
                                .charAt(0)
                                .toUpperCase() +
                                slot.type.slice(1)}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {slot.teacher ? (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {slot.teacher}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {slot.room ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {slot.room}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No classes scheduled for{' '}
                  {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentTimetableView;
