import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  BookOpen, 
  Users, 
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Award
} from 'lucide-react';
import { teacherApi } from '@/pages/services/api';
import { showApiError } from '@/lib/api-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
}

interface SubjectAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
}

interface ClassTeacherAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

interface TeacherProfileData {
  teacher: Teacher;
  subjectAssignments: SubjectAssignment[];
  classTeacherAssignment?: ClassTeacherAssignment;
}

const TeacherProfile = () => {
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const profile = profileData?.data as TeacherProfileData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    showApiError(error, 'Failed to load teacher profile');
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Profile</h1>
          <p className="text-sm text-muted-foreground">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Profile</h1>
          <p className="text-sm text-muted-foreground">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Profile</h1>
        <p className="text-sm text-muted-foreground">View your professional information and assignments</p>
      </div>

      {/* Teacher Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{profile.teacher.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile.teacher.phone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Qualification</p>
                  <p className="text-sm text-muted-foreground">{profile.teacher.qualification}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Experience</p>
                  <p className="text-sm text-muted-foreground">{profile.teacher.experience}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Subject Assignments
          </TabsTrigger>
          <TabsTrigger value="class" className="gap-2">
            <Users className="h-4 w-4" />
            Class Teacher Role
          </TabsTrigger>
        </TabsList>

        {/* Subject Assignments Tab */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject Assignments ({profile.subjectAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.subjectAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No subject assignments</h3>
                  <p className="text-muted-foreground">
                    You haven't been assigned to teach any subjects yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.subjectAssignments.map((assignment) => (
                      <TableRow key={assignment._id}>
                        <TableCell className="font-medium">
                          {assignment.classId.name}
                        </TableCell>
                        <TableCell>{assignment.sectionId.name}</TableCell>
                        <TableCell>{assignment.subjectId.name}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Teacher Role Tab */}
        <TabsContent value="class">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Class Teacher Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.classTeacherAssignment ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Class</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.classTeacherAssignment.classId.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Section</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.classTeacherAssignment.sectionId.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="gap-1">
                      <Users className="h-3 w-3" />
                      Class Teacher
                    </Badge>
                    <Badge variant="outline">Full Responsibility</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No class teacher assignment</h3>
                  <p className="text-muted-foreground">
                    You are not currently assigned as a class teacher.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">View Students</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-xs">Enter Results</span>
            </Button>
            <Button variant="outline" className="flex h-auto flex-col gap-2 py-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-xs">View Schedule</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfile;
