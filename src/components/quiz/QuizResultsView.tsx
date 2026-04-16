import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogFooter } from '@/components/ui/dialog';
import { Search, Download, Eye, Users, Trophy, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { teacherQuizService, quizUtils } from '@/services/quizService';
import { QuizResultsResponse, QuizSubmission } from '@/types/quiz';

interface QuizResultsViewProps {
  quizId: string;
  onClose: () => void;
}

const QuizResultsView: React.FC<QuizResultsViewProps> = ({ quizId, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: resultsData, isLoading, error } = useQuery({
    queryKey: ['quiz-results', quizId, currentPage, searchTerm, sortBy, sortOrder],
    queryFn: () => teacherQuizService.getQuizResults(quizId, currentPage, 50),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredSubmissions = resultsData?.data?.submissions?.filter(submission =>
    submission.studentId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.studentId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.studentId.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'studentName':
        aValue = `${a.studentId.firstName} ${a.studentId.lastName}`;
        bValue = `${b.studentId.firstName} ${b.studentId.lastName}`;
        break;
      case 'percentage':
        aValue = a.percentage;
        bValue = b.percentage;
        break;
      case 'marksObtained':
        aValue = a.marksObtained;
        bValue = b.marksObtained;
        break;
      case 'timeTaken':
        aValue = a.timeTakenFormatted;
        bValue = b.timeTakenFormatted;
        break;
      default:
        aValue = a.submittedAt;
        bValue = b.submittedAt;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = resultsData?.data?.submissions ? Math.ceil(resultsData.data.submissions.length / 50) : 1;

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

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percentage >= 60) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    if (percentage >= 40) return <TrendingDown className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error loading results</div>;
  }

  const quiz = resultsData?.data?.quiz;
  const submissions = sortedSubmissions;

  return (
    <div className="space-y-6">
      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Results Summary
          </CardTitle>
          <CardDescription>
            Performance overview for {quiz?.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.passed).length}
              </div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {submissions.filter(s => !s.passed).length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {submissions.length > 0 
                  ? (submissions.reduce((sum, s) => sum + s.percentage, 0) / submissions.length).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submittedAt">Submission Time</SelectItem>
            <SelectItem value="studentName">Student Name</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="marksObtained">Marks</SelectItem>
            <SelectItem value="timeTaken">Time Taken</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>
            Detailed view of all student submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('percentage')}>
                    <div className="flex items-center gap-1">
                      Percentage
                      {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('marksObtained')}>
                    <div className="flex items-center gap-1">
                      Marks
                      {sortBy === 'marksObtained' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('timeTaken')}>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time
                      {sortBy === 'timeTaken' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">
                            {submission.studentId.firstName} {submission.studentId.lastName}
                          </div>
                        </div>
                        {getPerformanceIcon(submission.percentage)}
                      </div>
                    </TableCell>
                    <TableCell>{submission.studentId.admissionNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Attempt {submission.attemptNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{submission.percentage.toFixed(1)}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              submission.percentage >= 80 ? 'bg-green-500' :
                              submission.percentage >= 60 ? 'bg-blue-500' :
                              submission.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(submission.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.marksObtained} / {quiz?.maxMarks}
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(submission.grade)}>
                        {submission.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>{submission.timeTakenFormatted}</TableCell>
                    <TableCell>
                      <Badge variant={submission.passed ? 'default' : 'destructive'}>
                        {submission.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {submissions.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Actions */}
      <DialogFooter>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
};

export default QuizResultsView;
