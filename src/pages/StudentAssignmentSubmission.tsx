import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Award,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { assignmentApi } from '@/services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  dueDate: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  attachmentUrl?: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  attachmentUrl?: string;
  submittedAt: string;
  isLate: boolean;
  marks?: number;
  remarks?: string;
  status: 'submitted' | 'graded' | 'not_submitted';
}

export default function StudentAssignmentSubmission() {
  const { user } = useAuth();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: assignmentData,
    isLoading: assignmentLoading,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return { data: null };
      const response = await assignmentApi.getById(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
  });

  const {
    data: submissionData,
    isLoading: submissionLoading,
  } = useQuery({
    queryKey: ['assignment-submission', assignmentId, user?.id],
    queryFn: async () => {
      if (!assignmentId || !user?.id) return { data: null };
      const response = await assignmentApi.getSubmissions(assignmentId);
      const submissions = response.data?.data || [];
      // Find the current student's submission
      const studentSubmission = submissions.find((sub: Submission) => sub.studentId === user.id);
      return { data: studentSubmission || null };
    },
    enabled: !!assignmentId && !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: (data: FormData) => assignmentApi.submit(assignmentId!, data),
    onSuccess: () => {
      toast.success('Assignment submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-submission', assignmentId, user?.id] });
      setSubmissionText('');
      setAttachmentFile(null);
      setAttachmentPreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    },
  });

  useEffect(() => {
    if (!assignmentId) {
      navigate('/assignments');
    }
  }, [assignmentId, navigate]);

  const assignment = assignmentData?.data as Assignment;
  const submission = submissionData?.data as Submission;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = () => {
    if (!submissionText.trim() && !attachmentFile) {
      toast.error('Please enter submission text or attach a file');
      return;
    }

    const formData = new FormData();
    if (submissionText.trim()) {
      formData.append('submissionText', submissionText);
    }
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    submitMutation.mutate(formData);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'not_submitted': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'graded': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canSubmit = () => {
    return assignment?.status === 'published' && 
           !isOverdue(assignment.dueDate) && 
           submission?.status === 'not_submitted';
  };

  if (!assignmentId || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Assignment Not Found</h3>
          <p className="text-muted-foreground">The requested assignment could not be found.</p>
        </div>
      </div>
    );
  }

  if (assignmentLoading || submissionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment</h1>
          <p className="text-muted-foreground">
            {assignment.subject?.name} - {assignment.title}
          </p>
        </div>
        <Badge className={getStatusColor(submission?.status || 'not_submitted')}>
          {submission?.status === 'not_submitted' ? 'Not Submitted' : 
           submission?.status === 'submitted' ? 'Submitted' : 'Graded'}
        </Badge>
      </div>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Due Date</div>
                <div className={`font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600' : ''}`}>
                  {format(new Date(assignment.dueDate), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Max Marks</div>
                <div className="font-medium">{assignment.maxMarks}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge className={getStatusColor(submission?.status || 'not_submitted')}>
                  {submission?.status === 'not_submitted' ? 'Not Submitted' : 
                   submission?.status === 'submitted' ? 'Submitted' : 'Graded'}
                </Badge>
              </div>
            </div>
          </div>

          {assignment.attachmentUrl && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Assignment Attachment</div>
              <Button variant="outline" size="sm" asChild>
                <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Attachment
                </a>
              </Button>
            </div>
          )}

          {submission && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your Submission</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Submitted: </span>
                  <span className="font-medium">
                    {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                  {submission.isLate && (
                    <Badge variant="destructive" className="ml-2">
                      Late
                    </Badge>
                  )}
                </div>

                {submission.submissionText && (
                  <div>
                    <span className="text-sm text-muted-foreground">Text: </span>
                    <p className="mt-1 p-2 bg-white rounded border">
                      {submission.submissionText}
                    </p>
                  </div>
                )}

                {submission.attachmentUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">Attachment: </span>
                    <Button variant="outline" size="sm" asChild className="ml-2">
                      <a href={submission.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                )}

                {submission.status === 'graded' && (
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Marks Obtained: </span>
                        <span className="font-bold text-lg ml-2">
                          {submission.marks} / {assignment.maxMarks}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Percentage: </span>
                        <span className="font-bold text-lg ml-2">
                          {((submission.marks || 0) / assignment.maxMarks * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {submission.remarks && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">Remarks: </span>
                        <p className="mt-1 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                          {submission.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {canSubmit() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Submit Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Submission Text</label>
              <Textarea
                placeholder="Enter your assignment submission here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Attachment (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeAttachment}
                    disabled={!attachmentFile && !attachmentPreview}
                  >
                    Clear
                  </Button>
                </div>
                
                {(attachmentFile || attachmentPreview) && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/50">
                    {attachmentPreview ? (
                      <img 
                        src={attachmentPreview} 
                        alt="Attachment preview" 
                        className="max-w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Upload className="h-4 w-4" />
                        <span>{attachmentFile?.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={submitMutation.isPending || (!submissionText.trim() && !attachmentFile)}
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {assignment.status !== 'published' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                {assignment.status === 'draft' ? 'This assignment is not yet published.' : 'This assignment is closed for submissions.'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {isOverdue(assignment.dueDate) && assignment.status === 'published' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                This assignment is overdue. Submissions are no longer accepted.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {submission?.status === 'graded' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                Your submission has been graded. View your results above.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
