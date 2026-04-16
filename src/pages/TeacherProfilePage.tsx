import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherApi } from './services/api';
import { showApiError } from '@/lib/api-toast';
import TeacherProfile from '@/components/TeacherProfile';
import { Skeleton } from '@/components/ui/skeleton';

// TypeScript interfaces (same as in TeacherProfile component)
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

const TeacherProfilePage = () => {
  // Fetch teacher profile data
  const { data: profileData, isLoading, error, refetch } = useQuery<TeacherProfileData>({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      try {
        const response = await teacherApi.getProfile();
        return response.data;
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        throw err;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle error
  useEffect(() => {
    if (error) {
      showApiError(error, 'Failed to load teacher profile');
    }
  }, [error]);

  if (isLoading) {
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

  if (error && !profileData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Profile</h1>
          <p className="text-sm text-muted-foreground mt-2">Unable to load profile information</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Profile</h3>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load teacher profile data'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TeacherProfile 
      data={profileData || { success: false, data: { teacher: {} as Teacher, subjectAssignments: [] } }} 
      loading={isLoading}
    />
  );
};

export default TeacherProfilePage;
