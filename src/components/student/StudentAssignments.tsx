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
import { studentAssignmentApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AssignmentSubmissionDialog } from './AssignmentSubmissionDialog';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: {
    id: string;
    name: string;
    code: string;
  };
  classId: {
    id: string;
    name: string;
  };
  sectionId: {
    id: string;
    name: string;
  };
  teacherId: {
    id: string;
    name: string;
    email: string;
  };
  dueDate: string;
  maxMarks: number;
  status: string;
  attachments?: Array<{
    filename: string;
    url: string;
  }>;
  createdAt: string;
  submissionStatus?: 'pending' | 'submitted' | 'late';
  marks?: { obtained?: number; total?: number };
}

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await studentAssignmentApi.getAll({
        status: 'PUBLISHED',
        sortBy: 'dueDate',
        sortOrder: 'asc'
      });
      
      if (response.data.success) {
        setAssignments(response.data.data || []);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch assignments",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = assignments;

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.submissionStatus === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subjectId.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAssignmentSubmit = async (assignmentId: string, submissionData: any) => {
    try {
      setSubmitting(true);
      const response = await studentAssignmentApi.submit(assignmentId, submissionData);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Assignment submitted successfully",
        });
        // Refresh assignments to update status
        fetchAssignments();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to submit assignment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
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
                      {getStatusBadge(assignment.submissionStatus || 'pending')}
                    </div>

                    <div className="grid gap-2 grid-cols-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Subject</p>
                        <p className="font-semibold">{assignment.subjectId.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Assigned By</p>
                        <p className="font-semibold">{assignment.teacherId.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Due Date</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Max Marks</p>
                        <p className="font-semibold">{assignment.maxMarks}</p>
                      </div>
                      {(assignment.submissionStatus === 'pending' || !assignment.submissionStatus) && (
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

                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-2">Attachments</p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.attachments.map((attachment, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {attachment.filename}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(assignment.submissionStatus === 'pending' || !assignment.submissionStatus) && (
                      <div className="flex gap-2 pt-2">
                        <AssignmentSubmissionDialog
                          assignment={assignment}
                          onSubmit={handleAssignmentSubmit}
                          submitting={submitting}
                        />
                      </div>
                    )}

                    {isOverdue && (assignment.submissionStatus === 'pending' || !assignment.submissionStatus) && (
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
