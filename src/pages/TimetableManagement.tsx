import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Users, Plus, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AcademicFilters, AcademicFiltersState } from '@/components/shared/AcademicFilters';
import { ClassTimetableView } from '@/components/academic/ClassTimableView';
import { TeacherTimetableView } from '@/components/academic/TeacherTimetableView';
import { TimetableSlotForm } from '@/components/academic/TimetableSlotForm';
import { classApi, userApi } from '@/pages/services/api';

const normalizeArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.data?.users)) return value.data.users;
  if (Array.isArray(value?.users)) return value.users;
  return [];
};

export default function TimetableManagement() {
  const [filters, setFilters] = useState<AcademicFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    department: '',
    status: '',
  });

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await userApi.getAll({ role: 'teacher' });
      return normalizeArray(response.data);
    },
  });

  const hasValidFilters = filters.classId && filters.sectionId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground">Manage class and teacher schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowSlotForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        </div>
      </div>

      <AcademicFilters
        onFiltersChange={setFilters}
        showDepartment={false}
        showStatus={false}
        showSearch={false}
      />

      <Tabs defaultValue="class-timetable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="class-timetable" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Class Timetable
          </TabsTrigger>
          <TabsTrigger value="teacher-timetable" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teacher Timetable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="class-timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Class TimetableView
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasValidFilters ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Class and Section</h3>
                  <p className="text-muted-foreground">
                    Please select a class and section to view the timetable
                  </p>
                </div>
              ) : (
                <ClassTimetableView
                  classId={filters.classId}
                  sectionId={filters.sectionId}
                  viewMode={viewMode}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher-timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teacher TimetableView
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherTimetableView
                teachers={teachersData || []}
                viewMode={viewMode}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showSlotForm && (
        <TimetableSlotForm
          classes={normalizeArray(classesData)}
          onClose={() => setShowSlotForm(false)}
          onSuccess={() => setShowSlotForm(false)}
        />
      )}
    </div>
  );
}
