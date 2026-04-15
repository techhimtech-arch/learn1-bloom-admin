import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  Bell,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { announcementApi, assignmentApi, notificationApi } from '@/services/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  submissionStatus?: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    pendingCount: number;
  };
}

interface Notification {
  id: string;
  title: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function AdminDashboardWidgets() {
  const { user } = useAuth();

  const { data: announcementsData } = useQuery({
    queryKey: ['latest-announcements'],
    queryFn: async () => {
      const response = await announcementApi.getAll({ limit: 5, status: 'published' });
      return response.data;
    },
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['pending-assignments'],
    queryFn: async () => {
      const response = await assignmentApi.getAll({ limit: 5, status: 'published' });
      return response.data;
    },
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await notificationApi.getAll({ unreadOnly: true, limit: 5 });
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 24000000, // Consider data fresh for 4 minutes
    gcTime: 60000000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const announcements = announcementsData?.data || [];
  const assignments = assignmentsData?.data || [];
  const notifications = notificationsData?.data || [];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getAssignmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-green-100 text-green-800',
      'closed': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNotificationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'info': 'bg-blue-100 text-blue-800',
      'success': 'bg-green-100 text-green-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Latest Announcements */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-4">
              <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement: Announcement) => (
                <div key={announcement.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{announcement.title}</h4>
                    <Badge className={getPriorityColor(announcement.priority)} variant="outline">
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
              {announcements.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/announcements">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Assignments */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment: Assignment) => (
                <div key={assignment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{assignment.title}</h4>
                    <Badge className={getAssignmentStatusColor(assignment.status)} variant="outline">
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(assignment.dueDate), 'MMM dd')}</span>
                  </div>
                  {assignment.submissionStatus && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span>{assignment.submissionStatus.submittedCount}/{assignment.submissionStatus.totalStudents} submitted</span>
                        <span>{assignment.submissionStatus.pendingCount} pending grading</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {assignments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/assignments">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unread Notifications */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Unread Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification: Notification) => (
                <div key={notification.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{notification.title}</h4>
                    <Badge className={getNotificationTypeColor(notification.type)} variant="outline">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              ))}
              {notifications.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/notifications">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeacherDashboardWidgets() {
  const { user } = useAuth();

  const { data: assignmentsData } = useQuery({
    queryKey: ['teacher-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await assignmentApi.getAll({ 
        teacherId: user.id, 
        status: 'published',
        limit: 5 
      });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const assignments = assignmentsData?.data || [];

  const getSubmissionProgress = (submissionStatus?: any) => {
    if (!submissionStatus) return 0;
    const percentage = submissionStatus.totalStudents > 0 
      ? (submissionStatus.gradedCount / submissionStatus.totalStudents) * 100 
      : 0;
    return percentage;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Published Assignments */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Published Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No published assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment: Assignment) => (
                <div key={assignment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{assignment.title}</h4>
                    <Badge className="bg-green-100 text-green-800" variant="outline">
                      Published
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(assignment.dueDate), 'MMM dd')}</span>
                  </div>
                  {assignment.submissionStatus && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span>{assignment.submissionStatus.submittedCount}/{assignment.submissionStatus.totalStudents} submitted</span>
                        <span>{assignment.submissionStatus.pendingCount} pending grading</span>
                      </div>
                      <div className="mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${getSubmissionProgress(assignment.submissionStatus)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium ml-2">
                          {getSubmissionProgress(assignment.submissionStatus)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {assignments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/assignments">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Pending Grading */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Grading
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending grading</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments
                .filter(a => a.submissionStatus && a.submissionStatus.pendingCount > 0)
                .slice(0, 3)
                .map((assignment: Assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{assignment.title}</h4>
                      <Badge className="bg-orange-100 text-orange-800" variant="outline">
                        {assignment.submissionStatus?.pendingCount} pending
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {format(new Date(assignment.dueDate), 'MMM dd')}</span>
                    </div>
                  </div>
                ))}
              {assignments.filter(a => a.submissionStatus && a.submissionStatus.pendingCount > 0).length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
              {assignments.filter(a => a.submissionStatus && a.submissionStatus.pendingCount > 0).length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/assignments">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentDashboardWidgets() {
  const { user } = useAuth();

  const { data: announcementsData } = useQuery({
    queryKey: ['student-announcements', user?.id],
    queryFn: async () => {
      const response = await announcementApi.getAll({ 
        limit: 5, 
        status: 'published',
        targetType: 'all' 
      });
      return response.data;
    },
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['student-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await assignmentApi.getAll({ 
        studentId: user.id, 
        status: 'published',
        limit: 5 
      });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['student-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await notificationApi.getAll({ 
        unreadOnly: true, 
        limit: 5 
      });
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 240000, // Consider data fresh for 4 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const announcements = announcementsData?.data || [];
  const assignments = assignmentsData?.data || [];
  const notifications = notificationsData?.data || [];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getAssignmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-green-100 text-green-800',
      'closed': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Latest Announcements */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-4">
              <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement: Announcement) => (
                <div key={announcement.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{announcement.title}</h4>
                    <Badge className={getPriorityColor(announcement.priority)} variant="outline">
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
              {announcements.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/announcements">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Assignments */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment: Assignment) => (
                <div key={assignment.id} className={`p-3 border rounded-lg ${isOverdue(assignment.dueDate) ? 'bg-red-50 border-red-200' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{assignment.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getAssignmentStatusColor(assignment.status)} variant="outline">
                        {assignment.status}
                      </Badge>
                      {isOverdue(assignment.dueDate) && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(assignment.dueDate), 'MMM dd')}</span>
                  </div>
                </div>
              ))}
              {assignments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/assignments">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unread Notifications */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification: Notification) => (
                <div key={notification.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{notification.title}</h4>
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              ))}
              {notifications.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/notifications">View All</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
