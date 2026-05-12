import React, { createContext, useContext, useState, useEffect } from 'react';
import { academicYearApi } from '@/services/api';

interface AcademicYear {
  id: string;
  _id?: string;
  name: string;
  isActive: boolean;
}

interface ConfigContextType {
  selectedYearId: string;
  setSelectedYearId: (id: string) => void;
  academicYears: AcademicYear[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedYearId, setSelectedYearId] = useState<string>(() => {
    return localStorage.getItem('selectedAcademicYearId') || '';
  });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch academic years and set default
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await academicYearApi.getAll();
        const years = (response.data.data || []).filter((y: AcademicYear) => y.isActive);
        setAcademicYears(years);
        
        // If no year selected in localStorage, find the one with isCurrent: true
        if (!selectedYearId && years.length > 0) {
          const currentYear = years.find((y: any) => y.isCurrent) || years[0];
          const yearId = currentYear._id || currentYear.id;
          setSelectedYearId(yearId);
          localStorage.setItem('selectedAcademicYearId', yearId);
        }
      } catch (error) {
        console.error('Failed to fetch academic years for config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchYears();
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Update localStorage when year changes
  useEffect(() => {
    if (selectedYearId) {
      localStorage.setItem('selectedAcademicYearId', selectedYearId);
    }
  }, [selectedYearId]);

  return (
    <ConfigContext.Provider value={{ 
      selectedYearId, 
      setSelectedYearId, 
      academicYears, 
      theme, 
      setTheme,
      isLoading 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
