import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  GraduationCap, 
  Mail, 
  Phone,
  Calendar,
  Eye
} from 'lucide-react';
import { teacherApi } from '@/pages/services/api';
import { showApiError } from '@/lib/api-toast';
import { useTeacherContext } from '@/contexts/TeacherContext';

interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

const TeacherStudents = () => {
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
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const students = (studentsData as any)?.data?.data || [];

  // Debug: log classes and context data
  console.log('=== TEACHER STUDENTS DEBUG ===');
  console.log('Classes from context:', classes);
  console.log('Classes length:', classes?.length);
  console.log('Unique classes from getUniqueClasses():', getUniqueClasses());
  console.log('Unique classes length:', getUniqueClasses()?.length);
  console.log('Selected class:', selectedClass);
  console.log('Selected section:', selectedSection);
  console.log('Sections for selected class:', getSectionsForClass(selectedClass));
  console.log('=============================');

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique classes and sections using optimized functions
  const uniqueClasses = getUniqueClasses();
  const sectionsForClass = getSectionsForClass(selectedClass);

  if (classesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Students</h1>
        <p className="text-sm text-muted-foreground">View and manage students from your assigned classes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {console.log('Rendering unique classes in dropdown:', uniqueClasses)}
                  {uniqueClasses.length === 0 ? (
                    <SelectItem value="no-classes" disabled>
                      No classes available
                    </SelectItem>
                  ) : (
                    uniqueClasses.map((cls) => {
                      console.log('Rendering class item:', cls);
                      return (
                        <SelectItem key={cls._id} value={String(cls._id)}>
                          {cls.name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {console.log('Rendering sections for class:', selectedClass, sectionsForClass)}
                  {sectionsForClass.length === 0 ? (
                    <SelectItem value="no-sections" disabled>
                      {selectedClass ? 'No sections available' : 'Select a class first'}
                    </SelectItem>
                  ) : (
                    sectionsForClass.map((section) => {
                      console.log('Rendering section item:', section);
                      return (
                        <SelectItem key={section._id} value={String(section._id)}>
                          {section.name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students List
            </div>
            <Badge variant="secondary">
              {filteredStudents.length} students
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !selectedClass || !selectedSection ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Select Class and Section</h3>
              <p className="text-muted-foreground">
                Please select a class and section to view students.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No students match your search criteria.' : 'No students are assigned to this class and section.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Admission No: {student.admissionNumber}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{student.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{student.classId.name} - {student.sectionId.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{student.gender}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline">
                        {student.classId.name}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudents;
