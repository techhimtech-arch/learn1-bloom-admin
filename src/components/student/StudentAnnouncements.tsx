import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Paperclip, Search, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { announcementApi } from '@/services/api';

interface Announcement {
  id?: string;
  _id: string;
  title: string;
  content?: string;
  message?: string;
  type?: 'school' | 'class' | 'subject' | 'exam' | 'event' | string;
  priority?: 'high' | 'medium' | 'low' | string;
  postedBy?: string;
  createdBy?: { name: string };
  postedDate?: string;
  createdAt?: string;
  readStatus?: 'read' | 'unread' | string;
  attachment?: string;
  attachmentUrl?: string;
}

const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return colorMap[priority] || colorMap.low;
};

const getTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    school: '🏫',
    class: '📚',
    subject: '📝',
    exam: '📋',
    event: '🎉',
  };
  return iconMap[type] || '📢';
};

export const StudentAnnouncements = () => {
  const { user } = useAuth();
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch announcements relevant to student/parent
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements-portal', user?.id],
    queryFn: async () => {
      try {
        const params = {
          status: 'published',
          limit: 50,
        };
        
        // Add role-based filtering if backend supports it
        if (user?.role === 'student') {
          (params as any).targetAudience = 'student';
        } else if (user?.role === 'parent') {
          (params as any).targetAudience = 'parent';
        }
        
        const response = await announcementApi.getAll(params);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    let filtered = announcements;

    if (filter !== 'all') {
      filtered = filtered.filter(a => {
        const aType = (a.type || '').toLowerCase();
        return filter === 'unread' 
          ? a.readStatus?.toLowerCase() === 'unread' 
          : aType === filter.toLowerCase();
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        (a.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.content?.toLowerCase() || a.message?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, filter, searchTerm]);

  const unreadCount = announcements.filter(a => a.readStatus?.toLowerCase() === 'unread').length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unread Alert */}
      {unreadCount > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            You have {unreadCount} unread announcement(s)
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="exam">Exam</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements found
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map(announcement => {
            const postedBy = announcement.createdBy?.name || announcement.postedBy || 'Admin';
            const date = announcement.createdAt || announcement.postedDate || new Date().toISOString();
            const priority = (announcement.priority || 'medium').toLowerCase();
            const type = (announcement.type || 'general').toLowerCase();
            const isUnread = announcement.readStatus?.toLowerCase() === 'unread';
            
            return (
            <Card
              key={announcement._id}
              className={`hover:shadow-md transition-shadow ${
                isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{announcement.title}</h3>
                          {isUnread && (
                            <Badge className="bg-blue-500">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {announcement.content || announcement.message || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getPriorityColor(priority)}`}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="space-y-1">
                      <p>
                        <strong>By:</strong> {postedBy}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(date).toLocaleDateString()}
                      </p>
                    </div>
                    {(announcement.attachment || announcement.attachmentUrl) && (
                      <Button size="sm" variant="outline">
                        <Paperclip className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>

                  {priority === 'high' && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-xs">
                        This is an important announcement. Please read carefully.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })
        )}
      </div>
    </div>
  );
};
