import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Eye,
  Download,
  UserCheck
} from 'lucide-react';
import { teacherApi } from '@/services/api';
import { showApiError } from '@/lib/api-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  subjectId?: { _id: string; name: string };
}

interface StudentDetail {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  enrollmentDate?: string;
}

const TeacherStudents = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetailDialogOpen, setStudentDetailDialogOpen] = useState(false);

  // Get teacher classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherApi.getClasses(),
    staleTime: 5 * 60 * 1000,
  });

  // Get students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students', selectedClass, selectedSection, currentPage, searchQuery],
    queryFn: () => {
      const params: any = { page: currentPage, limit: 50 };
      if (selectedClass) params.classId = selectedClass;
      if (selectedSection) params.sectionId = selectedSection;
      if (searchQuery) params.search = searchQuery;
      
      return teacherApi.getStudents(params);
    },
    staleTime: 3 * 60 * 1000,
  });

  // Get student details when selected
  const { data: studentDetailData, isLoading: studentDetailLoading } = useQuery({
    queryKey: ['student-detail', selectedStudent?._id],
    queryFn: () => {
      if (!selectedStudent) return { data: null };
      // This would be a hypothetical API to get detailed student info
      // For now, we'll use the basic student info
      return Promise.resolve({ data: selectedStudent });
    },
    enabled: !!selectedStudent,
    staleTime: 5 * 60 * 1000,
  });

  const classes = classesData?.data?.data as ClassAssignment[] || [];
  const students = studentsData?.data?.data as Student[] || [];
  const pagination = studentsData?.data?.pagination || {};
  const studentDetail = studentDetailData?.data as StudentDetail;

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique classes from assignments
  const uniqueClasses = Array.from(new Set(classes.map(c => c.classId?._id))).map(classId => {
    const classInfo = classes.find(c => c.classId?._id === classId);
    return classInfo?.classId;
  }).filter(Boolean);

  // Get sections for selected class
  const sectionsForClass = classes
    .filter(c => c.classId?._id === selectedClass)
    .map(c => c.sectionId)
    .filter((section, index, self) => self.findIndex(s => s._id === section._id) === index);

  // Handle student detail view
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailDialogOpen(true);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Export students data
  const handleExportStudents = () => {
    if (!filteredStudents.length) return;
    
    const csvContent = [
      ['Admission No', 'Name', 'Gender', 'Email', 'Phone', 'Class', 'Section'],
      ...filteredStudents.map(student => [
        student.admissionNumber,
        `${student.firstName} ${student.lastName}`,
        student.gender,
        student.email,
        student.phone,
        student.classId?.name || '',
        student.sectionId?.name || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${selectedClass || 'all'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-sm text-muted-foreground">View and manage your assigned students</p>
        </div>
        {filteredStudents.length > 0 && (
          <Button onClick={handleExportStudents} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={(value) => {
                setSelectedClass(value);
                setSelectedSection('');
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {uniqueClasses.map((classInfo) => (
                    <SelectItem key={classInfo?._id} value={classInfo?._id || ''}>
                      {classInfo?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select 
                value={selectedSection} 
                onValueChange={(value) => {
                  setSelectedSection(value);
                  setCurrentPage(1);
                }}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {sectionsForClass.map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, admission number, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredStudents.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredStudents.filter(s => s.gender === 'Male').length}
                </div>
                <div className="text-sm text-muted-foreground">Male Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredStudents.filter(s => s.gender === 'Female').length}
                </div>
                <div className="text-sm text-muted-foreground">Female Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {selectedClass ? classes.find(c => c.classId?._id === selectedClass)?.classId?.name || '-' : 'All'}
                </div>
                <div className="text-sm text-muted-foreground">Current Class</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students List ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'No students match your search criteria.' : 
                 selectedClass ? 'No students are assigned to this class and section.' :
                 'No students are assigned to your classes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={student.gender === 'Male' ? 'default' : 'secondary'}
                          className={student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                        >
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{calculateAge(student.dateOfBirth)} years</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{student.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.classId?.name}</TableCell>
                      <TableCell>{student.sectionId?.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * (pagination.limit || 50)) + 1} to{' '}
                    {Math.min(pagination.currentPage * (pagination.limit || 50), pagination.totalStudents || 0)} of{' '}
                    {pagination.totalStudents || 0} students
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={pagination.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages || 1, prev + 1))}
                      disabled={pagination.currentPage >= (pagination.totalPages || 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={studentDetailDialogOpen} onOpenChange={setStudentDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Student Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {studentDetailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : selectedStudent ? (
              <>
                {/* Basic Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Admission Number:</span>
                        <span className="text-sm font-medium">{selectedStudent.admissionNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Full Name:</span>
                        <span className="text-sm font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Gender:</span>
                        <Badge variant="outline">{selectedStudent.gender}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Date of Birth:</span>
                        <span className="text-sm font-medium">
                          {format(new Date(selectedStudent.dateOfBirth), 'MMM dd, yyyy')} 
                          ({calculateAge(selectedStudent.dateOfBirth)} years)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm font-medium">{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <span className="text-sm font-medium">{selectedStudent.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Class:</span>
                        <span className="text-sm font-medium">{selectedStudent.classId?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Section:</span>
                        <span className="text-sm font-medium">{selectedStudent.sectionId?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-xs">View Attendance</span>
                    </Button>
                    <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-xs">View Results</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Use filters to view students from specific classes and sections.</p>
            <p>2. Search for students by name, admission number, or email.</p>
            <p>3. Click the eye icon to view detailed student information.</p>
            <p>4. Export student data to CSV for record-keeping.</p>
            <p>5. Only students from your assigned classes will be displayed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudents;
