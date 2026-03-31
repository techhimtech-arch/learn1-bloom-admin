import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { academicYearApi, classApi, sectionApi } from '@/services/api';

export interface AcademicFiltersProps {
  onFiltersChange: (filters: AcademicFiltersState) => void;
  loading?: boolean;
  showSession?: boolean;
  showClass?: boolean;
  showSection?: boolean;
  showDepartment?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
}

export interface AcademicFiltersState {
  search: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  department: string;
  status: string;
}

const departments = [
  { value: 'science', label: 'Science' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'arts', label: 'Arts' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'computer', label: 'Computer Science' },
  { value: 'languages', label: 'Languages' },
  { value: 'physical', label: 'Physical Education' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export function AcademicFilters({
  onFiltersChange,
  loading = false,
  showSession = true,
  showClass = true,
  showSection = true,
  showDepartment = true,
  showStatus = true,
  showSearch = true,
}: AcademicFiltersProps) {
  const [filters, setFilters] = useState<AcademicFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    department: '',
    status: '',
  });

  const [defaultYearSet, setDefaultYearSet] = useState(false);

  // Use React Query so cache is shared with SubjectForm and other components
  const { data: academicYearsData, isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
      return response.data;
    },
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  // Only fetch sections when a class is selected
  const { data: sectionsData } = useQuery({
    queryKey: ['sections', filters.classId],
    queryFn: async () => {
      const response = await sectionApi.getByClass(filters.classId);
      return response.data;
    },
    enabled: !!filters.classId,
  });

  const academicYears = Array.isArray(academicYearsData) ? academicYearsData : academicYearsData?.data || [];
  const classes = Array.isArray(classesData) ? classesData : classesData?.data || [];
  const sections = Array.isArray(sectionsData) ? sectionsData : sectionsData?.data || [];
  const dataLoading = yearsLoading || classesLoading;

  // Set default academic year once data loads
  useEffect(() => {
    if (!defaultYearSet && academicYears.length > 0) {
      const currentYear = academicYears.find((year: any) => year.isActive);
      if (currentYear) {
        const yearId = currentYear._id || currentYear.id;
        setFilters(prev => ({ ...prev, academicYearId: yearId }));
        onFiltersChange({ ...filters, academicYearId: yearId });
      }
      setDefaultYearSet(true);
    }
  }, [academicYears, defaultYearSet]);

  const updateFilter = (key: keyof AcademicFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'classId') {
      newFilters.sectionId = '';
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AcademicFiltersState = {
      search: '',
      academicYearId: academicYears.find((y: any) => y.isActive)?._id || academicYears.find((y: any) => y.isActive)?.id || '',
      classId: '',
      sectionId: '',
      department: '',
      status: '',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) =>
      key !== 'academicYearId' && value !== ''
    ).length;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
              disabled={loading || dataLoading}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showSession && (
            <Select
              value={filters.academicYearId || undefined}
              onValueChange={(value) => updateFilter('academicYearId', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year: any, index: number) => (
                  <SelectItem key={year._id || year.id || `year-${index}`} value={year._id || year.id}>
                    {year.name} {year.isActive && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showClass && (
            <Select
              value={filters.classId || undefined}
              onValueChange={(value) => updateFilter('classId', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any, index: number) => (
                  <SelectItem key={cls._id || cls.id || `class-${index}`} value={cls._id || cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showSection && (
            <Select
              value={filters.sectionId || undefined}
              onValueChange={(value) => updateFilter('sectionId', value)}
              disabled={loading || dataLoading || !filters.classId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section: any, index: number) => (
                  <SelectItem key={section._id || section.id || `section-${index}`} value={section._id || section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showDepartment && (
            <Select
              value={filters.department || undefined}
              onValueChange={(value) => updateFilter('department', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept, index) => (
                  <SelectItem key={dept.value || `dept-${index}`} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showStatus && (
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => updateFilter('status', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status, index) => (
                  <SelectItem key={status.value || `status-${index}`} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}