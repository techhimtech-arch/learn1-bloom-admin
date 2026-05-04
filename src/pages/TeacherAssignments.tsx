import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAssignmentApi, classTeacherAssignmentApi, classApi, sectionApi, subjectApi, userApi } from '@/pages/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher { _id: string; name: string; email: string; }
interface ClassItem { _id: string; name: string; }
interface Section { _id: string; name: string; classId: string; }
interface Subject { _id: string; name: string; classId: { _id: string; name: string } | string; }
interface Assignment {
  _id: string;
  teacherId: { _id: string; name: string } | string;
  classId: { _id: string; name: string } | string;
  sectionId: { _id: string; name: string } | string;
  subjectId?: { _id: string; name: string } | string;
  academicYear?: string;
  isActive: boolean;
}

const getName = (field: { _id: string; name: string } | string | undefined): string => {
  if (!field) return '—';
  return typeof field === 'string' ? field : field.name;
};

const TeacherAssignments = () => {
  const queryClient = useQueryClient();
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classTeacherDialogOpen, setClassTeacherDialogOpen] = useState(false);

  // Subject assignment form
  const [subjectForm, setSubjectForm] = useState({ teacherId: '', classId: '', sectionId: '', subjectId: '' });
  // Class teacher form
  const [ctForm, setCtForm] = useState({ teacherId: '', classId: '', sectionId: '', academicYear: '' });

  // Fetch data
  const { data: teachersRes } = useQuery({ 
    queryKey: ['teachers'], 
    queryFn: () => userApi.getAll({ role: 'teacher', limit: 100 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  const { data: classesRes } = useQuery({ 
    queryKey: ['classes'], 
    queryFn: () => classApi.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: sectionsRes } = useQuery({ 
    queryKey: ['sections'], 
    queryFn: () => sectionApi.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: subjectsRes } = useQuery({ 
    queryKey: ['subjects'], 
    queryFn: () => subjectApi.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: assignmentsRes, isLoading: loadingAssignments } = useQuery({ 
    queryKey: ['teacher-assignments'], 
    queryFn: () => teacherAssignmentApi.getAll(),
    staleTime: 3 * 60 * 1000, // 3 minutes (یہ بدل scale ہے assignments)
    gcTime: 5 * 60 * 1000,
  });
  const { data: ctAssignmentsRes, isLoading: loadingCT } = useQuery({ 
    queryKey: ['class-teacher-assignments'], 
    queryFn: () => classTeacherAssignmentApi.getAll(),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const teachers: Teacher[] = teachersRes?.data?.data?.users || teachersRes?.data?.data || [];
  const classes: ClassItem[] = classesRes?.data?.data || [];
  const allSections: Section[] = sectionsRes?.data?.data || [];
  const allSubjects: Subject[] = subjectsRes?.data?.data || [];
  const assignments: Assignment[] = assignmentsRes?.data?.data || [];
  const ctAssignments: Assignment[] = ctAssignmentsRes?.data?.data || [];

  // Filtered sections/subjects by selected class
  const filteredSections = subjectForm.classId ? allSections.filter(s => s.classId === subjectForm.classId || (s as any).classId?._id === subjectForm.classId) : [];
  const filteredSubjects = subjectForm.classId ? allSubjects.filter(s => {
    const cid = typeof s.classId === 'string' ? s.classId : s.classId?._id;
    return cid === subjectForm.classId;
  }) : [];

  const ctFilteredSections = ctForm.classId ? allSections.filter(s => s.classId === ctForm.classId || (s as any).classId?._id === ctForm.classId) : [];

  // Mutations
  const createSubjectAssignment = useMutation({
    mutationFn: (data: typeof subjectForm) => teacherAssignmentApi.create(data),
    onSuccess: () => {
      toast.success('Subject assignment created');
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setSubjectDialogOpen(false);
      setSubjectForm({ teacherId: '', classId: '', sectionId: '', subjectId: '' });
    },
    onError: (err: any) => handleApiError(err, 'Failed to create assignment'),
  });

  const createCTAssignment = useMutation({
    mutationFn: (data: typeof ctForm) => classTeacherAssignmentApi.create(data),
    onSuccess: () => {
      toast.success('Class teacher assigned');
      queryClient.invalidateQueries({ queryKey: ['class-teacher-assignments'] });
      setClassTeacherDialogOpen(false);
      setCtForm({ teacherId: '', classId: '', sectionId: '', academicYear: '' });
    },
    onError: (err: any) => handleApiError(err, 'Failed to assign class teacher'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => teacherAssignmentApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success('Assignment updated');
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
    onError: () => handleApiError(undefined, 'Failed to update'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Assignments</h1>
        <p className="text-sm text-muted-foreground">Assign teachers to subjects and classes</p>
      </div>

      <Tabs defaultValue="subject">
        <TabsList>
          <TabsTrigger value="subject" className="gap-1.5"><BookOpen className="h-4 w-4" /> Subject Teachers</TabsTrigger>
          <TabsTrigger value="class" className="gap-1.5"><UserCheck className="h-4 w-4" /> Class Teachers</TabsTrigger>
        </TabsList>

        {/* Subject Teacher Tab */}
        <TabsContent value="subject">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Subject Teacher Assignments</CardTitle>
              <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Assign</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign Subject Teacher</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Teacher</Label>
                      <Select value={subjectForm.teacherId} onValueChange={v => setSubjectForm(p => ({ ...p, teacherId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => (
                            <SelectItem key={t._id} value={t._id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{t.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Class</Label>
                      <Select value={subjectForm.classId} onValueChange={v => setSubjectForm(p => ({ ...p, classId: v, sectionId: '', subjectId: '' }))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Section</Label>
                      <Select value={subjectForm.sectionId} onValueChange={v => setSubjectForm(p => ({ ...p, sectionId: v }))} disabled={!subjectForm.classId}>
                        <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>{filteredSections.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Select value={subjectForm.subjectId} onValueChange={v => setSubjectForm(p => ({ ...p, subjectId: v }))} disabled={!subjectForm.classId}>
                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>{filteredSubjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => createSubjectAssignment.mutate(subjectForm)}
                      disabled={!subjectForm.teacherId || !subjectForm.classId || !subjectForm.sectionId || !subjectForm.subjectId || createSubjectAssignment.isPending}
                    >
                      {createSubjectAssignment.isPending ? 'Assigning…' : 'Assign Teacher'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subject assignments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a._id}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getName(a.teacherId).substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            {getName(a.teacherId)}
                          </div>
                        </TableCell>
                        <TableCell>{getName(a.classId)}</TableCell>
                        <TableCell>{getName(a.sectionId)}</TableCell>
                        <TableCell>{getName(a.subjectId)}</TableCell>
                        <TableCell>
                          <Badge variant={a.isActive ? 'default' : 'secondary'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActive.mutate({ id: a._id, isActive: !a.isActive })}
                          >
                            {a.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Teacher Tab */}
        <TabsContent value="class">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Class Teacher Assignments</CardTitle>
              <Dialog open={classTeacherDialogOpen} onOpenChange={setClassTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Assign</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign Class Teacher</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Teacher</Label>
                      <Select value={ctForm.teacherId} onValueChange={v => setCtForm(p => ({ ...p, teacherId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => (
                            <SelectItem key={t._id} value={t._id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{t.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Class</Label>
                      <Select value={ctForm.classId} onValueChange={v => setCtForm(p => ({ ...p, classId: v, sectionId: '' }))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Section</Label>
                      <Select value={ctForm.sectionId} onValueChange={v => setCtForm(p => ({ ...p, sectionId: v }))} disabled={!ctForm.classId}>
                        <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>{ctFilteredSections.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Academic Year</Label>
                      <Select value={ctForm.academicYear} onValueChange={v => setCtForm(p => ({ ...p, academicYear: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2026-27">2026-27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => createCTAssignment.mutate(ctForm)}
                      disabled={!ctForm.teacherId || !ctForm.classId || !ctForm.sectionId || !ctForm.academicYear || createCTAssignment.isPending}
                    >
                      {createCTAssignment.isPending ? 'Assigning…' : 'Assign Class Teacher'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingCT ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : ctAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No class teacher assignments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ctAssignments.map(a => (
                      <TableRow key={a._id}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getName(a.teacherId).substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            {getName(a.teacherId)}
                          </div>
                        </TableCell>
                        <TableCell>{getName(a.classId)}</TableCell>
                        <TableCell>{getName(a.sectionId)}</TableCell>
                        <TableCell>{a.academicYear || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={a.isActive ? 'default' : 'secondary'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAssignments;
