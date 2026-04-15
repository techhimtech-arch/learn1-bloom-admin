import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '@/services/api';

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string } | string;
  sectionId: { _id: string; name: string } | string;
  subjectId?: { _id: string; name: string } | string;
}

interface TeacherContextType {
  classesData: any;
  classesLoading: boolean;
  classes: (ClassAssignment | string)[];
  getUniqueClasses: () => Array<{ _id: string; name: string }>;
  getClassName: (classId: string) => string;
  getSectionName: (classId: string, sectionId: string) => string;
  getSectionsForClass: (classId: string) => Array<{ _id: string; name: string }>;
  refetchClasses: () => void;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

interface TeacherProviderProps {
  children: ReactNode;
}

export const TeacherProvider = ({ children }: TeacherProviderProps) => {
  // Get teacher classes
  const { data: classesData, isLoading: classesLoading, refetch: refetchClasses } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherApi.getClasses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const classes = Array.isArray((classesData as any)?.data?.data?.subjectAssignments) 
    ? (classesData as any).data.data.subjectAssignments as ClassAssignment[] : 
    (classesData as any)?.data?.data?.classTeacherAssignment
    ? [(classesData as any).data.data.classTeacherAssignment] as ClassAssignment[]
    : [];
    
  console.log('=== CLASSES EXTRACTION DEBUG ===');
  console.log('Is subjectAssignments array?', Array.isArray((classesData as any)?.data?.data?.subjectAssignments));
  console.log('subjectAssignments value:', (classesData as any)?.data?.data?.subjectAssignments);
  console.log('classTeacherAssignment value:', (classesData as any)?.data?.data?.classTeacherAssignment);
  console.log('Final classes array:', classes);
  console.log('===============================');

  // Store teacher profile data in localStorage for use across components
  useEffect(() => {
    if (classesData?.data?.data) {
      console.log('=== TEACHER CONTEXT DEBUG ===');
      console.log('Full classesData:', classesData);
      console.log('classesData.data:', classesData.data);
      console.log('classesData.data.data:', classesData.data.data);
      console.log('classTeacherAssignment:', classesData.data.data.classTeacherAssignment);
      console.log('subjectAssignments:', classesData.data.data.subjectAssignments);
      console.log('=============================');
      
      const teacherData = {
        classTeacherAssignment: classesData.data.data.classTeacherAssignment,
        subjectAssignments: classesData.data.data.subjectAssignments,
        academicYear: classesData.data.data.academicYear,
        schoolId: classesData.data.data.schoolId,
        teacherId: classesData.data.data.teacherId
      };
      localStorage.setItem('teacherProfile', JSON.stringify(teacherData));
      sessionStorage.setItem('teacherClasses', JSON.stringify(classesData.data.data));
    }
    // Debug: log classes data
    console.log('TeacherContext - classesData:', classesData);
    console.log('TeacherContext - classes array:', classes);
  }, [classesData]);

  // Helper functions to safely extract data
  const getUniqueClasses = () => {
    const classMap = new Map();
    classes.forEach(cls => {
      const classId = typeof cls.classId === 'object' && cls.classId !== null ? cls.classId._id : cls.classId;
      const className = typeof cls.classId === 'object' && cls.classId !== null ? cls.classId.name : cls.classId;
      if (classId && !classMap.has(classId)) {
        classMap.set(classId, { _id: classId, name: className as string });
      }
    });
    return Array.from(classMap.values());
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => {
      const currentClassId = typeof c.classId === 'object' && c.classId !== null ? c.classId._id : c.classId;
      return currentClassId === classId;
    });
    return typeof cls?.classId === 'object' && cls.classId !== null ? cls.classId.name : (cls?.classId as string) || 'Unknown';
  };

  const getSectionName = (classId: string, sectionId: string) => {
    const cls = classes.find(c => {
      const currentClassId = typeof c.classId === 'object' && c.classId !== null ? c.classId._id : c.classId;
      const currentSectionId = typeof c.sectionId === 'object' && c.sectionId !== null ? c.sectionId._id : c.sectionId;
      return currentClassId === classId && currentSectionId === sectionId;
    });
    return typeof cls?.sectionId === 'object' && cls.sectionId !== null ? cls.sectionId.name : (cls?.sectionId as string) || 'Unknown';
  };

  const getSectionsForClass = (classId: string) => {
    const sectionMap = new Map();
    classes
      .filter(cls => {
        const currentClassId = typeof cls.classId === 'object' && cls.classId !== null ? cls.classId._id : cls.classId;
        return currentClassId === classId;
      })
      .forEach(cls => {
        const sectionId = typeof cls.sectionId === 'object' && cls.sectionId !== null ? cls.sectionId._id : cls.sectionId;
        const sectionName = typeof cls.sectionId === 'object' && cls.sectionId !== null ? cls.sectionId.name : cls.sectionId;
        if (sectionId && !sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, { _id: sectionId, name: sectionName as string });
        }
      });
    return Array.from(sectionMap.values());
  };

  const value: TeacherContextType = {
    classesData,
    classesLoading,
    classes,
    getUniqueClasses,
    getClassName,
    getSectionName,
    getSectionsForClass,
    refetchClasses: () => refetchClasses(),
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacherContext = () => {
  const context = useContext(TeacherContext);
  if (context === undefined) {
    throw new Error('useTeacherContext must be used within a TeacherProvider');
  }
  return context;
};
