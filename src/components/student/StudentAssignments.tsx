import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Upload, Calendar, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  submissionStatus: 'pending' | 'submitted' | 'late';
  marks?: { obtained?: number; total?: number };
}

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call
    setAssignments([
      {
        _id: '1',
        title: 'Mathematics Chapter 5 Exercise',
        subject: 'Mathematics',
        description: 'Solve all problems from exercise 5.1 to 5.5',
        dueDate: '2026-04-15',
        assignedBy: 'Mr. Sharma',
        submissionStatus: 'pending',
      },
      {
        _id: '2',
        title: 'English Essay on Nature',
        subject: 'English',
        description: 'Write an essay of 500 words on "Importance of Nature"',
        dueDate: '2026-04-10',
        assignedBy: 'Ms. Gupta',
        submissionStatus: 'submitted',
        marks: { obtained: 18, total: 20 },
      },
      {
        _id: '3',
        title: 'Science Project',
        subject: 'Science',
        description: 'Create a working model of solar system',
        dueDate: '2026-04-12',
        assignedBy: 'Dr. Patel',
        submissionStatus: 'late',
      },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = assignments;

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.submissionStatus === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  }, [assignments, filter, searchTerm]);

  const pendingCount = assignments.filter(a => a.submissionStatus === 'pending').length;
  const submittedCount = assignments.filter(a => a.submissionStatus === 'submitted').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500">Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-green-500">Submitted</Badge>;
      case 'late':
        return <Badge className="bg-red-500">Late</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-green-600">{submittedCount}</p>
              <p className="text-sm text-muted-foreground">Submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold">{assignments.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="late">Late</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No assignments found
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const daysLeft = getDaysRemaining(assignment.dueDate);
            const isOverdue = assignment.submissionStatus === 'late' || (daysLeft < 0 && assignment.submissionStatus === 'pending');

            return (
              <Card key={assignment._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{assignment.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      </div>
                      {getStatusBadge(assignment.submissionStatus)}
                    </div>

                    <div className="grid gap-2 grid-cols-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Subject</p>
                        <p className="font-semibold">{assignment.subject}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Assigned By</p>
                        <p className="font-semibold">{assignment.assignedBy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Due Date</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      {assignment.submissionStatus === 'pending' && (
                        <div>
                          <p className="text-muted-foreground text-xs">Days Remaining</p>
                          <p className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                            <Clock className="h-4 w-4" />
                            {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days`}
                          </p>
                        </div>
                      )}
                      {assignment.marks && (
                        <div>
                          <p className="text-muted-foreground text-xs">Marks</p>
                          <p className="font-semibold">{assignment.marks.obtained}/{assignment.marks.total}</p>
                        </div>
                      )}
                    </div>

                    {assignment.submissionStatus === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit Assignment</DialogTitle>
                              <DialogDescription>
                                Upload your assignment file for: {assignment.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input type="file" />
                              <Button className="w-full">Submit</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}

                    {isOverdue && assignment.submissionStatus === 'pending' && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-xs">
                          This assignment is overdue. Late submission may result in marked reduction.
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
