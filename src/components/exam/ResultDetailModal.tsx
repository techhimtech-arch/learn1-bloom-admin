import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Award } from 'lucide-react';

interface Result {
  id?: string;
  examId?: string;
  studentId?: string;
  total?: number;
  totalMarks?: number;
  obtainedMarks?: number;
  percentage: number;
  grade?: string;
  status?: string;
  student_name?: string;
  student?: {
    id?: string;
    name?: string;
    rollNumber?: string;
    class?: string;
    section?: string;
  };
  subjectResults?: Array<{
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    status: 'pass' | 'fail';
  }>;
  subject_marks?: Array<{
    subject_name: string;
    marks_obtained: number;
  }>;
}

interface ResultDetailModalProps {
  result: Result;
  onClose: () => void;
}

export function ResultDetailModal({ result, onClose }: ResultDetailModalProps) {
  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (!status) return null;
    return status.toLowerCase() === 'pass' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const displaySubjects = result.subject_marks || result.subjectResults || [];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Result Details</DialogTitle>
          <DialogDescription>
            Detailed breakdown of results for {result.student_name || result.student?.name || 'Student'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <div className="font-medium">{result.student_name || result.student?.name || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Roll Number:</span>
                <div className="font-mono">{result.student?.rollNumber || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Class:</span>
                <div className="font-medium">{result.student?.class || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Section:</span>
                <div className="font-medium">{result.student?.section || '-'}</div>
              </div>
            </div>
          </div>

          {/* Overall Result */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Overall Result</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Score:</span>
                <div className="font-medium">{result.total !== undefined ? result.total : result.totalMarks}</div>
              </div>
              {result.obtainedMarks !== undefined && (
                <div>
                  <span className="text-muted-foreground">Obtained:</span>
                  <div className="font-medium">{result.obtainedMarks}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Percentage:</span>
                <div className="font-medium">{result.percentage?.toFixed(2) || '0.00'}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Grade:</span>
                <div>
                  <Badge className={getGradeColor(result.grade || 'N/A')}>
                    {result.grade || '-'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status || '')}
                  <span className="font-medium capitalize">{result.status || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Results */}
          {displaySubjects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Subject-wise Results</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displaySubjects.map((sub: any, index: number) => {
                      // Normalize between legacy `subjectResults` and new `subject_marks`
                      const name = sub.subject_name || sub.subjectName || '-';
                      const obtained = sub.marks_obtained !== undefined ? sub.marks_obtained : sub.marksObtained;
                      const max = sub.maxMarks || '-';
                      const percentage = typeof max === 'number' && max > 0 ? ((obtained / max) * 100).toFixed(1) : '-';
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{name}</div>
                          </TableCell>
                          <TableCell>
                            {sub.subjectCode ? (
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {sub.subjectCode}
                              </code>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-muted-foreground" />
                              {max}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{obtained}</div>
                          </TableCell>
                          <TableCell>
                            {percentage !== '-' ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{percentage}%</span>
                                <div className="w-16 bg-muted rounded-full h-2 min-w-[4rem]">
                                  <div 
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${Math.min(Number(percentage), 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.grade ? (
                              <Badge className={getGradeColor(sub.grade)}>
                                {sub.grade}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.status ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(sub.status)}
                                <span className="font-medium capitalize">{sub.status}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
