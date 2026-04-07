import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Search,
  Filter,
  MapPin,
  Eye,
  X,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { studentPortalApi } from '@/services/api';
import { format, isPast } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

interface Announcement {
  _id: string;
  title: string;
  description: string;
  content?: string;
  type: 'general' | 'class' | 'urgent' | 'event';
  priority: 'low' | 'medium' | 'high';
  audience?: string;
  publishedDate: string;
  expiryDate?: string;
  createdBy?: string;
  attachments?: Array<{ url: string; name: string }>;
  isRead?: boolean;
}

const StudentAnnouncementsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const {
    data: announcements,
    isLoading,
    error,
  } = useQuery<Announcement[]>({
    queryKey: ['student-announcements'],
    queryFn: async () => {
      try {
        const response = await studentPortalApi.getAnnouncements();
        return response.data?.data || [];
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        return [];
      }
    },
  });

  // Filter announcements
  const filteredAnnouncements = (announcements || []).filter((announcement) => {
    const matchesSearch = announcement.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' || announcement.type === filterType;
    const matchesPriority =
      filterPriority === 'all' || announcement.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'class':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isPast(new Date(expiryDate));
  };

  const stats = {
    total: announcements?.length || 0,
    unread: announcements?.filter((a) => !a.isRead).length || 0,
    urgent: announcements?.filter((a) => a.priority === 'high').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with school notices and important announcements
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.total}</span>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600">
                {stats.unread}
              </span>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">
                {stats.urgent}
              </span>
              <Alert className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert className="border-red-200 bg-red-50">
          <Alert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load announcements. Please try again later.
          </AlertDescription>
        </Alert>
      ) : filteredAnnouncements.length > 0 ? (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              className={`hover:shadow-md transition-shadow ${
                announcement.isRead ? '' : 'border-l-4 border-blue-500'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={getTypeColor(announcement.type)}>
                        {announcement.type
                          .charAt(0)
                          .toUpperCase() + announcement.type.slice(1)}
                      </Badge>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority
                          .charAt(0)
                          .toUpperCase() + announcement.priority.slice(1)}{' '}
                        Priority
                      </Badge>
                      {isExpired(announcement.expiryDate) && (
                        <Badge variant="outline" className="bg-gray-100">
                          Expired
                        </Badge>
                      )}
                      {!announcement.isRead && (
                        <Badge className="bg-blue-500">New</Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                      {announcement.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {announcement.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(announcement.publishedDate), 'dd MMM yyyy')}
                      </div>
                      {announcement.createdBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {announcement.createdBy}
                        </div>
                      )}
                      {announcement.attachments &&
                        announcement.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {announcement.attachments.length} file
                            {announcement.attachments.length !== 1 ? 's' : ''}
                          </div>
                        )}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 flex-shrink-0"
                        onClick={() => setSelectedAnnouncement(announcement)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Read</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl">
                              {selectedAnnouncement?.title}
                            </DialogTitle>
                            <DialogDescription className="mt-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  className={getTypeColor(
                                    selectedAnnouncement?.type || 'general'
                                  )}
                                >
                                  {selectedAnnouncement?.type
                                    ?.charAt(0)
                                    .toUpperCase() +
                                    selectedAnnouncement?.type?.slice(1)}
                                </Badge>
                                <Badge
                                  className={getPriorityColor(
                                    selectedAnnouncement?.priority || 'low'
                                  )}
                                >
                                  {selectedAnnouncement?.priority
                                    ?.charAt(0)
                                    .toUpperCase() +
                                    selectedAnnouncement?.priority?.slice(1)}
                                </Badge>
                              </div>
                            </DialogDescription>
                          </div>
                          <DialogClose />
                        </div>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Published:{' '}
                            {format(
                              new Date(
                                selectedAnnouncement?.publishedDate || new Date()
                              ),
                              'dd MMM yyyy, hh:mm a'
                            )}
                          </div>
                          {selectedAnnouncement?.expiryDate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Expires:{' '}
                              {format(
                                new Date(selectedAnnouncement.expiryDate),
                                'dd MMM yyyy'
                              )}
                            </div>
                          )}
                          {selectedAnnouncement?.createdBy && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              Posted by: {selectedAnnouncement.createdBy}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedAnnouncement?.description}
                          </p>
                        </div>

                        {selectedAnnouncement?.content && (
                          <div>
                            <h4 className="font-semibold mb-2">Details</h4>
                            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                              {selectedAnnouncement.content}
                            </div>
                          </div>
                        )}

                        {selectedAnnouncement?.attachments &&
                          selectedAnnouncement.attachments.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">
                                Attachments
                              </h4>
                              <div className="space-y-2">
                                {selectedAnnouncement.attachments.map(
                                  (file, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start gap-2"
                                      onClick={() =>
                                        window.open(file.url, '_blank')
                                      }
                                    >
                                      <FileText className="h-4 w-4" />
                                      {file.name}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm || filterType !== 'all' || filterPriority !== 'all'
              ? 'No announcements match your search criteria.'
              : 'No announcements available at this time.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default StudentAnnouncementsView;
