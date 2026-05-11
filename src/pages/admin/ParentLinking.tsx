import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link, Users, Search, Trash2, UserPlus, Phone, Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { studentApi, parentLinkingApi, userApi } from '@/services/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StudentProfileModal } from '@/components/student/StudentProfileModal';

export default function ParentLinking() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('unlinked');
  
  // Tab A State
  const [studentSearch, setStudentSearch] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Tab B State
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);

  // Fetch all students (Audit view - ideal to have backend filter, but filtering client side for now)
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-audit', studentSearch],
    queryFn: async () => {
      const response = await studentApi.getAll({ search: studentSearch, limit: 100 });
      return response.data;
    },
  });

  const students = studentsData?.data?.users || studentsData?.data || [];
  // For the demo, we assume students without `parents` array or specific field are unlinked.
  // We'll show all students here and let the admin link them.

  // Fetch Parent Search
  const { data: searchedParentsData, isLoading: searchParentLoading } = useQuery({
    queryKey: ['parents-search-global', parentSearch],
    queryFn: async () => {
      if (!parentSearch || parentSearch.length < 3) return { data: { users: [] } };
      return (await parentLinkingApi.searchParents({ search: parentSearch })).data;
    },
    enabled: parentSearch.length >= 3,
  });
  const searchedParents = searchedParentsData?.data?.users || searchedParentsData?.data || [];

  // Fetch Students for selected Parent (Family Tree)
  const { data: parentStudentsData, isLoading: parentStudentsLoading } = useQuery({
    queryKey: ['parent-students', selectedParent?._id || selectedParent?.id],
    queryFn: async () => {
      const id = selectedParent?._id || selectedParent?.id;
      if (!id) return null;
      const res = await parentLinkingApi.getLinkedStudents(id);
      return res.data;
    },
    enabled: !!(selectedParent?._id || selectedParent?.id),
    retry: 1,
  });
  // Backend returns: { data: { parentId, parentName, linkedStudents: [...], count } }
  const linkedStudents = 
    parentStudentsData?.data?.linkedStudents || 
    parentStudentsData?.linkedStudents || 
    parentStudentsData?.data || 
    [];

  const unlinkChildMutation = useMutation({
    mutationFn: (studentId: string) => {
      const parentId = selectedParent?._id || selectedParent?.id;
      return parentLinkingApi.unlinkParent(studentId, parentId);
    },
    onSuccess: () => {
      toast.success('Child unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['parent-students'] });
    },
    onError: (err: any) => handleApiError(err, 'Failed to unlink child'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Management</h1>
          <p className="text-muted-foreground">Audit unlinked students and manage family trees</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="unlinked"><Users className="h-4 w-4 mr-2" /> Unlinked Students</TabsTrigger>
          <TabsTrigger value="family-tree"><Link className="h-4 w-4 mr-2" /> Family Tree Search</TabsTrigger>
        </TabsList>

        {/* TAB A: Unlinked Students Audit */}
        <TabsContent value="unlinked" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Students Audit</CardTitle>
              <CardDescription>Search and link parents to students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 max-w-md">
                <Input
                  placeholder="Search student by name or admission number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Class & Section</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStudents ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : students.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found.</TableCell></TableRow>
                    ) : (
                      students.map((student: any) => (
                        <TableRow key={student._id || student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{(student.firstName?.[0] || student.name?.[0] || 'S').toUpperCase()}</AvatarFallback></Avatar>
                              <span className="font-medium">{student.name || `${student.firstName} ${student.lastName}`}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{student.email || '-'}</TableCell>
                          <TableCell>{student.admissionNumber || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {student.class?.name || student.currentEnrollment?.classId?.name || '-'} {student.section?.name || student.currentEnrollment?.sectionId?.name || ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="default" size="sm" onClick={() => { setSelectedStudentId(student._id || student.id); setProfileModalOpen(true); }}>
                              <Link className="h-4 w-4 mr-2" /> Link Parent
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
        </TabsContent>

        {/* TAB B: Family Tree Search */}
        <TabsContent value="family-tree" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Search & Parent List */}
            <div className="md:col-span-1 space-y-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><Search className="h-4 w-4" /> Find Parent</CardTitle>
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="mt-2"
                  />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {parentSearch.length < 3 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Type at least 3 characters to search for parents
                    </div>
                  ) : searchParentLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : searchedParents.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No parents found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchedParents.map((parent: any) => (
                        <div 
                          key={parent._id || parent.id} 
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedParent?._id === (parent._id || parent.id) ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedParent(parent)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">{(parent.firstName?.[0] || parent.name?.[0] || 'P').toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <div className="font-medium truncate">{parent.name || `${parent.firstName} ${parent.lastName}`}</div>
                              <div className="text-xs text-muted-foreground truncate">{parent.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Parent Details & Linked Children */}
            <div className="md:col-span-2">
              {!selectedParent ? (
                <Card className="h-[600px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Select a parent to view their family tree</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="bg-muted/30 border-b">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 shadow-sm border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary text-xl">
                            {(selectedParent.firstName?.[0] || selectedParent.name?.[0] || 'P').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl">{selectedParent.name || `${selectedParent.firstName} ${selectedParent.lastName}`}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {selectedParent.email}</span>
                            {selectedParent.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {selectedParent.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        Linked Children
                        <Badge variant="secondary" className="ml-2 rounded-full">
                          {parentStudentsData?.data?.count ?? parentStudentsData?.count ?? linkedStudents.length}
                        </Badge>
                      </h3>
                      
                      {parentStudentsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      ) : linkedStudents.length === 0 ? (
                        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                          <p className="text-muted-foreground">This parent has no linked children.</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {linkedStudents.map((student: any) => (
                            <div key={student._id || student.id} className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                  <AvatarFallback className="bg-secondary/10 text-secondary font-medium">
                                    {(student.firstName?.[0] || student.name?.[0] || 'S').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-base">{student.name || `${student.firstName} ${student.lastName}`}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium border">Adm: {student.admissionNumber || '-'}</span>
                                    <span>Class: {student.class?.name || student.currentEnrollment?.classId?.name || '-'}</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to unlink ${student.firstName} from this parent?`)) {
                                    unlinkChildMutation.mutate(student._id || student.id);
                                  }
                                }}
                                disabled={unlinkChildMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Unlink
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Shared Student Profile Modal for Linking */}
      <StudentProfileModal
        open={profileModalOpen}
        onOpenChange={(v) => setProfileModalOpen(v)}
        studentId={selectedStudentId}
      />
    </div>
  );
}
