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
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TimetableEntry, WeeklyTimetable, AcademicSession, Class, Section } from '@/types/timetable';
import { studentTimetableService, timetableDataService, timetableUtils } from '@/services/timetableService';
import TimetableGrid from './TimetableGrid';

interface StudentInfo {
  classId: string;
  sectionId: string;
  grade: number;
  className: string;
  sectionName: string;
}

const StudentTimetableView: React.FC = () => {
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'today'>('weekly');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

  // Mock student info - in real app, this would come from auth context or API
  const [studentInfo] = useState<StudentInfo>({
    classId: 'class123', // This would come from student profile
    sectionId: 'section123', // This would come from student profile
    grade: 10,
    className: '10-A',
    sectionName: 'A'
  });

  const { data: academicSessions } = useQuery({
    queryKey: ['academicSessions'],
    queryFn: () => timetableDataService.getAcademicSessions().then(res => res.data),
  });

  const { 
    data: timetableEntries, 
    isLoading: timetableLoading,
    error: timetableError 
  } = useQuery({
    queryKey: ['studentTimetable', studentInfo.classId, studentInfo.sectionId, selectedAcademicSession],
    queryFn: () => {
      if (!selectedAcademicSession) {
        return Promise.resolve({ data: [] });
      }
      return studentTimetableService.getClassTimetable(studentInfo.classId, studentInfo.sectionId, selectedAcademicSession)
        .then(res => res.data);
    },
    enabled: !!selectedAcademicSession && !!studentInfo.classId && !!studentInfo.sectionId,
  });

  const { 
    data: weeklyTimetable, 
    isLoading: weeklyLoading 
  } = useQuery({
    queryKey: ['weeklyStudentTimetable', studentInfo.classId, studentInfo.sectionId, selectedAcademicSession],
    queryFn: () => {
      if (!selectedAcademicSession) {
        return Promise.resolve({ data: {} });
      }
      return studentTimetableService.getWeeklyTimetable(studentInfo.classId, studentInfo.sectionId, selectedAcademicSession)
        .then(res => res.data);
    },
    enabled: !!selectedAcademicSession && !!studentInfo.classId && !!studentInfo.sectionId,
  });

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

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'upper-case' });
    return timetableEntries?.filter(entry => entry.day === today) || [];
  };

  const getNextClass = () => {
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

  const getCurrentClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return timetableEntries?.find(entry => {
      const entryDate = new Date();
      const dayIndex = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].indexOf(entry.day);
      const todayIndex = entryDate.getDay();
      
      if (dayIndex !== todayIndex) return false;
      
      return entry.startTime <= currentTime && entry.endTime > currentTime;
    });
  };

  const exportTimetable = () => {
    // Export functionality can be implemented here
    console.log('Exporting timetable...');
  };

  const addReminder = (entry: TimetableEntry) => {
    // Add reminder functionality can be implemented here
    console.log('Adding reminder for:', entry);
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
          <p className="text-gray-600">
            Class {studentInfo.className} - Grade {studentInfo.grade}
          </p>
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
            <CardTitle className="text-sm font-medium">Current Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {getCurrentClass() ? (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {getCurrentClass()!.subject.name}
                </div>
              ) : (
                <span className="text-gray-500">No class now</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {getNextClass() ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {timetableUtils.formatTime(getNextClass()!.startTime)}
                </div>
              ) : (
                <span className="text-gray-500">No more classes today</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Weekly Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timetableEntries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Class Alert */}
      {getCurrentClass() && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Current Class:</strong> {getCurrentClass()!.subject.name} with {getCurrentClass()!.teacher.name} 
            in Room {getCurrentClass()!.room} ({timetableUtils.formatTime(getCurrentClass()!.startTime)} - {timetableUtils.formatTime(getCurrentClass()!.endTime)})
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session & View Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: 'weekly' | 'daily' | 'today') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Grid</SelectItem>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="today">Today's Schedule</SelectItem>
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
        <Tabs value={viewMode} onValueChange={(value: 'weekly' | 'daily' | 'today') => setViewMode(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Grid
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Today
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
              weeklyTimetable={weeklyTimetable || {}} 
              isLoading={weeklyLoading}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetableUtils.getDaysOfWeek().map((day) => {
                const dayEntries = timetableEntries?.filter(entry => entry.day === day) || [];
                const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'upper-case' });
                
                return (
                  <Card key={day} className={isToday ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {timetableUtils.formatDay(day)}
                        {isToday && <Badge variant="secondary">Today</Badge>}
                      </CardTitle>
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
                              <div key={entry._id} className="p-3 border rounded-lg hover:bg-gray-50">
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
                                    <span className="text-sm text-gray-600">{entry.teacher.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm text-gray-600">Room: {entry.room}</span>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => addReminder(entry)}
                                    className="w-full"
                                  >
                                    <Bell className="mr-2 h-3 w-3" />
                                    Set Reminder
                                  </Button>
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

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('dddd, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getTodaySchedule().length > 0 ? (
                  <div className="space-y-3">
                    {getTodaySchedule()
                      .sort((a, b) => a.periodNumber - b.periodNumber)
                      .map((entry) => {
                        const isCurrentClass = getCurrentClass()?._id === entry._id;
                        const isNextClass = getNextClass()?._id === entry._id;
                        
                        return (
                          <div 
                            key={entry._id} 
                            className={`p-4 border rounded-lg ${
                              isCurrentClass ? 'bg-blue-50 border-blue-200' : 
                              isNextClass ? 'bg-green-50 border-green-200' : 
                              'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant={isCurrentClass ? 'default' : isNextClass ? 'secondary' : 'outline'}>
                                  Period {entry.periodNumber}
                                  {isCurrentClass && ' - Now'}
                                  {isNextClass && ' - Next'}
                                </Badge>
                                <span className="font-medium text-lg">
                                  {timetableUtils.formatTime(entry.startTime)} - {timetableUtils.formatTime(entry.endTime)}
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => addReminder(entry)}
                              >
                                <Bell className="mr-2 h-3 w-3" />
                                Reminder
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                <div>
                                  <div className="font-semibold">{entry.subject.name}</div>
                                  <div className="text-sm text-gray-600">{entry.subject.code}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-500" />
                                <div>
                                  <div className="font-semibold">{entry.teacher.name}</div>
                                  <div className="text-sm text-gray-600">{entry.teacher.email}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-purple-500" />
                                <div>
                                  <div className="font-semibold">Room {entry.room}</div>
                                  <div className="text-sm text-gray-600">
                                    {timetableUtils.formatSemester(entry.semester)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {isCurrentClass && (
                              <Alert className="mt-3 bg-blue-50 border-blue-200">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                  This class is currently in progress. Make sure you're on time!
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No classes scheduled for today</p>
                    <p className="text-sm text-gray-400 mt-2">Enjoy your day off!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default StudentTimetableView;
