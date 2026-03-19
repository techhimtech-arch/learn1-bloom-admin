import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Award, 
  BookOpen, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Eye,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parentApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface StudentData {
  student: Student;
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
    monthlyData?: Array<{
      month: string;
      present: number;
      absent: number;
      percentage: number;
    }>;
  };
  results: Array<{
    id: string;
    examName: string;
    examType: string;
    examDate: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    status: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    submissionDate?: string;
    status: string;
    marks?: number;
    maxMarks: number;
  }>;
  fees: Array<{
    id: string;
    feeHead: string;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate: string;
    status: string;
  }>;
}

export default function ParentStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();

  const {
    data: studentData,
    isLoading: studentLoading,
  } = useQuery({
    queryKey: ['parent-student', studentId],
    queryFn: async () => {
      if (!studentId) return { data: null };
      const response = await parentApi.getStudent(studentId);
      return response.data;
    },
    enabled: !!studentId,
  });

  const data = studentData?.data as StudentData;
  const student = data?.student;

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

  const getAssignmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-800',
      'graded': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'pending': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFeeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'unpaid': 'bg-gray-100 text-gray-800',
      'overdue': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!studentId || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
          <p className="text-muted-foreground">The requested student could not be found.</p>
        </div>
      </div>
    );
  }

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Details</h1>
          <p className="text-muted-foreground">
            {student.name} - {student.class?.name} {student.section?.name}
          </p>
        </div>
      </div>

      {/* Student Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">Roll No: {student.rollNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{student.email || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone: </span>
                <span className="font-medium">{student.phone || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gender: </span>
                <span className="font-medium">{student.gender || '-'}</span>
              </div>
              {student.dateOfBirth && (
                <div>
                  <span className="text-muted-foreground">Date of Birth: </span>
                  <span className="font-medium">
                    {format(new Date(student.dateOfBirth), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Class: </span>
                <span className="font-medium">{student.class?.name || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Section: </span>
                <span className="font-medium">{student.section?.name || '-'}</span>
              </div>
              {student.address && (
                <div>
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-medium">{student.address}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.attendance ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{data.attendance.totalDays}</div>
                    <div className="text-sm text-muted-foreground">Total Days</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.attendance.presentDays}</div>
                    <div className="text-sm text-muted-foreground">Present</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{data.attendance.absentDays}</div>
                    <div className="text-sm text-muted-foreground">Absent</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${getAttendanceColor(data.attendance.percentage)}`}>
                      {data.attendance.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Attendance %</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance data available</p>
                </div>
              )}

              {data.attendance?.monthlyData && data.attendance.monthlyData.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Monthly Attendance</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.attendance.monthlyData.map((month, index) => (
                          <TableRow key={index}>
                            <TableCell>{month.month}</TableCell>
                            <TableCell>{month.present}</TableCell>
                            <TableCell>{month.absent}</TableCell>
                            <TableCell>
                              <span className={`font-medium ${getAttendanceColor(month.percentage)}`}>
                                {month.percentage.toFixed(1)}%
                              </span>
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
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Academic Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.results && data.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{result.examName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.examType}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(result.examDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {result.obtainedMarks} / {result.totalMarks}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{result.percentage.toFixed(1)}%</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade)}>
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No results available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.assignments && data.assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.assignments.map((assignment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{assignment.title}</div>
                          </TableCell>
                          <TableCell>{assignment.subject}</TableCell>
                          <TableCell>
                            {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {assignment.submissionDate 
                              ? format(new Date(assignment.submissionDate), 'MMM dd, yyyy')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {assignment.marks !== undefined 
                              ? `${assignment.marks} / ${assignment.maxMarks}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge className={getAssignmentStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assignments available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.fees && data.fees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Head</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.fees.map((fee, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{fee.feeHead}</div>
                          </TableCell>
                          <TableCell>₹{fee.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-green-600">
                            ₹{fee.paidAmount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className={fee.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                            ₹{fee.dueAmount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(fee.dueDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getFeeStatusColor(fee.status)}>
                              {fee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No fee data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
