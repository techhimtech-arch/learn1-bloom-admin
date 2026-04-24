import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: {
    id: string;
    name: string;
    code: string;
  };
  dueDate: string;
  maxMarks: number;
  status: string;
}

interface AssignmentSubmissionDialogProps {
  assignment: Assignment;
  onSubmit: (assignmentId: string, submissionData: any) => void;
  submitting: boolean;
}

export const AssignmentSubmissionDialog = ({ 
  assignment, 
  onSubmit, 
  submitting 
}: AssignmentSubmissionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [lateSubmissionReason, setLateSubmissionReason] = useState('');

  const isLate = new Date(assignment.dueDate) < new Date();

  const handleSubmit = () => {
    const submissionData: any = {
      submissionText: submissionText.trim() || undefined,
    };

    if (attachment && attachmentUrl) {
      submissionData.attachment = {
        filename: attachment.name,
        url: attachmentUrl,
      };
    }

    if (isLate && lateSubmissionReason.trim()) {
      submissionData.lateSubmissionReason = lateSubmissionReason.trim();
    }

    onSubmit(assignment.id, submissionData);
    setOpen(false);
    
    // Reset form
    setSubmissionText('');
    setAttachment(null);
    setAttachmentUrl('');
    setLateSubmissionReason('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      // In a real app, you would upload the file to get a URL
      // For now, we'll simulate it with a placeholder URL
      setAttachmentUrl(`https://placeholder-url/${file.name}`);
    }
  };

  const isSubmitDisabled = submitting || (!submissionText.trim() && !attachment);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Submit Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>
            Submit your work for: <span className="font-semibold">{assignment.title}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Assignment Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Assignment Details</h4>
            <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Subject: {assignment.subjectId.name}</span>
              <span>Max Marks: {assignment.maxMarks}</span>
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Submission Text */}
          <div className="space-y-2">
            <Label htmlFor="submission-text">Submission Text</Label>
            <Textarea
              id="submission-text"
              placeholder="Enter your assignment text or description here..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={4}
            />
          </div>

          {/* File Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="flex-1"
              />
              {attachment && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  {attachment.name}
                </div>
              )}
            </div>
          </div>

          {/* Late Submission Reason */}
          {isLate && (
            <div className="space-y-2">
              <Label htmlFor="late-reason">Reason for Late Submission</Label>
              <Textarea
                id="late-reason"
                placeholder="Please provide a reason for the late submission..."
                value={lateSubmissionReason}
                onChange={(e) => setLateSubmissionReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </div>

          {/* Warning for late submission */}
          {isLate && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> This is a late submission. It may be subject to penalty as per the assignment policy.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
