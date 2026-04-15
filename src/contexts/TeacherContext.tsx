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
  classes: ClassAssignment[];
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

  const classes = Array.isArray((classesData as any)?.data?.subjectAssignments) 
    ? (classesData as any).data.subjectAssignments as ClassAssignment[] : 
    Array.isArray((classesData as any)?.data?.data) 
    ? (classesData as any).data.data as ClassAssignment[] : 
    Array.isArray((classesData as any)?.data?.classTeacherAssignment)
    ? [(classesData as any).data.classTeacherAssignment] as ClassAssignment[]
    : [];

  // Store teacher profile data in localStorage for use across components
  useEffect(() => {
    if (classesData?.data?.classTeacherAssignment || classesData?.data?.subjectAssignments) {
      localStorage.setItem('teacherProfile', JSON.stringify(classesData.data));
    }
  }, [classesData]);

  // Helper functions to safely extract data
  const getUniqueClasses = () => {
    const classMap = new Map();
    classes.forEach(cls => {
      const classId = cls.classId?._id || cls.classId;
      const className = cls.classId?.name || cls.classId;
      if (classId && !classMap.has(classId)) {
        classMap.set(classId, { _id: classId, name: className });
      }
    });
    return Array.from(classMap.values());
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => (c.classId?._id || c.classId) === classId);
    return cls?.classId?.name || cls?.classId || 'Unknown';
  };

  const getSectionName = (classId: string, sectionId: string) => {
    const cls = classes.find(c => (c.classId?._id || c.classId) === classId && 
                                       (c.sectionId?._id || c.sectionId) === sectionId);
    return cls?.sectionId?.name || cls?.sectionId || 'Unknown';
  };

  const getSectionsForClass = (classId: string) => {
    const sectionMap = new Map();
    classes
      .filter(cls => (cls.classId?._id || cls.classId) === classId)
      .forEach(cls => {
        const sectionId = cls.sectionId?._id || cls.sectionId;
        const sectionName = cls.sectionId?.name || cls.sectionId;
        if (sectionId && !sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, { _id: sectionId, name: sectionName });
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
