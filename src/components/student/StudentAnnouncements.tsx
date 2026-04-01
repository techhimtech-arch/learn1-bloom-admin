import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Paperclip, Search, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'school' | 'class' | 'subject' | 'exam' | 'event';
  priority: 'high' | 'medium' | 'low';
  postedBy: string;
  postedDate: string;
  readStatus: 'read' | 'unread';
  attachment?: string;
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call
    setAnnouncements([
      {
        _id: '1',
        title: 'School Annual Day Celebration',
        content: 'The annual day celebration will be held on April 20, 2026. All students are expected to participate. Rehearsals will start from next week.',
        type: 'event',
        priority: 'high',
        postedBy: 'Principal',
        postedDate: '2026-04-01',
        readStatus: 'unread',
      },
      {
        _id: '2',
        title: 'Mid-Term Exam Schedule Released',
        content: 'The mid-term exam schedule for all classes has been released. Please check the notice board for details.',
        type: 'exam',
        priority: 'high',
        postedBy: 'Academic Department',
        postedDate: '2026-04-02',
        readStatus: 'unread',
      },
      {
        _id: '3',
        title: 'Class 10 Mathematics Doubt Session',
        content: 'A doubt clearing session will be conducted on Saturday at 10:00 AM. Bring your questions related to Chapter 5.',
        type: 'class',
        priority: 'medium',
        postedBy: 'Mr. Sharma',
        postedDate: '2026-03-28',
        readStatus: 'read',
      },
      {
        _id: '4',
        title: 'Holiday Notice - Holi Celebration',
        content: 'School will remain closed from March 25 to March 27 for Holi celebration.',
        type: 'school',
        priority: 'medium',
        postedBy: 'Admin',
        postedDate: '2026-03-20',
        readStatus: 'read',
      },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = announcements;

    if (filter !== 'all') {
      filtered = filtered.filter(a =>
        filter === 'unread' ? a.readStatus === 'unread' : a.type === filter
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, filter, searchTerm]);

  const unreadCount = announcements.filter(a => a.readStatus === 'unread').length;

  if (loading) {
    return <Skeleton className="h-96" />;
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
          filteredAnnouncements.map(announcement => (
            <Card
              key={announcement._id}
              className={`hover:shadow-md transition-shadow ${
                announcement.readStatus === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{announcement.title}</h3>
                          {announcement.readStatus === 'unread' && (
                            <Badge className="bg-blue-500">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="space-y-1">
                      <p>
                        <strong>By:</strong> {announcement.postedBy}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(announcement.postedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {announcement.attachment && (
                      <Button size="sm" variant="outline">
                        <Paperclip className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>

                  {announcement.priority === 'high' && (
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
          ))
        )}
      </div>
    </div>
  );
};
