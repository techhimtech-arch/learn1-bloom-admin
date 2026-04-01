import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Paperclip, Search, AlertTriangle, Info, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { announcementApi } from '@/services/api';
import { format } from 'date-fns';

interface Announcement {
  id?: string;
  _id?: string;
  title: string;
  content?: string;
  message?: string;
  type?: string;
  priority?: string;
  postedBy?: string;
  createdBy?: { name: string };
  postedDate?: string;
  createdAt?: string;
  readStatus?: string;
  attachment?: string;
  attachmentUrl?: string;
  targetAudience?: string[];
  targetIds?: string[];
  status?: string;
}

const getPriorityColor = (priority?: string) => {
  const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return colorMap[priority?.toLowerCase() || 'low'] || colorMap.low;
};

const getTypeIcon = (type?: string) => {
  const iconMap: Record<string, string> = {
    school: '🏫',
    class: '📚',
    subject: '📝',
    exam: '📋',
    event: '🎉',
    general: '📢',
  };
  return iconMap[type?.toLowerCase() || 'general'] || '📢';
};

export const StudentParentAnnouncements = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements relevant to student/parent
  const {
    data: announcements = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['announcements-student-parent', user?.id],
    queryFn: async () => {
      try {
        // API will filter based on user's class/section
        const params = new URLSearchParams();
        if (user?.role === 'student') {
          params.append('targetAudience', 'student');
        } else if (user?.role === 'parent') {
          params.append('targetAudience', 'parent');
        }

        const response = await announcementApi.getAll(Object.fromEntries(params));
        // Handle nested data structure
        const data = response.data;
        return (Array.isArray(data) ? data : data?.data || []) as Announcement[];
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Filter announcements based on search and type
  useEffect(() => {
    // Ensure announcements is always an array
    const announcementsArray = Array.isArray(announcements) ? announcements : [];
    let filtered = announcementsArray;

    if (filter !== 'all') {
      filtered = filtered.filter((a: Announcement) => a.type?.toLowerCase() === filter.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (a: Announcement) =>
          a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, filter, searchTerm]);

  const unreadCount = (Array.isArray(announcements) ? announcements : []).filter((a: Announcement) => a.readStatus === 'unread').length;
  const highPriorityCount = (Array.isArray(announcements) ? announcements : []).filter((a: Announcement) => a.priority?.toLowerCase() === 'high').length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with school announcements</p>
      </div>

      {/* Alerts */}
      {unreadCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have {unreadCount} new announcement{unreadCount !== 1 ? 's' : ''}.
          </AlertDescription>
        </Alert>
      )}

      {highPriorityCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {highPriorityCount} high-priority announcement{highPriorityCount !== 1 ? 's' : ''} require{highPriorityCount === 1 ? 's' : ''} your attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="school"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              School 🏫
            </TabsTrigger>
            <TabsTrigger
              value="class"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Class 📚
            </TabsTrigger>
            <TabsTrigger
              value="exam"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Exam 📋
            </TabsTrigger>
            <TabsTrigger
              value="event"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Event 🎉
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Announcements Cards */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement: Announcement) => {
            const date = announcement.createdAt || announcement.postedDate || new Date().toISOString();
            const postedBy = announcement.createdBy?.name || announcement.postedBy || 'Admin';
            const priority = announcement.priority?.toLowerCase() || 'medium';
            const isUnread = announcement.readStatus === 'unread';

            return (
              <Card
                key={announcement.id || announcement._id}
                className={`overflow-hidden hover:shadow-md transition-all ${
                  isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg line-clamp-2 text-foreground">
                            {announcement.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>📝 {postedBy}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      {isUnread && (
                        <Badge className="bg-blue-600 text-white">New</Badge>
                      )}
                      <Badge className={getPriorityColor(priority)}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Content */}
                  <p className="text-sm text-foreground line-clamp-3">
                    {announcement.content || announcement.message || 'No description provided'}
                  </p>

                  {/* Attachment */}
                  {(announcement.attachment || announcement.attachmentUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const url = announcement.attachmentUrl || announcement.attachment;
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                      Download Attachment
                    </Button>
                  )}

                  {/* Read more hint */}
                  <p className="text-xs text-muted-foreground">
                    Click to read full announcement...
                  </p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-2">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground font-medium">No announcements found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'Check back later for new announcements'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Section */}
      {announcements.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Note
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
            <p>
              You're seeing announcements relevant to your {user?.role === 'parent' ? 'child\'s class and section' : 'class and section'}. 
              High-priority announcements are important and should be reviewed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentParentAnnouncements;
