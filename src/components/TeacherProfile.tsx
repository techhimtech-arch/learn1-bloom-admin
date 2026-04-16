import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  Users,
  GraduationCap,
  Award,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

interface SubjectAssignment {
  _id: string;
  teacherId: string;
  subjectId: {
    _id: string;
    name: string;
    code?: string;
  };
  classId: {
    _id: string;
    name: string;
  };
  sectionId?: {
    _id: string;
    name: string;
  };
  role?: string;
}

interface ClassTeacherAssignment {
  _id: string;
  teacherId: string;
  classId: {
    _id: string;
    name: string;
  };
  sectionId: {
    _id: string;
    name: string;
  };
  academicYearId?: {
    _id: string;
    name: string;
  };
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  qualification?: string;
  experience?: string;
  specialization?: string;
  employeeId?: string;
  joinDate?: string;
  status?: string;
  profileImage?: string;
}

interface TeacherProfileData {
  success: boolean;
  data: {
    teacher: Teacher;
    classTeacherAssignment?: ClassTeacherAssignment;
    subjectAssignments: SubjectAssignment[];
  };
}

interface TeacherProfileProps {
  data: TeacherProfileData;
  loading?: boolean;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.success || !data?.data?.teacher) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Teacher profile data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { teacher, classTeacherAssignment, subjectAssignments } = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Profile</h1>
        <p className="text-sm text-muted-foreground mt-2">View and manage teacher information</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Image and Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {teacher.profileImage ? (
                    <img 
                      src={teacher.profileImage} 
                      alt={teacher.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{teacher.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {teacher.role}
                  </Badge>
                  {teacher.status && (
                    <Badge 
                      variant={teacher.status === 'active' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {teacher.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {teacher.employeeId && (
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Employee ID:</span>
                    <span className="text-sm">{teacher.employeeId}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{teacher.email}</span>
                </div>

                {teacher.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm">{teacher.phone}</span>
                  </div>
                )}

                {teacher.gender && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="text-sm capitalize">{teacher.gender}</span>
                  </div>
                )}

                {teacher.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Date of Birth:</span>
                    <span className="text-sm">
                      {format(new Date(teacher.dateOfBirth), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                {teacher.joinDate && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Join Date:</span>
                    <span className="text-sm">
                      {format(new Date(teacher.joinDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              {teacher.qualification && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Qualification
                  </h4>
                  <p className="text-sm text-muted-foreground">{teacher.qualification}</p>
                </div>
              )}

              {teacher.experience && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">{teacher.experience}</p>
                </div>
              )}

              {teacher.specialization && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Specialization
                  </h4>
                  <p className="text-sm text-muted-foreground">{teacher.specialization}</p>
                </div>
              )}

              {teacher.address && (
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <p className="text-sm text-muted-foreground">{teacher.address}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Teacher Assignment */}
      {classTeacherAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Teacher Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Class:</span>
                <p className="font-semibold">{classTeacherAssignment.classId?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Section:</span>
                <p className="font-semibold">{classTeacherAssignment.sectionId?.name}</p>
              </div>
              {classTeacherAssignment.academicYearId && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Academic Year:</span>
                  <p className="font-semibold">{classTeacherAssignment.academicYearId?.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Assignments */}
      {subjectAssignments && subjectAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Assignments ({subjectAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectAssignments.map((assignment) => (
                <div key={assignment._id} className="border rounded-lg p-4">
                  <div className="grid gap-2 md:grid-cols-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                      <p className="font-semibold">
                        {assignment.subjectId?.name}
                        {assignment.subjectId?.code && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({assignment.subjectId.code})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Class:</span>
                      <p className="font-semibold">{assignment.classId?.name}</p>
                    </div>
                    {assignment.sectionId && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Section:</span>
                        <p className="font-semibold">{assignment.sectionId?.name}</p>
                      </div>
                    )}
                    {assignment.role && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Role:</span>
                        <p className="font-semibold capitalize">{assignment.role}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Assignments Message */}
      {!classTeacherAssignment && (!subjectAssignments || subjectAssignments.length === 0) && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No current assignments found for this teacher</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherProfile;
