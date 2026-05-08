import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicCalendarForm } from '@/components/academic/AcademicCalendarForm';
import { academicCalendarApi } from '@/services/api';
import { toast } from 'sonner';

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

const eventTypes = [
  { value: 'all', label: 'All Events' },
  { value: 'holiday', label: 'Holidays' },
  { value: 'exam', label: 'Exams' },
  { value: 'event', label: 'Events' },
  { value: 'meeting', label: 'Meetings' },
];

const getEventColor = (type: string, priority: string) => {
  const baseColors = {
    holiday: 'bg-red-100 text-red-800 border-red-200',
    exam: 'bg-orange-100 text-orange-800 border-orange-200',
    event: 'bg-blue-100 text-blue-800 border-blue-200',
    meeting: 'bg-green-100 text-green-800 border-green-200',
  };

  const priorityModifiers = {
    high: 'ring-2 ring-red-300',
    medium: 'ring-1 ring-yellow-300',
    low: '',
  };

  const baseColor = baseColors[type as keyof typeof baseColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const modifier = priorityModifiers[priority as keyof typeof priorityModifiers] || '';

  return `${baseColor} ${modifier}`;
};

const getEventIcon = (type: string) => {
  const icons = {
    holiday: '🏖️',
    exam: '📝',
    event: '🎉',
    meeting: '👥',
  };
  return icons[type as keyof typeof icons] || '📅';
};

export default function AcademicCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventType, setEventType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: calendarData, isLoading, refetch } = useQuery({
    queryKey: ['academic-calendar', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await academicCalendarApi.getMonthly(year, month);
      return response.data;
    },
  });

  const { data: upcomingEventsData } = useQuery({
    queryKey: ['academic-calendar', 'upcoming'],
    queryFn: async () => {
      const response = await academicCalendarApi.getUpcoming();
      return response.data;
    },
  });

  const events = calendarData?.data || [];
  const upcomingEvents = upcomingEventsData?.data || [];

  const filteredEvents = events.filter((event: CalendarEvent) => {
    if (eventType === 'all') return true;
    return event.type === eventType;
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter((event: CalendarEvent) => 
      isSameDay(new Date(event.date), date)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length > 0) {
      setSelectedEvent(dateEvents[0]);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Calendar</h1>
          <p className="text-muted-foreground">Manage academic events, holidays, and exams</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((event: CalendarEvent) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.type, event.priority)}`}
                  onClick={() => handleEditEvent(event)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.priority}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{event.title}</h4>
                  <p className="text-sm opacity-75 mb-2">
                    {format(new Date(event.date), 'MMM dd, yyyy')}
                  </p>
                  {event.venue && (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {event.venue}
                    </div>
                  )}
                  {event.startTime && event.endTime && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <Clock className="h-3 w-3" />
                      {event.startTime} - {event.endTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center font-medium text-sm p-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Week day headers */}
                  {weekDays.map((day) => (
                    <div key={day} className="text-center font-medium text-sm p-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {monthDays.map((date) => {
                    const dayEvents = getEventsForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                      <div
                        key={date.toISOString()}
                        className={`
                          min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
                          ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                          ${isSelected ? 'ring-2 ring-primary' : ''}
                          ${isToday ? 'border-primary' : 'border-border'}
                          hover:bg-muted/50
                        `}
                        onClick={() => handleDateClick(date)}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(date, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event: CalendarEvent) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${getEventColor(event.type, event.priority)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border ${getEventColor(selectedEvent.type, selectedEvent.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{getEventIcon(selectedEvent.type)}</span>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs">
                          {selectedEvent.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedEvent.priority}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{selectedEvent.title}</h3>
                    {selectedEvent.description && (
                      <p className="text-sm opacity-75 mb-2">{selectedEvent.description}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Date:</strong> {format(new Date(selectedEvent.date), 'MMMM dd, yyyy')}
                      </div>
                      {selectedEvent.startTime && selectedEvent.endTime && (
                        <div>
                          <strong>Time:</strong> {selectedEvent.startTime} - {selectedEvent.endTime}
                        </div>
                      )}
                      {selectedEvent.venue && (
                        <div>
                          <strong>Venue:</strong> {selectedEvent.venue}
                        </div>
                      )}
                      {selectedEvent.subtype && (
                        <div>
                          <strong>Type:</strong> {selectedEvent.subtype}
                        </div>
                      )}
                      {selectedEvent.isRecurring && (
                        <div>
                          <strong>Recurring:</strong> Yes
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleEditEvent(selectedEvent)}
                  >
                    Edit Event
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                  <p className="text-muted-foreground text-sm">
                    Click on a date to view event details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showForm && (
        <AcademicCalendarForm
          event={selectedEvent}
          onClose={() => {
            setShowForm(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
