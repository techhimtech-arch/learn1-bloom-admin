import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit,
  Eye,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import TimetableGrid from './TimetableGrid';
import TimetableForm from './TimetableForm';
import { 
  TimetableEntry, 
  WeeklyTimetable, 
  Subject, 
  Teacher, 
  Class, 
  Section, 
  AcademicSession,
  TimetableFormData 
} from '@/types/timetable';
import { 
  adminTimetableService, 
  timetableDataService, 
  timetableUtils 
} from '@/services/timetableService';

const AdminTimetableManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const queryClient = useQueryClient();

  // Fetch dropdown data
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => timetableDataService.getSubjects().then(res => res.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => timetableDataService.getTeachers().then(res => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => timetableDataService.getClasses().then(res => res.data),
  });

  const { data: academicSessions } = useQuery({
    queryKey: ['academicSessions'],
    queryFn: () => timetableDataService.getAcademicSessions().then(res => res.data),
  });

  const { data: sections } = useQuery({
    queryKey: ['sections', selectedClass],
    queryFn: () => selectedClass 
      ? timetableDataService.getSections(selectedClass).then(res => res.data)
      : Promise.resolve({ data: [] }),
    enabled: !!selectedClass,
  });

  // Fetch weekly timetable
  const { 
    data: weeklyTimetable, 
    isLoading: timetableLoading,
    error: timetableError 
  } = useQuery({
    queryKey: ['weeklyTimetable', selectedClass, selectedSection, selectedAcademicSession],
    queryFn: () => {
      if (!selectedClass || !selectedSection || !selectedAcademicSession) {
        return Promise.resolve({ data: {} });
      }
      return adminTimetableService.getWeeklyTimetable(selectedClass, selectedSection, selectedAcademicSession)
        .then(res => res.data);
    },
    enabled: !!selectedClass && !!selectedSection && !!selectedAcademicSession,
  });

  // Fetch teacher timetable
  const { 
    data: teacherTimetable, 
    isLoading: teacherTimetableLoading 
  } = useQuery({
    queryKey: ['teacherTimetable', selectedTeacher, selectedAcademicSession],
    queryFn: () => {
      if (!selectedTeacher || !selectedAcademicSession) {
        return Promise.resolve({ data: [] });
      }
      return adminTimetableService.getTeacherTimetable(selectedTeacher, selectedAcademicSession)
        .then(res => res.data);
    },
    enabled: !!selectedTeacher && !!selectedAcademicSession,
  });

  // Mutations
  const createTimetableMutation = useMutation({
    mutationFn: (data: TimetableFormData) => adminTimetableService.createTimetable(data),
    onSuccess: () => {
      toast.success('Timetable entry created successfully');
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['weeklyTimetable'] });
    },
    onError: (error: any) => {
      const conflict = timetableUtils.parseConflictError(error.message);
      toast.error(conflict.message);
    },
  });

  const updateTimetableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimetableFormData }) => 
      adminTimetableService.updateTimetable(id, data),
    onSuccess: () => {
      toast.success('Timetable entry updated successfully');
      setEditingEntry(null);
      queryClient.invalidateQueries({ queryKey: ['weeklyTimetable'] });
    },
    onError: (error: any) => {
      const conflict = timetableUtils.parseConflictError(error.message);
      toast.error(conflict.message);
    },
  });

  const deleteTimetableMutation = useMutation({
    mutationFn: (id: string) => adminTimetableService.deleteTimetable(id),
    onSuccess: () => {
      toast.success('Timetable entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['weeklyTimetable'] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete timetable entry');
    },
  });

  const handleCreateTimetable = async (data: TimetableFormData) => {
    await createTimetableMutation.mutateAsync(data);
  };

  const handleUpdateTimetable = async (data: TimetableFormData) => {
    if (!editingEntry) return;
    await updateTimetableMutation.mutateAsync({ id: editingEntry._id, data });
  };

  const handleDeleteTimetable = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      await deleteTimetableMutation.mutateAsync(id);
    }
  };

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setShowCreateForm(true);
  };

  const filteredClasses = classes?.filter(cls => 
    !selectedAcademicSession || cls.academicSessionId === selectedAcademicSession
  ) || [];

  const activeSession = academicSessions?.find(session => session.isActive);

  useEffect(() => {
    if (activeSession && !selectedAcademicSession) {
      setSelectedAcademicSession(activeSession._id);
    }
  }, [activeSession, selectedAcademicSession]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-gray-600">Manage class schedules and teacher assignments</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          disabled={!selectedClass || !selectedSection || !selectedAcademicSession}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Academic Session</label>
              <Select value={selectedAcademicSession} onValueChange={setSelectedAcademicSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {academicSessions?.map((session) => (
                    <SelectItem key={session._id} value={session._id}>
                      <div className="flex items-center gap-2">
                        <span>{session.name}</span>
                        {session.isActive && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections?.filter(section => section.classId === selectedClass).map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Teacher View</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Class Timetable
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teacher View
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {!selectedClass || !selectedSection || !selectedAcademicSession ? (
            <Alert>
              <AlertDescription>
                Please select an academic session, class, and section to view the timetable.
              </AlertDescription>
            </Alert>
          ) : (
            <TimetableGrid 
              weeklyTimetable={weeklyTimetable || {}} 
              isLoading={timetableLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          {!selectedTeacher || !selectedAcademicSession ? (
            <Alert>
              <AlertDescription>
                Please select a teacher and academic session to view their timetable.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Teacher Timetable</CardTitle>
                <CardDescription>
                  {teachers?.find(t => t._id === selectedTeacher)?.name}'s Schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teacherTimetableLoading ? (
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : teacherTimetable && teacherTimetable.length > 0 ? (
                  <div className="space-y-2">
                    {teacherTimetable.map((entry) => (
                      <div key={entry._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{timetableUtils.formatDay(entry.day)}</Badge>
                          <span className="font-medium">Period {entry.periodNumber}</span>
                          <span>{timetableUtils.formatTime(entry.startTime)} - {timetableUtils.formatTime(entry.endTime)}</span>
                          <span>{entry.subject.name}</span>
                          <span className="text-gray-600">{entry.classId} - {entry.sectionId}</span>
                          <span className="text-gray-600">Room: {entry.room}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditEntry(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteTimetable(entry._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No timetable entries found for this teacher.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(weeklyTimetable || {}).flat().length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredClasses.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teachers?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingEntry ? 'Edit Timetable Entry' : 'Create Timetable Entry'}
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEntry(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              <TimetableForm
                onSubmit={editingEntry ? handleUpdateTimetable : handleCreateTimetable}
                isLoading={createTimetableMutation.isPending || updateTimetableMutation.isPending}
                initialData={editingEntry ? {
                  classId: editingEntry.classId,
                  sectionId: editingEntry.sectionId,
                  day: editingEntry.day,
                  periodNumber: editingEntry.periodNumber,
                  subjectId: editingEntry.subjectId,
                  teacherId: editingEntry.teacherId,
                  startTime: editingEntry.startTime,
                  endTime: editingEntry.endTime,
                  room: editingEntry.room,
                  academicSessionId: editingEntry.academicSessionId,
                  semester: editingEntry.semester,
                } : undefined}
                subjects={subjects}
                teachers={teachers}
                classes={filteredClasses}
                academicSessions={academicSessions}
                sections={sections}
                selectedClassId={selectedClass}
                onClassChange={setSelectedClass}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimetableManager;
