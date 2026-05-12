import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  BookOpen,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TimetableEntry, WeeklyTimetable, AcademicSession } from '@/types/timetable';
import { teacherTimetableService, timetableDataService, timetableUtils } from '@/services/timetableService';
import TimetableGrid from './TimetableGrid';

const TeacherTimetableView: React.FC = () => {
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'list'>('weekly');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

  const { data: academicSessions } = useQuery({
    queryKey: ['academicSessions'],
    queryFn: () => timetableDataService.getAcademicSessions().then(res => res.data),
  });

  const { 
    data: timetableEntries, 
    isLoading: timetableLoading,
    error: timetableError 
  } = useQuery({
    queryKey: ['teacherTimetable', selectedAcademicSession, selectedDay],
    queryFn: () => {
      if (!selectedAcademicSession) {
        return Promise.resolve([]);
      }
      const dayParam = selectedDay === 'all' ? '' : selectedDay;
      return teacherTimetableService.getOwnTimetable(selectedAcademicSession, dayParam)
        .then(res => res.data);
    },
    enabled: !!selectedAcademicSession,
  });

  const weeklyTimetable: WeeklyTimetable = React.useMemo(() => {
    if (!timetableEntries) return {};
    return timetableUtils.convertToWeeklyGrid(timetableEntries);
  }, [timetableEntries]);

  const activeSession = academicSessions?.find(session => session.isActive);

  useEffect(() => {
    if (activeSession && !selectedAcademicSession) {
      setSelectedAcademicSession(activeSession._id);
    }
  }, [activeSession, selectedAcademicSession]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeekStart(newDate);
  };

  const getCurrentWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const exportTimetable = () => {
    // Export functionality can be implemented here
    console.log('Exporting timetable...');
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'upper-case' });
    return timetableEntries?.filter(entry => entry.day === today) || [];
  };

  const getUpcomingClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return timetableEntries?.find(entry => {
      const entryDate = new Date();
      const dayIndex = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].indexOf(entry.day);
      const todayIndex = entryDate.getDay();
      
      if (dayIndex !== todayIndex) return false;
      
      return entry.startTime > currentTime;
    });
  };

  if (timetableError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load timetable. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-gray-600">View and manage your teaching schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTimetable}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTodaySchedule().length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {getUpcomingClass() ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {timetableUtils.formatTime(getUpcomingClass()!.startTime)}
                </div>
              ) : (
                <span className="text-gray-500">No more classes today</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Weekly Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timetableEntries?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Different Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(timetableEntries?.map(e => `${e.classId}-${e.sectionId}`)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Academic Session</label>
              <Select value={selectedAcademicSession} onValueChange={setSelectedAcademicSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {academicSessions?.map((session) => (
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Day Filter</label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {timetableUtils.getDaysOfWeek().map((day) => (
                    <SelectItem key={day} value={day}>
                      {timetableUtils.formatDay(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: 'weekly' | 'daily' | 'list') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Grid</SelectItem>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!selectedAcademicSession ? (
        <Alert>
          <AlertDescription>
            Please select an academic session to view your timetable.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={viewMode} onValueChange={(value: 'weekly' | 'daily' | 'list') => setViewMode(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Grid
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Weekly Schedule</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {getCurrentWeekDates()[0].toLocaleDateString()} - {getCurrentWeekDates()[5].toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <TimetableGrid 
              weeklyTimetable={weeklyTimetable} 
              isLoading={timetableLoading}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetableUtils.getDaysOfWeek().map((day) => {
                const dayEntries = timetableEntries?.filter(entry => entry.day === day) || [];
                
                return (
                  <Card key={day}>
                    <CardHeader>
                      <CardTitle className="text-lg">{timetableUtils.formatDay(day)}</CardTitle>
                      <CardDescription>
                        {dayEntries.length} classes scheduled
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dayEntries.length > 0 ? (
                        <div className="space-y-2">
                          {dayEntries
                            .sort((a, b) => a.periodNumber - b.periodNumber)
                            .map((entry) => (
                              <div key={entry._id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">Period {entry.periodNumber}</Badge>
                                  <span className="text-sm text-gray-600">
                                    {timetableUtils.formatTime(entry.startTime)} - {timetableUtils.formatTime(entry.endTime)}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">{entry.subject.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-gray-600">
                                      {entry.classId} - {entry.sectionId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm text-gray-600">Room: {entry.room}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No classes scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Scheduled Classes</CardTitle>
                <CardDescription>
                  Complete list of your teaching schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetableLoading ? (
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : timetableEntries && timetableEntries.length > 0 ? (
                  <div className="space-y-2">
                    {timetableEntries
                      .sort((a, b) => {
                        const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                        return dayDiff !== 0 ? dayDiff : a.periodNumber - b.periodNumber;
                      })
                      .map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{timetableUtils.formatDay(entry.day)}</Badge>
                            <Badge>Period {entry.periodNumber}</Badge>
                            <span className="font-medium">{timetableUtils.formatTime(entry.startTime)} - {timetableUtils.formatTime(entry.endTime)}</span>
                            <span className="font-semibold">{entry.subject.name}</span>
                            <span className="text-gray-600">{entry.classId} - {entry.sectionId}</span>
                            <span className="text-gray-600 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {entry.room}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No timetable entries found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TeacherTimetableView;
