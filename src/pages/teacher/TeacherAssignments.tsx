import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Plus,
  Edit,
  Eye,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { teacherApi } from '@/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { format } from 'date-fns';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subjectId: { _id: string; name: string };
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  dueDate: string;
  totalMarks: number;
  status: 'draft' | 'published' | 'closed';
  submissionCount: number;
  totalStudents: number;
  attachments?: Array<{
    filename: string;
    originalName: string;
    url: string;
  }>;
}

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
}

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  assignmentId: string;
  submittedAt: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    url: string;
  }>;
  grade?: string;
  remarks?: string;
  status: 'submitted' | 'graded';
}

const TeacherAssignments = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: 100,
    instructions: ''
  });

  // Get teacher classes and subjects
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherApi.getClasses(),
    staleTime: 5 * 60 * 1000,
  });

  // Get assignments for teacher
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['teacher-assignments', selectedClass],
    queryFn: () => {
      // You'll need to add this API endpoint
      return teacherApi.getAssignments({ classId: selectedClass });
    },
    enabled: !!selectedClass,
    staleTime: 3 * 60 * 1000,
  });

  // Get submissions for selected assignment
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['assignment-submissions', selectedAssignment],
    queryFn: () => {
      // You'll need to add this API endpoint
      return teacherApi.getAssignmentSubmissions(selectedAssignment);
    },
    enabled: !!selectedAssignment,
    staleTime: 2 * 60 * 1000,
  });

  const classes = classesData?.data?.subjectAssignments as ClassAssignment[] || [];
  const assignments = assignmentsData?.data?.data as Assignment[] || [];
  const submissions = submissionsData?.data?.data as Submission[] || [];

  // Get unique classes for dropdown
  const uniqueClasses = Array.from(
    new Map(classes.map(cls => [cls.classId._id, cls.classId])).values()
  );

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => {
      // You'll need to add this API endpoint
      return teacherApi.createAssignment(data);
    },
    onSuccess: () => {
      showApiSuccess(null, 'Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setCreateDialogOpen(false);
      resetAssignmentForm();
    },
    onError: (error) => showApiError(error, 'Failed to create assignment'),
  });

  // Grade submission mutation
  const gradeSubmissionMutation = useMutation({
    mutationFn: (data: { submissionId: string; grade: string; remarks: string }) => {
      // You'll need to add this API endpoint
      return teacherApi.gradeSubmission(data.submissionId, data);
    },
    onSuccess: () => {
      showApiSuccess(null, 'Submission graded successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
    },
    onError: (error) => showApiError(error, 'Failed to grade submission'),
  });

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      dueDate: '',
      totalMarks: 100,
      instructions: ''
    });
  };

  const handleCreateAssignment = () => {
    if (!selectedClass) {
      showApiError(new Error('Please select a class'), 'Missing information');
      return;
    }

    const selectedClassData = classes.find(cls => cls.classId._id === selectedClass);
    if (!selectedClassData) return;

    createAssignmentMutation.mutate({
      ...assignmentForm,
      classId: selectedClass,
      subjectId: selectedClassData.subjectId._id,
      sectionId: selectedClassData.sectionId._id
    });
  };

  const handleGradeSubmission = (submissionId: string, grade: string, remarks: string) => {
    gradeSubmissionMutation.mutate({
      submissionId,
      grade,
      remarks
    });
  };

  const getStatusBadge = (assignment: Assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && assignment.status !== 'closed';

    switch (assignment.status) {
      case 'published':
        return isOverdue ? (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        ) : (
          <Badge variant="default">
            <Clock className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getSubmissionStatusBadge = (submission: Submission) => {
    if (submission.status === 'graded') {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground">Create and manage assignments for your classes</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedClass}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment Title</Label>
                <Input
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mathematics Homework Chapter 5"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the assignment requirements..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={assignmentForm.totalMarks}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Provide detailed instructions for students..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAssignment}
                  disabled={createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Assignments List
            </div>
            <Badge variant="secondary">
              {assignments.length} assignments
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !selectedClass ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Select a Class</h3>
              <p className="text-muted-foreground">
                Please select a class to view assignments.
              </p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Assignments Found</h3>
              <p className="text-muted-foreground">
                No assignments have been created for this class yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.classId.name} - {assignment.subjectId.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.totalMarks} marks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.submissionCount}/{assignment.totalStudents} submitted</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(assignment)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment._id);
                          setSubmissionsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Submissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {submissionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Submissions Yet</h3>
                <p className="text-muted-foreground">
                  No students have submitted this assignment yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h4 className="font-medium">
                              {submission.studentId.firstName} {submission.studentId.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {submission.studentId.admissionNumber}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          Submitted: {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                        </div>

                        {submission.attachments.length > 0 && (
                          <div className="space-y-2">
                            <Label>Submitted Files:</Label>
                            {submission.attachments.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4" />
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {file.originalName}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        {submission.status !== 'graded' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Grade"
                              className="w-20"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const grade = (e.target as HTMLInputElement).value;
                                  handleGradeSubmission(submission._id, grade, '');
                                }
                              }}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const input = document.querySelector(`#grade-${submission._id}`) as HTMLInputElement;
                                const grade = input?.value || '';
                                handleGradeSubmission(submission._id, grade, '');
                              }}
                            >
                              Grade
                            </Button>
                          </div>
                        )}
                        {submission.grade && (
                          <div className="text-sm">
                            <Badge variant="outline">Grade: {submission.grade}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherAssignments;
