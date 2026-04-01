import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  subject?: string;
}

interface ProgressData {
  month: string;
  attendance: number;
  performance: number;
}

export const StudentAttendanceProgress = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'chart'>('calendar');

  useEffect(() => {
    // Simulate API call
    const mockAttendance: AttendanceRecord[] = [];
    const today = new Date();
    
    for (let i = 30; i > 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockAttendance.push({
        date: date.toISOString().split('T')[0],
        status: Math.random() > 0.1 ? 'present' : 'absent',
      });
    }

    setAttendanceRecords(mockAttendance);

    setProgressData([
      { month: 'Jan', attendance: 92, performance: 85 },
      { month: 'Feb', attendance: 88, performance: 82 },
      { month: 'Mar', attendance: 90, performance: 88 },
      { month: 'Apr', attendance: 85, performance: 80 },
    ]);

    setLoading(false);
  }, []);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const attendancePercentage = Math.round((presentCount / (presentCount + absentCount)) * 100);

  const currentMonth = Array.from({ length: new Date().getDate() }, (_, i) => {
    const date = new Date();
    date.setDate(i + 1);
    const record = attendanceRecords.find(
      r => r.date === date.toISOString().split('T')[0]
    );
    return { date: date.getDate(), status: record?.status || 'not-marked' };
  });

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className={`text-3xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {attendancePercentage}%
              </p>
              <p className="text-sm text-muted-foreground">Overall %</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-blue-600">{presentCount + absentCount}</p>
              <p className="text-sm text-muted-foreground">Total Days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Alert */}
      {attendancePercentage < 75 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            Your attendance is below 75%. Please improve it to avoid eligibility issues.
          </AlertDescription>
        </Alert>
      )}

      {attendancePercentage >= 90 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            Great! Your attendance is excellent. Keep it up!
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="monthly">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="chart">Progress Chart</TabsTrigger>
        </TabsList>

        {/* Monthly Calendar View */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                April 2026 Attendance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-muted-foreground mb-2">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Calendar dates */}
                <div className="grid grid-cols-7 gap-2">
                  {currentMonth.map(day => (
                    <div
                      key={day.date}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                        day.status === 'present'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : day.status === 'absent'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day.date}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-sm border-t pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                    <span>Not Marked</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance by Subject */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Mathematics', 'English', 'Science', 'Social Studies'].map(subject => (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{subject}</span>
                    <span className="font-semibold">90%</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Chart View */}
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance & Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Attendance %"
                  />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Performance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Attendance Score</span>
                    <span className="font-semibold">85/100</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Keep maintaining consistency</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Academic Performance</span>
                    <span className="font-semibold">82/100</span>
                  </div>
                  <Progress value={82} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Great job! Keep it up</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Score</span>
                    <span className="font-semibold">83/100</span>
                  </div>
                  <Progress value={83} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Target: 90/100</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Try to maintain 100% attendance</li>
                  <li>• Focus on improving Science performance</li>
                  <li>• Recent progress in Math is commendable</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
