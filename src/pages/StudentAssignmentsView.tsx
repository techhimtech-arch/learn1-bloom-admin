import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Upload,
  Eye,
  Download,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { studentPortalApi, studentAssignmentApi } from '@/services/api';
import { format, isPast } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  assignedDate: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  marks?: { obtained?: number; total?: number };
  files?: Array<{ url: string; name: string }>;
  submissionDetails?: {
    submittedDate: string;
    submittedFile?: string;
  };
}

const StudentAssignmentsView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(
    null
  );

  const {
    data: assignments,
    isLoading,
    error,
  } = useQuery<Assignment[]>({
    queryKey: ['student-assignments', filterStatus],
    queryFn: async () => {
      try {
        const response = await studentAssignmentApi.getAll({
          status: 'PUBLISHED',
          sortBy: 'dueDate',
          sortOrder: 'asc'
        });
        
        if (response.data.success) {
          const assignments = response.data.data || [];
          
          // Transform the API response to match the expected interface
          const transformedAssignments = assignments.map((assignment: any) => ({
            _id: assignment.id,
            id: assignment.id,
            title: assignment.title,
            subject: assignment.subjectId.name,
            description: assignment.description,
            dueDate: assignment.dueDate,
            assignedBy: assignment.teacherId.name,
            assignedDate: assignment.createdAt,
            status: assignment.submissionStatus || 'pending',
            marks: assignment.marks,
            files: assignment.attachments?.map((att: any) => ({
              url: att.url,
              name: att.filename
            })),
            submissionDetails: assignment.submissionDetails
          }));
          
          if (filterStatus === 'all') return transformedAssignments;
          return transformedAssignments.filter(a => a.status === filterStatus);
        }
        return [];
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
        return [];
      }
    },
  });

  const filteredAssignments = (assignments || []).filter((assignment) =>
    assignment.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'submitted':
        return <Upload className="h-4 w-4" />;
      case 'late':
        return <AlertCircle className="h-4 w-4" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue =
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 3 && daysUntilDue > 0;
  };

  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate));
  };

  const stats = {
    total: assignments?.length || 0,
    pending: assignments?.filter((a) => a.status === 'pending').length || 0,
    submitted:
      assignments?.filter((a) => a.status === 'submitted').length || 0,
    graded: assignments?.filter((a) => a.status === 'graded').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and submit your assignments
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600">
                {stats.pending}
              </span>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {stats.submitted}
              </span>
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {stats.graded}
              </span>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load assignments. Please try again later.
          </AlertDescription>
        </Alert>
      ) : filteredAssignments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Assignments</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow
                    key={assignment._id}
                    className={
                      assignment.status === 'pending' && isOverdue(assignment.dueDate)
                        ? 'bg-red-50'
                        : isDueSoon(assignment.dueDate)
                        ? 'bg-yellow-50'
                        : ''
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold line-clamp-1">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {assignment.assignedBy}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(assignment.dueDate), 'dd MMM yyyy')}
                      </div>
                      {isOverdue(assignment.dueDate) && assignment.status === 'pending' && (
                        <p className="text-xs text-red-600 font-semibold">
                          OVERDUE
                        </p>
                      )}
                      {isDueSoon(assignment.dueDate) && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Due Soon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(assignment.status)}
                          {assignment.status
                            .charAt(0)
                            .toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.marks ? (
                        <span>
                          {assignment.marks.obtained}/{assignment.marks.total}
                        </span>
                      ) : assignment.status === 'graded' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Not graded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{assignment.title}</DialogTitle>
                            <DialogDescription>
                              {assignment.subject} - Due{' '}
                              {format(new Date(assignment.dueDate), 'dd MMM yyyy')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Description</h3>
                              <p className="text-sm text-muted-foreground">
                                {assignment.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">
                                  Status
                                </p>
                                <Badge className={getStatusColor(assignment.status)}>
                                  {assignment.status
                                    .charAt(0)
                                    .toUpperCase() +
                                    assignment.status.slice(1)}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">
                                  Assigned By
                                </p>
                                <p className="font-medium">
                                  {assignment.assignedBy}
                                </p>
                              </div>
                            </div>

                            {assignment.marks && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">
                                  Marks
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  {assignment.marks.obtained}/{assignment.marks.total}
                                </p>
                              </div>
                            )}

                            {assignment.files && assignment.files.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                                  Assignment Files
                                </p>
                                <div className="space-y-1">
                                  {assignment.files.map((file, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start gap-2"
                                      onClick={() =>
                                        window.open(file.url, '_blank')
                                      }
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      {file.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {assignment.status === 'pending' && (
                              <Button
                                className="w-full"
                                onClick={() =>
                                  navigate(
                                    `/assignments/${assignment._id}/submit`
                                  )
                                }
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Assignment
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm
              ? 'No assignments match your search.'
              : 'No assignments assigned yet.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default StudentAssignmentsView;
