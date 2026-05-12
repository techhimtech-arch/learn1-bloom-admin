import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { academicYearApi, classApi, sectionApi } from '@/services/api';

export interface ExamFiltersProps {
  onFiltersChange: (filters: ExamFiltersState) => void;
  loading?: boolean;
  showSession?: boolean;
  showClass?: boolean;
  showSection?: boolean;
  showExamType?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
}

export interface ExamFiltersState {
  search: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  examType: string;
  status: string;
}

const examTypes = [
  { value: 'midterm', label: 'Midterm Exam' },
  { value: 'final', label: 'Final Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'practical', label: 'Practical Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'test', label: 'Unit Test' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'published', label: 'Published' },
];

export function ExamFilters({
  onFiltersChange,
  loading = false,
  showSession = true,
  showClass = true,
  showSection = true,
  showExamType = true,
  showStatus = true,
  showSearch = true,
}: ExamFiltersProps) {
  const [filters, setFilters] = useState<ExamFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    examType: '',
    status: '',
  });

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filters.classId) {
      loadSections(filters.classId);
    } else {
      setSections([]);
    }
  }, [filters.classId]);

  const loadInitialData = async () => {
    setDataLoading(true);
    try {
      const [yearsRes, classesRes] = await Promise.all([
        academicYearApi.getAll(),
        classApi.getAll(),
      ]);
      
      setAcademicYears((yearsRes.data?.data || []).filter((y: any) => y.isActive));
      setClasses(classesRes.data?.data || []);
      
      // Set current academic year if available
      const currentYear = yearsRes.data?.data?.find((year: any) => year.isActive);
      if (currentYear) {
        setFilters(prev => ({ ...prev, academicYearId: currentYear.id }));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const response = await sectionApi.getByClass(classId);
      setSections(response.data?.data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const updateFilter = (key: keyof ExamFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      academicYearId: academicYears.find(y => y.isActive)?.id || '',
      classId: '',
      sectionId: '',
      examType: '',
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
            Exam Filters
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
              placeholder="Search exams..."
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
              value={filters.academicYearId}
              onValueChange={(value) => updateFilter('academicYearId', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isActive && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showClass && (
            <Select
              value={filters.classId}
              onValueChange={(value) => updateFilter('classId', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showSection && (
            <Select
              value={filters.sectionId}
              onValueChange={(value) => updateFilter('sectionId', value)}
              disabled={loading || dataLoading || !filters.classId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showExamType && (
            <Select
              value={filters.examType}
              onValueChange={(value) => updateFilter('examType', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showStatus && (
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value)}
              disabled={loading || dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
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
