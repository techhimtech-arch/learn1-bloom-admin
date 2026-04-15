import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Save,
  Eye,
  Filter
} from 'lucide-react';
import { teacherApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeacherContext } from '@/contexts/TeacherContext';

interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

interface AttendanceRecord {
  _id: string;
  studentId: {
    _id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  remarks: string;
  markedBy?: string;
  updatedBy?: string;
}

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

const TeacherAttendance = () => {
  const queryClient = useQueryClient();
  const { 
    classesLoading, 
    classes, 
    getUniqueClasses, 
    getClassName, 
    getSectionName, 
    getSectionsForClass 
  } = useTeacherContext();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [viewHistoryDialogOpen, setViewHistoryDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Array<{
    studentId: string;
    status: 'Present' | 'Absent' | 'Late' | 'Leave';
    remarks: string;
  }>>([]);

  // Get students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || !selectedSection) return { data: { data: [] } };
      return await teacherApi.getStudents({ classId: selectedClass, sectionId: selectedSection });
    },
    enabled: !!selectedClass && !!selectedSection,
    staleTime: 3 * 60 * 1000,
  });

  // Get attendance history
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['teacher-attendance-history', selectedClass, selectedSection, selectedDate],
    queryFn: async () => {
      if (!selectedClass || !selectedSection || !selectedDate) return { data: { data: [] } };
      return await teacherApi.getAttendance({
        classId: selectedClass, 
        sectionId: selectedSection,
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: selectedDate
      });
    },
    enabled: !!selectedClass && !!selectedSection,
    staleTime: 2 * 60 * 1000,
  });

  const students = (studentsData as any)?.data?.data as Student[] || [];
  const attendanceHistoryData = (attendanceHistory as any)?.data?.data as AttendanceRecord[] || [];


  // Find class teacher assignment
  const classTeacherAssignment = classes.find(c => (c.classId?._id || c.classId) === selectedClass && 
                                                     (c.sectionId?._id || c.sectionId) === selectedSection);

  // Mutations
  const markAttendanceMutation = useMutation({
    mutationFn: (data: {
      classId: string;
      sectionId: string;
      date: string;
      attendanceRecords: Array<{
        studentId: string;
        status: 'Present' | 'Absent' | 'Late' | 'Leave';
        remarks: string;
      }>;
    }) => teacherApi.markAttendance(data),
    onSuccess: (response) => {
      showApiSuccess(response, `Attendance marked for ${response.data?.data?.length || 0} students`);
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
      setAttendanceDialogOpen(false);
      setAttendanceRecords([]);
    },
    onError: (error) => showApiError(error, 'Failed to mark attendance'),
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: (data: {
      attendanceId: string;
      status: 'Present' | 'Absent' | 'Late' | 'Leave';
      remarks: string;
    }) => teacherApi.updateAttendance(data),
    onSuccess: () => {
      showApiSuccess(null, 'Attendance updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
    },
    onError: (error) => showApiError(error, 'Failed to update attendance'),
  });

  // Initialize attendance records when dialog opens
  const initializeAttendanceRecords = () => {
    if (!students.length) return;
    
    const records = students.map(student => ({
      studentId: student._id,
      status: 'Present' as const,
      remarks: ''
    }));
    setAttendanceRecords(records);
  };

  // Update attendance record
  const updateAttendanceRecord = (studentId: string, field: 'status' | 'remarks', value: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Present':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'Absent':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'Late':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'Leave':
        return { icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Handle attendance submission
  const handleSubmitAttendance = () => {
    if (!selectedClass || !selectedSection || !selectedDate) {
      showApiError(new Error('Please select class, section, and date'), 'Missing information');
      return;
    }

    markAttendanceMutation.mutate({
      classId: selectedClass,
      sectionId: selectedSection,
      date: selectedDate,
      attendanceRecords: attendanceRecords
    });
  };

  if (classesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
        <p className="text-sm text-muted-foreground">Mark and manage student attendance</p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueClasses().map((cls) => (
                    <SelectItem key={cls._id} value={String(cls._id)}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {getSectionsForClass(selectedClass).map((section) => (
                    <SelectItem key={section._id} value={String(section._id)}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={initializeAttendanceRecords}
                      disabled={!selectedClass || !selectedSection || !classTeacherAssignment}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Mark Attendance - {selectedDate}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {classTeacherAssignment ? (
                          <span>Marking attendance for {classTeacherAssignment.classId?.name} - {classTeacherAssignment.sectionId?.name}</span>
                        ) : (
                          <span className="text-red-600">You can only mark attendance for classes where you are the class teacher</span>
                        )}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student, index) => {
                            const record = attendanceRecords.find(r => r.studentId === student._id);
                            return (
                              <TableRow key={student._id}>
                                <TableCell>{student.admissionNumber}</TableCell>
                                <TableCell>{student.firstName} {student.lastName}</TableCell>
                                <TableCell>
                                  <Select
                                    value={record?.status || 'Present'}
                                    onValueChange={(value) => updateAttendanceRecord(student._id, 'status', value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Present">Present</SelectItem>
                                      <SelectItem value="Absent">Absent</SelectItem>
                                      <SelectItem value="Late">Late</SelectItem>
                                      <SelectItem value="Leave">Leave</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Optional remarks"
                                    value={record?.remarks || ''}
                                    onChange={(e) => updateAttendanceRecord(student._id, 'remarks', e.target.value)}
                                    className="w-48"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitAttendance}
                          disabled={markAttendanceMutation.isPending || !classTeacherAssignment}
                        >
                          {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={viewHistoryDialogOpen} onOpenChange={setViewHistoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedClass || !selectedSection}>
                      <Eye className="mr-2 h-4 w-4" />
                      View History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Attendance History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {historyLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : attendanceHistoryData.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">No attendance records</h3>
                          <p className="text-muted-foreground">
                            No attendance records found for the selected criteria.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Remarks</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceHistoryData.map((record) => {
                              const statusInfo = getStatusInfo(record.status);
                              const StatusIcon = statusInfo.icon;
                              return (
                                <TableRow key={record._id}>
                                  <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {record.studentId.firstName} {record.studentId.lastName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {record.studentId.admissionNumber}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {record.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{record.remarks || '-'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Update attendance logic here
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {selectedClass && selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No students found</h3>
                <p className="text-muted-foreground">
                  No students are assigned to this class and section.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.gender}</Badge>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Select your assigned class and section from the filters above.</p>
            <p>2. Choose the date for which you want to mark attendance.</p>
            <p>3. Click "Mark Attendance" to open the attendance form.</p>
            <p>4. Select attendance status (Present, Absent, Late, Leave) for each student.</p>
            <p>5. Add optional remarks for each student if needed.</p>
            <p>6. Click "Save Attendance" to submit the records.</p>
            <p className="text-amber-600 font-medium">
              Note: You can only mark attendance for classes where you are assigned as the class teacher.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAttendance;
