import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Users, Plus, X, Crown, User, LayoutGrid } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { subjectApi, sectionApi } from '@/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string | any;
  teachers?: Array<{
    id: string;
    name: string;
    email: string;
    role: 'primary' | 'assistant';
    sectionId?: string;
    section?: { name: string };
  }>;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TeacherAssignmentDialogProps {
  subject: Subject;
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TeacherAssignmentDialog({
  subject,
  teachers,
  onClose,
  onSuccess
}: TeacherAssignmentDialogProps) {
  const [open, setOpen] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedRole, setSelectedRole] = useState<'primary' | 'assistant'>('assistant');
  const [selectedSection, setSelectedSection] = useState('');

  // Fetch sections for the subject's class
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', subject.classId],
    queryFn: async () => {
      const classId = typeof subject.classId === 'object'
        ? (subject.classId as any)._id || (subject.classId as any).id
        : subject.classId;

      if (!classId) return { data: [] };

      const response = await sectionApi.getByClass(classId);
      return response.data;
    },
    enabled: !!subject.classId,
  });

  const sections = sectionsData?.data || [];

  const assignMutation = useMutation({
    mutationFn: ({ teacherId, sectionId, role }: { teacherId: string; sectionId: string; role: string }) =>
      subjectApi.assignTeacher(subject.id || (subject as any)._id, { teacherId, sectionId, role }),
    onSuccess: () => {
      toast.success('Teacher assigned successfully');
      setSelectedTeacher('');
      setSelectedSection('');
      setSelectedRole('assistant');
      onSuccess(); // Refresh the list
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to assign teacher');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (teacherId: string) =>
      subjectApi.removeTeacher(subject.id, teacherId),
    onSuccess: () => {
      toast.success('Teacher removed successfully');
      onSuccess();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to remove teacher');
    },
  });

  const handleAssign = () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }

    assignMutation.mutate({
      teacherId: selectedTeacher,
      sectionId: selectedSection,
      role: selectedRole
    });
  };

  const handleRemove = (teacherId: string) => {
    removeMutation.mutate(teacherId);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const availableTeachers = Array.isArray(teachers) ? teachers : [];

  const isLoading = assignMutation.isPending || removeMutation.isPending || sectionsLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Assignment - {subject.name}
          </DialogTitle>
          <DialogDescription>
            Manage teacher assignments for this subject and its sections
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Teachers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              {subject.teachers && subject.teachers.length > 0 ? (
                <div className="space-y-3">
                  {subject.teachers.map((teacher, index) => (
                    <div
                      key={teacher.id || `teacher-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {teacher.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{teacher.name}</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <LayoutGrid className="h-3 w-3" />
                              {teacher.section?.name || 'No Section'}
                            </Badge>
                            {teacher.role === 'primary' ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Primary
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Assistant
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(teacher.id)}
                        disabled={isLoading}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No teachers assigned yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Teacher */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign New Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Select Teacher</label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeachers.map((teacher) => {
                          const tId = (teacher as any)._id || teacher.id;
                          return (
                            <SelectItem key={tId} value={tId}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={teacher.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {teacher.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">{teacher.name}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {teacher.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Section</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section: any) => (
                          <SelectItem key={section._id || section.id} value={section._id || section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Role</label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value: 'primary' | 'assistant') => setSelectedRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assistant">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Assistant Teacher
                          </div>
                        </SelectItem>
                        <SelectItem value="primary">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Primary Teacher
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={!selectedTeacher || !selectedSection || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Assign Teacher
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
