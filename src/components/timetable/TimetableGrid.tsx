import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeeklyTimetable, TimetableEntry } from '@/types/timetable';
import { Clock, User, MapPin, BookOpen } from 'lucide-react';
import { timetableUtils } from '@/services/timetableService';

interface TimetableGridProps {
  weeklyTimetable: WeeklyTimetable;
  isLoading?: boolean;
  className?: string;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({
  weeklyTimetable,
  isLoading = false,
  className = ''
}) => {
  const days = timetableUtils.getDaysOfWeek();
  const maxPeriods = Math.max(
    ...Object.values(weeklyTimetable).map(dayEntries => 
      Math.max(...dayEntries.map(entry => entry.periodNumber))
    ),
    8
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Weekly Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-900">
                    Period
                  </th>
                  {days.map(day => (
                    <th key={day} className="border border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-900">
                      {timetableUtils.formatDay(day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, periodIndex) => {
                  const periodNumber = periodIndex + 1;
                  return (
                    <tr key={periodNumber}>
                      <td className="border border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-900">
                        Period {periodNumber}
                      </td>
                      {days.map(day => {
                        const entry = weeklyTimetable[day]?.find(
                          e => e.periodNumber === periodNumber
                        );
                        
                        return (
                          <td key={`${day}-${periodNumber}`} className="border border-gray-300 p-1 align-top">
                            {entry ? (
                              <PeriodCard entry={entry} />
                            ) : (
                              <div className="h-20 bg-gray-50 rounded"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface PeriodCardProps {
  entry: TimetableEntry;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ entry }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 h-20 overflow-hidden hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            {timetableUtils.formatTime(entry.startTime)} - {timetableUtils.formatTime(entry.endTime)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <BookOpen className="h-3 w-3 text-blue-500" />
          <span className="text-xs font-medium text-blue-700 truncate">
            {entry.subject.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-700 truncate">
            {entry.teacher.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-purple-500" />
          <span className="text-xs text-purple-700">
            {entry.room}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
