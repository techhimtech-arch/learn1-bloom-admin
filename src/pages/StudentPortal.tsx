import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAssignments } from '@/components/student/StudentAssignments';
import { StudentExamsResults } from '@/components/student/StudentExamsResults';
import { StudentAnnouncements } from '@/components/student/StudentAnnouncements';
import { StudentAttendanceProgress } from '@/components/student/StudentAttendanceProgress';
import { FileText, Calendar, Bell, ClipboardCheck, BookOpen, DollarSign, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const quickAccessItems = [
    { icon: FileText, label: 'Assignments', id: 'assignments', color: 'bg-blue-100 text-blue-600' },
    { icon: Calendar, label: 'Exams & Results', id: 'exams', color: 'bg-purple-100 text-purple-600' },
    { icon: Bell, label: 'Announcements', id: 'announcements', color: 'bg-orange-100 text-orange-600' },
    { icon: ClipboardCheck, label: 'Attendance', id: 'attendance', color: 'bg-green-100 text-green-600' },
    { icon: BookOpen, label: 'Study Materials', id: 'materials', color: 'bg-indigo-100 text-indigo-600' },
    { icon: DollarSign, label: 'Fee Management', id: 'fees', color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your academic journey and stay updated
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {quickAccessItems.map(item => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24 "
              onClick={() => setActiveTab(item.id)}
            >
              <div className={`p-2 rounded-lg ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-center">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="announcements">News</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="more">More</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <span className="text-lg font-bold text-green-600">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Assignments</span>
                  <span className="text-lg font-bold text-orange-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Unread Announcements</span>
                  <span className="text-lg font-bold text-blue-600">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Upcoming Exams</span>
                  <span className="text-lg font-bold text-purple-600">4</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current GPA</span>
                  <span className="text-lg font-bold">3.8/4.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall Grade</span>
                  <span className="text-lg font-bold text-green-600">A</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Class Rank</span>
                  <span className="text-lg font-bold">5th</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Review</span>
                  <span className="text-lg font-bold">Apr 20</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                📝 Submit pending Mathematics assignment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📚 Review Chapter 5 for upcoming Science test
              </Button>
              <Button variant="outline" className="w-full justify-start">
                💰 Pay remaining school fees (₹5,000)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <StudentAssignments />
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <StudentExamsResults />
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <StudentAnnouncements />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <StudentAttendanceProgress />
        </TabsContent>

        {/* More Tab */}
        <TabsContent value="more" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access notes, study guides, and learning resources
                </p>
                <Button size="sm" variant="outline" className="w-full">View Materials</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View fee structure and make online payments
                </p>
                <Button size="sm" variant="outline" className="w-full">Pay Fees</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Certificate Download</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Download transfer certificate and achievement awards
                </p>
                <Button size="sm" variant="outline" className="w-full">Download</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Library Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Check issued books, dues, and reserve new books
                </p>
                <Button size="sm" variant="outline" className="w-full">Library Info</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Events & Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View upcoming events and enroll in activities
                </p>
                <Button size="sm" variant="outline" className="w-full">View Events</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View and update personal information
                </p>
                <Button size="sm" variant="outline" className="w-full">View Profile</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentPortal;
