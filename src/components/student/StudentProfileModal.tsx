import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { admissionApi, parentLinkingApi, userApi } from '@/pages/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { Users, UserPlus, Loader2, Link as LinkIcon, Trash2, Mail, Phone, MapPin, CalendarDays, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [parentSearch, setParentSearch] = useState('');
  
  // Quick Create Parent State
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newParent, setNewParent] = useState({ firstName: '', lastName: '', email: '', phone: '', password: 'password123' });

  const { data: studentRes, isLoading: studentLoading } = useQuery({
    queryKey: ['student-details', studentId],
    queryFn: () => admissionApi.getById(studentId!),
    enabled: !!studentId && open,
  });

  const { data: linkedParentsRes, isLoading: parentsLoading } = useQuery({
    queryKey: ['linked-parents', studentId],
    queryFn: () => parentLinkingApi.getLinkedParents(studentId!),
    enabled: !!studentId && open && activeTab === 'family',
  });

  const { data: searchRes, isLoading: searchLoading } = useQuery({
    queryKey: ['parents-search', parentSearch],
    queryFn: () => parentLinkingApi.searchParents({ search: parentSearch }),
    enabled: parentSearch.length >= 3 && open && activeTab === 'family',
  });

  const studentDetail = studentRes?.data?.data?.studentProfile || studentRes?.data?.data;
  const linkedParents = linkedParentsRes?.data || [];
  const searchedParents = searchRes?.data?.users || searchRes?.data || [];

  const linkMutation = useMutation({
    mutationFn: (parentId: string) => parentLinkingApi.linkParent(studentId!, parentId),
    onSuccess: (res) => {
      showApiSuccess(res, 'Parent linked successfully');
      queryClient.invalidateQueries({ queryKey: ['linked-parents'] });
      setParentSearch('');
    },
    onError: (err: any) => showApiError(err, 'Failed to link parent'),
  });

  const unlinkMutation = useMutation({
    mutationFn: (parentId: string) => parentLinkingApi.unlinkParent(studentId!, parentId),
    onSuccess: (res) => {
      showApiSuccess(res, 'Parent unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['linked-parents'] });
    },
    onError: (err: any) => showApiError(err, 'Failed to unlink parent'),
  });

  const createParentMutation = useMutation({
    mutationFn: () => userApi.create({ ...newParent, role: 'parent' }),
    onSuccess: async (res) => {
      showApiSuccess(res, 'Parent account created');
      const newUserId = res.data?.data?.user?._id || res.data?.data?._id;
      if (newUserId) {
        // Automatically link the newly created parent
        await linkMutation.mutateAsync(newUserId);
      }
      setShowQuickCreate(false);
      setNewParent({ firstName: '', lastName: '', email: '', phone: '', password: 'password123' });
    },
    onError: (err: any) => showApiError(err, 'Failed to create parent account'),
  });

  if (!studentId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {studentDetail?.firstName?.[0] || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl">{studentDetail?.firstName} {studentDetail?.lastName}</div>
              <DialogDescription className="mt-0">
                Admission No: <Badge variant="outline" className="mr-2">{studentDetail?.admissionNumber || 'N/A'}</Badge>
                Class: {studentDetail?.currentEnrollment?.classId?.name || '-'} {studentDetail?.currentEnrollment?.sectionId?.name || ''}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {studentLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview"><User className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="family"><Users className="h-4 w-4 mr-2" /> Family / Parents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-1">Personal Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Gender: <span className="text-foreground">{studentDetail?.gender || '-'}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> DOB: <span className="text-foreground">{studentDetail?.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString() : '-'}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Blood Group: <span className="text-foreground">{studentDetail?.bloodGroup || '-'}</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-1">Contact Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> Email: <span className="text-foreground">{studentDetail?.email || '-'}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> Phone: <span className="text-foreground">{studentDetail?.phone || '-'}</span></div>
                    <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5" /> Address: <span className="text-foreground">{studentDetail?.address || '-'}</span></div>
                  </div>
                </div>
                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-semibold border-b pb-1">Current Academic Status</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                    <div><span className="text-muted-foreground block text-xs">Status</span> <Badge variant={studentDetail?.status === 'completed' ? 'default' : 'secondary'}>{studentDetail?.status}</Badge></div>
                    <div><span className="text-muted-foreground block text-xs">Roll Number</span> {studentDetail?.currentEnrollment?.rollNumber || '-'}</div>
                    <div><span className="text-muted-foreground block text-xs">Academic Year</span> {studentDetail?.currentEnrollment?.academicYearId?.name || '-'}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="family" className="space-y-6 mt-4">
              {parentsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6">
                  {/* Linked Parents List */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">Linked Parents</h3>
                    {linkedParents.length === 0 ? (
                      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-center border-dashed border-2">
                        No parents linked to this student yet.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {linkedParents.map((parent: any) => (
                          <div key={parent._id || parent.id} className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary">{parent.firstName?.[0] || parent.name?.[0]}</AvatarFallback></Avatar>
                              <div>
                                <div className="font-medium text-sm">{parent.name || `${parent.firstName} ${parent.lastName}`}</div>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                  <span>{parent.email}</span>
                                  {parent.phone && <span>• {parent.phone}</span>}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => unlinkMutation.mutate(parent._id || parent.id)} disabled={unlinkMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Parent Section */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Add Parent</h3>
                    
                    {!showQuickCreate ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search existing parent by email, phone, or name..."
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        
                        {parentSearch.length >= 3 && (
                          <div className="space-y-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
                            {searchLoading ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>
                            ) : searchedParents.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2">No matching parents found.</p>
                                <Button variant="outline" size="sm" onClick={() => setShowQuickCreate(true)}>
                                  <UserPlus className="h-4 w-4 mr-2" /> Quick Create Parent
                                </Button>
                              </div>
                            ) : (
                              searchedParents.map((parent: any) => {
                                const isLinked = linkedParents.some((p: any) => (p._id || p.id) === (parent._id || parent.id));
                                return (
                                  <div key={parent._id || parent.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                    <div>
                                      <div className="font-medium text-sm">{parent.name || `${parent.firstName} ${parent.lastName}`}</div>
                                      <div className="text-xs text-muted-foreground">{parent.email}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={isLinked ? "secondary" : "default"}
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

                        {searchedParents.length > 0 && parentSearch.length >= 3 && (
                           <div className="pt-2 text-center">
                             <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setShowQuickCreate(true)}>
                               Don't see who you're looking for? Quick Create
                             </Button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" /> Quick Create Parent</h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowQuickCreate(false)}>Cancel</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">First Name *</Label>
                            <Input size={1} className="h-8 text-sm" value={newParent.firstName} onChange={e => setNewParent({...newParent, firstName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Last Name *</Label>
                            <Input size={1} className="h-8 text-sm" value={newParent.lastName} onChange={e => setNewParent({...newParent, lastName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email *</Label>
                            <Input size={1} type="email" className="h-8 text-sm" value={newParent.email} onChange={e => setNewParent({...newParent, email: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Phone</Label>
                            <Input size={1} className="h-8 text-sm" value={newParent.phone} onChange={e => setNewParent({...newParent, phone: e.target.value})} />
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => createParentMutation.mutate()}
                          disabled={createParentMutation.isPending || !newParent.firstName || !newParent.lastName || !newParent.email}
                        >
                          {createParentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                          Create & Link Parent
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
