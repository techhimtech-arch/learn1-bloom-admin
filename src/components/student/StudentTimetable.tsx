import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, FileText, Download } from 'lucide-react';

interface Period {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'break';
}

interface DaySchedule {
  day: string;
  date: string;
  periods: Period[];
}

interface TimetableData {
  week: number;
  startDate: string;
  endDate: string;
  days: DaySchedule[];
}

export const StudentTimetable = () => {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<'week' | 'daily'>('week');

  useEffect(() => {
    // Simulating API call
    const timer = setTimeout(() => {
      const mockTimetable: TimetableData = {
        week: 15,
        startDate: '2024-04-01',
        endDate: '2024-04-07',
        days: [
          {
            day: 'Monday',
            date: '2024-04-01',
            periods: [
              { periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Data Structures', subjectCode: 'CS101', teacher: 'Dr. Rajesh Kumar', room: 'Lab 201', type: 'lecture' },
              { periodNumber: 2, startTime: '10:00', endTime: '11:00', subject: 'Data Structures', subjectCode: 'CS101', teacher: 'Dr. Rajesh Kumar', room: 'Lab 201', type: 'lecture' },
              { periodNumber: 3, startTime: '11:00', endTime: '11:30', subject: 'Break', subjectCode: 'BRK', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 4, startTime: '11:30', endTime: '12:30', subject: 'English Literature', subjectCode: 'EN102', teacher: 'Ms. Priya Sharma', room: 'Class 305', type: 'lecture' },
              { periodNumber: 5, startTime: '12:30', endTime: '01:30', subject: 'Calculus', subjectCode: 'MATH103', teacher: 'Prof. Amit Patel', room: 'Classroom 402', type: 'lecture' },
              { periodNumber: 6, startTime: '01:30', endTime: '02:30', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 7, startTime: '02:30', endTime: '03:30', subject: 'Chemistry', subjectCode: 'CHM105', teacher: 'Ms. Neha Gupta', room: 'Chemistry Lab', type: 'lab' },
              { periodNumber: 8, startTime: '03:30', endTime: '04:30', subject: 'Chemistry', subjectCode: 'CHM105', teacher: 'Ms. Neha Gupta', room: 'Chemistry Lab', type: 'lab' },
            ]
          },
          {
            day: 'Tuesday',
            date: '2024-04-02',
            periods: [
              { periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Physics Lab', subjectCode: 'PHY104', teacher: 'Dr. Vikram Singh', room: 'Physics Lab 101', type: 'lab' },
              { periodNumber: 2, startTime: '10:00', endTime: '11:00', subject: 'Physics Lab', subjectCode: 'PHY104', teacher: 'Dr. Vikram Singh', room: 'Physics Lab 101', type: 'lab' },
              { periodNumber: 3, startTime: '11:00', endTime: '11:30', subject: 'Break', subjectCode: 'BRK', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 4, startTime: '11:30', endTime: '12:30', subject: 'Calculus Tutorial', subjectCode: 'MATH103T', teacher: 'Prof. Amit Patel', room: 'Classroom 402', type: 'tutorial' },
              { periodNumber: 5, startTime: '12:30', endTime: '01:30', subject: 'English Literature', subjectCode: 'EN102', teacher: 'Ms. Priya Sharma', room: 'Class 305', type: 'lecture' },
              { periodNumber: 6, startTime: '01:30', endTime: '02:30', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 7, startTime: '02:30', endTime: '03:30', subject: 'Data Structures Lab', subjectCode: 'CS101L', teacher: 'Dr. Rajesh Kumar', room: 'Computer Lab 101', type: 'lab' },
              { periodNumber: 8, startTime: '03:30', endTime: '04:30', subject: 'Data Structures Lab', subjectCode: 'CS101L', teacher: 'Dr. Rajesh Kumar', room: 'Computer Lab 101', type: 'lab' },
            ]
          },
          {
            day: 'Wednesday',
            date: '2024-04-03',
            periods: [
              { periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Data Structures', subjectCode: 'CS101', teacher: 'Dr. Rajesh Kumar', room: 'Lab 201', type: 'lecture' },
              { periodNumber: 2, startTime: '10:00', endTime: '11:00', subject: 'Chemistry', subjectCode: 'CHM105', teacher: 'Ms. Neha Gupta', room: 'Chemistry Lab', type: 'lab' },
              { periodNumber: 3, startTime: '11:00', endTime: '11:30', subject: 'Break', subjectCode: 'BRK', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 4, startTime: '11:30', endTime: '12:30', subject: 'Calculus', subjectCode: 'MATH103', teacher: 'Prof. Amit Patel', room: 'Classroom 402', type: 'lecture' },
              { periodNumber: 5, startTime: '12:30', endTime: '01:30', subject: 'English Literature', subjectCode: 'EN102', teacher: 'Ms. Priya Sharma', room: 'Class 305', type: 'lecture' },
              { periodNumber: 6, startTime: '01:30', endTime: '02:30', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 7, startTime: '02:30', endTime: '03:30', subject: 'Free Period', subjectCode: 'FREE', teacher: '-', room: 'Library', type: 'lecture' },
              { periodNumber: 8, startTime: '03:30', endTime: '04:30', subject: 'Free Period', subjectCode: 'FREE', teacher: '-', room: 'Library', type: 'lecture' },
            ]
          },
          {
            day: 'Thursday',
            date: '2024-04-04',
            periods: [
              { periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Physics Lab', subjectCode: 'PHY104', teacher: 'Dr. Vikram Singh', room: 'Physics Lab 101', type: 'lab' },
              { periodNumber: 2, startTime: '10:00', endTime: '11:00', subject: 'English Literature', subjectCode: 'EN102', teacher: 'Ms. Priya Sharma', room: 'Class 305', type: 'lecture' },
              { periodNumber: 3, startTime: '11:00', endTime: '11:30', subject: 'Break', subjectCode: 'BRK', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 4, startTime: '11:30', endTime: '12:30', subject: 'Calculus', subjectCode: 'MATH103', teacher: 'Prof. Amit Patel', room: 'Classroom 402', type: 'lecture' },
              { periodNumber: 5, startTime: '12:30', endTime: '01:30', subject: 'Chemistry Tutorial', subjectCode: 'CHM105T', teacher: 'Ms. Neha Gupta', room: 'Classroom 101', type: 'tutorial' },
              { periodNumber: 6, startTime: '01:30', endTime: '02:30', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 7, startTime: '02:30', endTime: '03:30', subject: 'Programming Workshop', subjectCode: 'CS101W', teacher: 'Dr. Rajesh Kumar', room: 'Computer Lab 101', type: 'lab' },
              { periodNumber: 8, startTime: '03:30', endTime: '04:30', subject: 'Programming Workshop', subjectCode: 'CS101W', teacher: 'Dr. Rajesh Kumar', room: 'Computer Lab 101', type: 'lab' },
            ]
          },
          {
            day: 'Friday',
            date: '2024-04-05',
            periods: [
              { periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Data Structures', subjectCode: 'CS101', teacher: 'Dr. Rajesh Kumar', room: 'Lab 201', type: 'lecture' },
              { periodNumber: 2, startTime: '10:00', endTime: '11:00', subject: 'Chemistry', subjectCode: 'CHM105', teacher: 'Ms. Neha Gupta', room: 'Chemistry Lab', type: 'lecture' },
              { periodNumber: 3, startTime: '11:00', endTime: '11:30', subject: 'Break', subjectCode: 'BRK', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 4, startTime: '11:30', endTime: '12:30', subject: 'Calculus', subjectCode: 'MATH103', teacher: 'Prof. Amit Patel', room: 'Classroom 402', type: 'lecture' },
              { periodNumber: 5, startTime: '12:30', endTime: '01:30', subject: 'General Assembly', subjectCode: 'GA', teacher: 'Admin', room: 'Auditorium', type: 'lecture' },
              { periodNumber: 6, startTime: '01:30', endTime: '02:30', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
              { periodNumber: 7, startTime: '02:30', endTime: '03:30', subject: 'Sports Period', subjectCode: 'SPORT', teacher: '-', room: 'Sports Ground', type: 'lecture' },
              { periodNumber: 8, startTime: '03:30', endTime: '04:30', subject: 'Sports Period', subjectCode: 'SPORT', teacher: '-', room: 'Sports Ground', type: 'lecture' },
            ]
          },
          {
            day: 'Saturday',
            date: '2024-04-06',
            periods: [
              { periodNumber: 1, startTime: '10:00', endTime: '11:00', subject: 'English Literature', subjectCode: 'EN102', teacher: 'Ms. Priya Sharma', room: 'Class 305', type: 'lecture' },
              { periodNumber: 2, startTime: '11:00', endTime: '12:00', subject: 'Evaluation Test', subjectCode: 'TEST', teacher: 'Multiple', room: 'All Classrooms', type: 'lecture' },
              { periodNumber: 3, startTime: '12:00', endTime: '01:00', subject: 'Lunch Break', subjectCode: 'LUNCH', teacher: '-', room: 'Cafeteria', type: 'break' },
            ]
          },
          {
            day: 'Sunday',
            date: '2024-04-07',
            periods: [
              { periodNumber: 1, startTime: '00:00', endTime: '23:59', subject: 'Holiday', subjectCode: 'HOL', teacher: '-', room: '-', type: 'break' },
            ]
          }
        ]
      };

      setTimetable(mockTimetable);
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const getPeriodColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'lab':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'tutorial':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'break':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPeriodBadgeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-green-100 text-green-800';
      case 'tutorial':
        return 'bg-purple-100 text-purple-800';
      case 'break':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !timetable) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentDaySchedule = timetable.days[selectedDay];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Class Timetable</h2>
          <p className="text-sm text-muted-foreground">
            Week {timetable.week} • {timetable.startDate} to {timetable.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'daily')} className="space-y-4">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
        </TabsList>

        {/* Week View */}
        <TabsContent value="week" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-max p-2">
              {timetable.days.map((day, dayIdx) => (
                <div key={dayIdx} className="min-w-[140px]">
                  <button
                    onClick={() => {
                      setSelectedDay(dayIdx);
                      setViewMode('daily');
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left cursor-pointer ${
                      selectedDay === dayIdx
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">{day.day}</p>
                    <p className="text-xs text-muted-foreground">{day.date}</p>
                    <p className="text-xs mt-2">
                      {day.periods.filter(p => p.type !== 'break').length} Classes
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Week Grid */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => i + 1).map(periodNum => (
                  <div key={periodNum} className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-7 gap-1">
                      {timetable.days.map((day, dayIdx) => {
                        const period = day.periods.find(p => p.periodNumber === periodNum);
                        return (
                          <div key={dayIdx} className={`p-2 min-h-[80px] border-r last:border-r-0 ${period ? getPeriodColor(period.type) : 'bg-gray-50'}`}>
                            {period && period.type !== 'break' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="text-left w-full h-full hover:opacity-80 transition-opacity">
                                    <p className="text-xs font-semibold text-gray-900 line-clamp-2">{period.subject}</p>
                                    <p className="text-xs text-gray-600 mt-1">{period.startTime} - {period.endTime}</p>
                                    <p className="text-xs text-gray-500 mt-1">{period.room}</p>
                                  </button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <BookOpen className="h-5 w-5" />
                                      {period.subject}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <div><Badge className={getPeriodBadgeColor(period.type)}>{period.type.toUpperCase()}</Badge></div>
                                    <div className="grid gap-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">Subject Code:</span> <span className="font-semibold">{period.subjectCode}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">Teacher:</span> <span className="font-semibold">{period.teacher}</span></div>
                                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {period.startTime} - {period.endTime}</div>
                                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {period.room}</div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : period?.type === 'break' ? (
                              <div className="text-xs text-gray-600 font-semibold">{period.subject}</div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-4">
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timetable.days.map((day, idx) => (
              <Button
                key={idx}
                variant={selectedDay === idx ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(idx)}
                className="flex-shrink-0"
              >
                {day.day}
              </Button>
            ))}
          </div>

          {/* Daily Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentDaySchedule.day} • {currentDaySchedule.date}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentDaySchedule.periods.map((period, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <button className={`w-full p-4 rounded-lg border-2 text-left transition-all ${getPeriodColor(period.type)} ${period.type !== 'break' ? 'cursor-pointer' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{period.subject}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {period.startTime} - {period.endTime}
                            </span>
                            {period.type !== 'break' && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {period.room}
                              </span>
                            )}
                          </div>
                          {period.type !== 'break' && (
                            <div className="flex gap-2 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {period.teacher}
                              </span>
                            </div>
                          )}
                        </div>
                        {period.type !== 'break' && (
                          <Badge className={getPeriodBadgeColor(period.type)}>
                            {period.type}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </DialogTrigger>
                  {period.type !== 'break' && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {period.subject}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subject Code</span>
                            <span className="font-semibold">{period.subjectCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <Badge className={getPeriodBadgeColor(period.type)}>
                              {period.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{period.startTime} - {period.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{period.room}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{period.teacher}</span>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <Button className="w-full" variant="outline">Message Teacher</Button>
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Period Type Legend */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Period Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 border border-blue-300" />
              <span className="text-sm">Lecture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 border border-green-300" />
              <span className="text-sm">Lab/Practical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-200 border border-purple-300" />
              <span className="text-sm">Tutorial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300" />
              <span className="text-sm">Break/Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;
