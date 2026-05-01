import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Award, 
  BookOpen, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Bell,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  MessageSquare,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parentApi } from '@/pages/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

interface Student {
  _id?: string;
  id?: string;
  name: string;
  admissionNumber?: string;
  rollNumber?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  class?: {
    _id?: string;
    id?: string;
    name: string;
  };
  section?: {
    _id?: string;
    id?: string;
    name: string;
  };
}

// ─────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-800',
    'A': 'bg-green-100 text-green-800',
    'B+': 'bg-blue-100 text-blue-800',
    'B': 'bg-blue-100 text-blue-800',
    'C+': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-yellow-100 text-yellow-800',
    'D': 'bg-orange-100 text-orange-800',
    'F': 'bg-red-100 text-red-800',
  };
  return colors[grade] || 'bg-gray-100 text-gray-800';
};

const getAttendanceColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 75) return 'text-blue-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'present': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'late': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

const getFeeStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'paid': 'bg-green-100 text-green-800',
    'partial': 'bg-yellow-100 text-yellow-800',
    'pending': 'bg-gray-100 text-gray-800',
    'unpaid': 'bg-gray-100 text-gray-800',
    'overdue': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// ─────────────────────────────────────────────────────────
// TAB: ATTENDANCE
// ─────────────────────────────────────────────────────────

function AttendanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-attendance', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildAttendance(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load attendance data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const attendance = data as any;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{attendance.summary?.totalDays || 0}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{attendance.summary?.presentDays || 0}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{attendance.summary?.absentDays || 0}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`text-2xl font-bold ${getAttendanceColor(attendance.summary?.percentage || 0)}`}>
              {(attendance.summary?.percentage || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${
                (attendance.summary?.percentage || 0) >= 90 ? 'bg-green-600' :
                (attendance.summary?.percentage || 0) >= 75 ? 'bg-blue-600' :
                (attendance.summary?.percentage || 0) >= 60 ? 'bg-yellow-600' :
                'bg-red-600'
              }`}
              style={{ width: `${Math.min(attendance.summary?.percentage || 0, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {(attendance.summary?.percentage || 0).toFixed(1)}% ({attendance.summary?.presentDays || 0}/{attendance.summary?.totalDays || 0} days)
          </p>
        </CardContent>
      </Card>

      {/* Recent Records */}
      {attendance.records && attendance.records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Recent Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendance.records.slice(0, 10).map((record: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </div>
                    {record.remarks && <div className="text-xs text-muted-foreground">{record.remarks}</div>}
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: FEES
// ─────────────────────────────────────────────────────────

function FeesTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-fees', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildFees(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load fee data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fees = data as any;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Fee</div>
            <div className="text-2xl font-bold mt-2">₹{(fees.totalFee || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Paid Amount</div>
            <div className="text-2xl font-bold mt-2 text-green-600">₹{(fees.paidAmount || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className={(fees.dueAmount || 0) > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding Amount</div>
            <div className={`text-2xl font-bold mt-2 ${(fees.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{(fees.dueAmount || 0).toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-green-600"
              style={{ width: `${fees.totalFee ? (fees.paidAmount / fees.totalFee) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            ₹{(fees.paidAmount || 0).toLocaleString('en-IN')} / ₹{(fees.totalFee || 0).toLocaleString('en-IN')} ({fees.totalFee ? ((fees.paidAmount / fees.totalFee) * 100).toFixed(0) : '0'}% Paid)
          </p>
        </CardContent>
      </Card>

      {/* Fee Details Table */}
      {fees.feeHeads && fees.feeHeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.feeHeads.map((feeHead: any) => (
                    <TableRow key={feeHead.id}>
                      <TableCell className="font-medium">{feeHead.name}</TableCell>
                      <TableCell className="text-right">₹{(feeHead.amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{(feeHead.paidAmount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className={`text-right ${(feeHead.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{(feeHead.dueAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getFeeStatusColor(feeHead.status)}>
                          {feeHead.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: RESULTS
// ─────────────────────────────────────────────────────────

function ResultsTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-results', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildResults(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load results data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = Array.isArray(data) ? data : [data];

  return (
    <div className="space-y-6">
      {results.map((result: any, index: number) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{result.examName}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(result.examDate), 'MMM dd, yyyy')} • {result.examType}
                </p>
              </div>
              <Badge className={getGradeColor(result.grade)}>
                {result.grade}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{result.obtainedMarks || 0}</div>
                <div className="text-xs text-muted-foreground">Obtained Marks</div>
                <div className="text-sm text-muted-foreground mt-1">out of {result.totalMarks || 0}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${getAttendanceColor(result.percentage || 0)}`}>
                  {(result.percentage || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Percentage</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${result.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`} />
                <div className="text-xs text-muted-foreground">Status: {result.status}</div>
              </div>
            </div>

            {/* Subject Performance */}
            {result.subjects && result.subjects.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Subject-wise Performance</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Marks</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.subjects.map((subject: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell className="text-right">{subject.obtainedMarks || 0}/{subject.totalMarks || 0}</TableCell>
                          <TableCell className="text-right">{(subject.percentage || 0).toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(subject.grade)}>
                              {subject.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────

function AnnouncementsTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-announcements', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildAnnouncements(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load announcements</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const announcements = Array.isArray(data) ? data : data ? [data] : [];

  if (!announcements || announcements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement: any) => (
        <Card key={announcement.id || announcement._id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-base">{announcement.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(announcement.createdAt), 'MMM dd, yyyy - h:mm a')}
                </p>
              </div>
              <Badge className={getPriorityColor(announcement.priority)}>
                {announcement.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{announcement.message}</p>
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Attachments</h4>
                <div className="space-y-1">
                  {announcement.attachments.map((attachment: any, idx: number) => (
                    <a
                      key={idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {attachment.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: TIMETABLE
// ─────────────────────────────────────────────────────────

function TimetableTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-timetable', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildTimetable(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load timetable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timetables = Array.isArray(data) ? data : data ? [data] : [];

  if (!timetables || timetables.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No timetable available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {timetables.map((timetable: any, idx: number) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {timetable.day}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timetable.periods && timetable.periods.length > 0 ? (
              <div className="space-y-2">
                {timetable.periods.map((period: any, periodIdx: number) => (
                  <div key={periodIdx} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="w-20 text-center flex-shrink-0">
                      <div className="font-semibold text-sm">Period {period.periodNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {period.startTime} - {period.endTime}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{period.subject}</div>
                      {period.teacher && (
                        <div className="text-sm text-muted-foreground">Teacher: {period.teacher}</div>
                      )}
                      {period.room && (
                        <div className="text-sm text-muted-foreground">Room: {period.room}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No classes on this day</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: HOMEWORK / ASSIGNMENTS
// ─────────────────────────────────────────────────────────

function HomeworkTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-homework', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildHomework(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load homework data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const assignments = Array.isArray(data) ? data : data ? [data] : [];

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No homework assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'graded': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPendingCount = () => assignments.filter((a: any) => a.status === 'pending').length;
  const getSubmittedCount = () => assignments.filter((a: any) => a.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{getPendingCount()}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{getSubmittedCount()}</div>
            <div className="text-xs text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter((a: any) => a.status === 'graded' || a.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment: any) => (
          <Card key={assignment.id || assignment._id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base">{assignment.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{assignment.subject}</p>
                </div>
                <Badge className={getStatusColor(assignment.status)}>
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{assignment.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {assignment.dueDate && (
                  <div>
                    <span className="text-muted-foreground">Due Date: </span>
                    <span className="font-medium">{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {assignment.submittedDate && (
                  <div>
                    <span className="text-muted-foreground">Submitted: </span>
                    <span className="font-medium text-green-600">{format(new Date(assignment.submittedDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {assignment.grade && (
                  <div>
                    <span className="text-muted-foreground">Grade: </span>
                    <span className="font-medium">{assignment.grade}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: TEACHER REMARKS
// ─────────────────────────────────────────────────────────

function RemarksTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-remarks', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildRemarks(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load teacher remarks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remarks = Array.isArray(data) ? data : data ? [data] : [];

  if (!remarks || remarks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No teacher remarks yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRemarkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'positive': 'bg-green-100 text-green-800',
      'constructive': 'bg-blue-100 text-blue-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'concern': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {remarks.map((remark: any) => (
        <Card key={remark.id || remark._id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-base">{remark.teacher}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {remark.subject} • {format(new Date(remark.date || remark.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <Badge className={getRemarkTypeColor(remark.type || 'neutral')}>
                {(remark.type || 'neutral').charAt(0).toUpperCase() + (remark.type || 'neutral').slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{remark.remarks || remark.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: PERFORMANCE ANALYTICS
// ─────────────────────────────────────────────────────────

function PerformanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-performance', studentId],
    queryFn: async () => {
      const response = await parentApi.getChildPerformance(studentId);
      return response.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load performance data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performance = data as any;

  if (!performance) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAnalysisColor = (trend: string) => {
    const colors: Record<string, string> = {
      'improving': 'text-green-600',
      'stable': 'text-blue-600',
      'declining': 'text-red-600',
    };
    return colors[trend] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Overall Average</div>
            <div className="text-3xl font-bold mt-2">{(performance.overallAverage || 0).toFixed(1)}%</div>
            <div className={`text-sm mt-2 font-medium ${getAnalysisColor(performance.trend)}`}>
              ↑ {performance.trend === 'improving' ? 'Improving' : performance.trend === 'stable' ? 'Stable' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Best Subject</div>
            <div className="text-2xl font-bold mt-2 text-green-600">{performance.bestSubject || 'N/A'}</div>
            <div className="text-xs text-muted-foreground mt-2">Strong performance area</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Needs Improvement</div>
            <div className="text-2xl font-bold mt-2 text-orange-600">{performance.needsImprovement || 'N/A'}</div>
            <div className="text-xs text-muted-foreground mt-2">Focus area</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Exam Grade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            Last Exam Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Badge className="text-lg py-2 px-4">
              Grade: {performance.lastExamGrade || 'N/A'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-4">Showing consistent performance trend</p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      {performance.monthlyProgress && performance.monthlyProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.monthlyProgress.map((month: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{month.month}</span>
                    <span className="text-sm font-semibold">{month.average}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        month.average >= 85 ? 'bg-green-600' :
                        month.average >= 70 ? 'bg-blue-600' :
                        'bg-orange-600'
                      }`}
                      style={{ width: `${Math.min(month.average, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm">
              <strong>Overall Trend:</strong> {performance.trend === 'improving' 
                ? 'Excellent! Your child is showing consistent improvement.' 
                : performance.trend === 'stable'
                ? 'Good performance is being maintained consistently.'
                : 'Please focus on improving performance in weaker areas.'}
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm">
              <strong>Strength:</strong> Excellent performance in {performance.bestSubject}. Continue supporting this area.
            </p>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm">
              <strong>Focus Area:</strong> Additional support needed in {performance.needsImprovement}. Consider extra classes or tutoring.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

export default function ParentStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');

  const {
    data: studentData,
    isLoading: studentLoading,
    error: studentError,
  } = useQuery({
    queryKey: ['parent-student-detail', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      try {
        const response = await parentApi.getStudent(studentId);
        return response.data.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          throw new Error('You are not linked to this student');
        }
        throw err;
      }
    },
    enabled: !!studentId,
  });

  const student = studentData as Student;

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {studentError?.message === 'You are not linked to this student' 
              ? 'Access Denied' 
              : 'Student Not Found'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {studentError?.message || 'The requested student could not be found.'}
          </p>
          <Button onClick={() => navigate('/parent')} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">
            {student.class?.name} {student.section?.name} • Roll: {student.rollNumber || student.admissionNumber}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.class?.name} {student.section?.name}</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              {student.email && (
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium text-sm">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-medium text-sm">{student.phone}</span>
                </div>
              )}
            </div>
            <div className="text-sm space-y-2">
              {student.dateOfBirth && (
                <div>
                  <span className="text-muted-foreground">DOB: </span>
                  <span className="font-medium text-sm">{format(new Date(student.dateOfBirth), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {student.gender && (
                <div>
                  <span className="text-muted-foreground">Gender: </span>
                  <span className="font-medium text-sm">{student.gender}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm">Fees</TabsTrigger>
          <TabsTrigger value="results" className="text-xs sm:text-sm">Results</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
          <TabsTrigger value="timetable" className="text-xs sm:text-sm">Timetable</TabsTrigger>
          <TabsTrigger value="homework" className="text-xs sm:text-sm">Homework</TabsTrigger>
          <TabsTrigger value="remarks" className="text-xs sm:text-sm">Remarks</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendanceTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="fees">
          <FeesTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="announcements">
          <AnnouncementsTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="homework">
          <HomeworkTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="remarks">
          <RemarksTab studentId={studentId!} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab studentId={studentId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


