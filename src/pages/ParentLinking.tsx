import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link, Users, Search, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { studentApi, classApi, sectionApi, parentLinkingApi, userApi } from '@/pages/services/api';

export default function ParentLinking() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ classId: '', sectionId: '', search: '' });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await classApi.getAll()).data,
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => (await sectionApi.getAll()).data,
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', filters.classId, filters.sectionId, filters.search],
    queryFn: async () => {
      const response = await studentApi.getAll(filters);
      return response.data;
    },
  });

  const { data: linkedParentsData } = useQuery({
    queryKey: ['linked-parents', selectedStudent?._id || selectedStudent?.id],
    queryFn: async () => {
      const id = selectedStudent?._id || selectedStudent?.id;
      if (!id) return { data: [] };
      return (await parentLinkingApi.getLinkedParents(id)).data;
    },
    enabled: !!selectedStudent,
  });

  const { data: searchedParentsData } = useQuery({
    queryKey: ['parents-search', parentSearch],
    queryFn: async () => {
      if (!parentSearch || parentSearch.length < 3) return { data: { users: [] } };
      return (await parentLinkingApi.searchParents({ search: parentSearch })).data;
    },
    enabled: parentSearch.length >= 3,
  });

  const linkMutation = useMutation({
    mutationFn: (parentId: string) => {
      const studentId = selectedStudent?._id || selectedStudent?.id;
      return parentLinkingApi.linkParent(studentId, parentId);
    },
    onSuccess: () => {
      toast.success('Parent linked successfully');
      queryClient.invalidateQueries({ queryKey: ['linked-parents'] });
      setParentSearch('');
    },
    onError: (err: any) => handleApiError(err, 'Failed to link parent'),
  });

  const unlinkMutation = useMutation({
    mutationFn: (parentId: string) => {
      const studentId = selectedStudent?._id || selectedStudent?.id;
      return parentLinkingApi.unlinkParent(studentId, parentId);
    },
    onSuccess: () => {
      toast.success('Parent unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['linked-parents'] });
    },
    onError: (err: any) => handleApiError(err, 'Failed to unlink parent'),
  });

  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];
  const students = studentsData?.data?.users || studentsData?.data || [];
  const linkedParents = linkedParentsData?.data || [];
  const searchedParents = searchedParentsData?.data?.users || searchedParentsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Linking</h1>
          <p className="text-muted-foreground">Link parents to their children accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search student by name or admission number..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <Select value={filters.classId} onValueChange={(v) => setFilters((p) => ({ ...p, classId: v, sectionId: '' }))}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.sectionId} onValueChange={(v) => setFilters((p) => ({ ...p, sectionId: v }))} disabled={!filters.classId || filters.classId === 'all'}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.filter((s: any) => s.classId === filters.classId || s.classId?._id === filters.classId).map((sec: any) => (
                  <SelectItem key={sec._id || sec.id} value={sec._id || sec.id}>{sec.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Class & Section</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStudents ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No students found.</TableCell></TableRow>
                ) : (
                  students.map((student: any) => (
                    <TableRow key={student._id || student.id}>
                      <TableCell className="font-medium">{student.name || `${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.admissionNumber || '-'}</TableCell>
                      <TableCell>{student.class?.name || '-'} - {student.section?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedStudent(student); setLinkModalOpen(true); }}>
                          <Link className="h-4 w-4 mr-2" />
                          Manage Parents
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Parents for {selectedStudent?.name || `${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`}</DialogTitle>
            <DialogDescription>View linked parents or search to link a new parent account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Linked Parents</h3>
              {linkedParents.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">No parents linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {linkedParents.map((parent: any) => (
                    <div key={parent._id || parent.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
                      <div>
                        <div className="font-medium">{parent.name || `${parent.firstName} ${parent.lastName}`}</div>
                        <div className="text-sm text-muted-foreground">{parent.email} • {parent.phone || '-'}</div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => unlinkMutation.mutate(parent._id || parent.id)} disabled={unlinkMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Link New Parent</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Search parent by name, email, or phone (min 3 chars)..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="flex-1"
                />
              </div>

              {parentSearch.length >= 3 && (
                <div className="mt-4 space-y-2">
                  {searchedParents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matching parents found.</p>
                  ) : (
                    searchedParents.map((parent: any) => {
                      const isLinked = linkedParents.some((p: any) => (p._id || p.id) === (parent._id || parent.id));
                      return (
                        <div key={parent._id || parent.id} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <div className="font-medium">{parent.name || `${parent.firstName} ${parent.lastName}`}</div>
                            <div className="text-sm text-muted-foreground">{parent.email}</div>
                          </div>
                          <Button
                            size="sm"
                            disabled={isLinked || linkMutation.isPending}
                            onClick={() => linkMutation.mutate(parent._id || parent.id)}
                          >
                            {isLinked ? 'Linked' : 'Link'}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
