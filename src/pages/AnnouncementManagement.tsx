import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, Send, Calendar, AlertTriangle, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { announcementApi, classApi, sectionApi } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'academic' | 'emergency' | 'event';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetType: 'all' | 'class' | 'section' | 'role';
  targetIds?: string[];
  publishDate: string;
  expiryDate: string;
  status: 'draft' | 'published';
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

interface AnnouncementFilters {
  search: string;
  type: string;
  priority: string;
  status: string;
  classId: string;
  sectionId: string;
}

export default function AnnouncementManagement() {
  const [filters, setFilters] = useState<AnnouncementFilters>({
    search: '',
    type: '',
    priority: '',
    status: '',
    classId: '',
    sectionId: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const queryClient = useQueryClient();

  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    refetch,
  } = useQuery({
    queryKey: ['announcements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);

      const response = await announcementApi.getAll(Object.fromEntries(params));
      return response.data;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => {
      toast.success('Announcement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDeletingAnnouncement(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => announcementApi.publish(id),
    onSuccess: () => {
      toast.success('Announcement published successfully');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish announcement');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => announcementApi.unpublish(id),
    onSuccess: () => {
      toast.success('Announcement unpublished successfully');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish announcement');
    },
  });

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
  };

  const confirmDelete = () => {
    if (deletingAnnouncement) {
      deleteMutation.mutate(deletingAnnouncement.id);
    }
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleUnpublish = (id: string) => {
    unpublishMutation.mutate(id);
  };

  const announcements = announcementsData?.data || [];
  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-blue-100 text-blue-800',
      'academic': 'bg-purple-100 text-purple-800',
      'emergency': 'bg-red-100 text-red-800',
      'event': 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage school announcements and communications
          </p>
        </div>
        <PermissionGuard permission="create_announcement">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </PermissionGuard>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sectionId} onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sections</SelectItem>
                {sections.map((section: any) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Announcements ({announcements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcementsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No announcements found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.type || filters.priority || filters.status || filters.classId || filters.sectionId
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first announcement'}
              </p>
              <PermissionGuard permission="create_announcement">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Publish Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement: Announcement) => (
                    <TableRow key={announcement.id} className={isExpired(announcement.expiryDate) ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{announcement.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {announcement.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {announcement.targetType === 'all' ? (
                            <span className="font-medium">All Users</span>
                          ) : (
                            <span>{announcement.targetIds?.length || 0} target(s)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(announcement.publishDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isExpired(announcement.expiryDate) ? 'text-red-600' : ''}>
                            {format(new Date(announcement.expiryDate), 'MMM dd, yyyy')}
                          </span>
                          {isExpired(announcement.expiryDate) && (
                            <Badge variant="destructive" className="ml-2">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(announcement.status)}>
                          {announcement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="view_announcement">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: View announcement modal */}}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="edit_announcement">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>

                          {announcement.status === 'draft' ? (
                            <PermissionGuard permission="publish_announcement">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublish(announcement.id)}
                                disabled={publishMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                          ) : (
                            <PermissionGuard permission="publish_announcement">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnpublish(announcement.id)}
                                disabled={unpublishMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                          )}

                          <PermissionGuard permission="delete_announcement">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(announcement)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          classes={classes}
          sections={sections}
          onClose={() => {
            setShowForm(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingAnnouncement(null);
          }}
        />
      )}
    </div>
  );
}
