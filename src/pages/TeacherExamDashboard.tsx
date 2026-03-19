import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { examApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherExamPaper {
  id: string;
  examId: string;
  subjectId: string;
  teacherId: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string;
  startTime: string;
  endTime: string;
  exam?: {
    id: string;
    name: string;
    examType: string;
    startDate: string;
    endDate: string;
    status: string;
    isMarksLocked: boolean;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  marksEntryStatus?: {
    totalStudents: number;
    marksEntered: number;
    pendingStudents: number;
    completionPercentage: number;
  };
}

export default function TeacherExamDashboard() {
  const { user } = useAuth();

  const {
    data: examPapersData,
    isLoading: papersLoading,
  } = useQuery({
    queryKey: ['teacher-exam-papers', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await examApi.getAll({ teacherId: user.id });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const examPapers = examPapersData?.data || [];

  const getExamTypeColor = (examType: string) => {
    const colors: Record<string, string> = {
      'midterm': 'bg-purple-100 text-purple-800',
      'final': 'bg-red-100 text-red-800',
      'quiz': 'bg-green-100 text-green-800',
      'practical': 'bg-orange-100 text-orange-800',
      'assignment': 'bg-cyan-100 text-cyan-800',
      'test': 'bg-indigo-100 text-indigo-800',
    };
    return colors[examType] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate statistics
  const totalPapers = examPapers.length;
  const completedPapers = examPapers.filter(p => 
    p.marksEntryStatus?.completionPercentage === 100
  ).length;
  const pendingPapers = totalPapers - completedPapers;
  const averageCompletion = totalPapers > 0 
    ? examPapers.reduce((sum, p) => sum + (p.marksEntryStatus?.completionPercentage || 0), 0) / totalPapers 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Exam Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your assigned exam papers and marks entry
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPapers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPapers}</div>
            <p className="text-xs text-muted-foreground">
              {totalPapers > 0 ? ((completedPapers / totalPapers) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPapers}</div>
            <p className="text-xs text-muted-foreground">
              Papers requiring marks entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Papers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assigned Exam Papers ({examPapers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {papersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : examPapers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No exam papers assigned</h3>
              <p className="text-muted-foreground">
                You haven't been assigned any exam papers yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examPapers.map((paper: TeacherExamPaper) => {
                    const progress = paper.marksEntryStatus?.completionPercentage || 0;
                    const isLocked = paper.exam?.isMarksLocked || false;
                    
                    return (
                      <TableRow key={paper.id}>
                        <TableCell>
                          <div className="font-medium">{paper.exam?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">
                            {paper.exam?.startDate && format(new Date(paper.exam.startDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{paper.subject?.name || '-'}</div>
                            <div className="text-sm text-muted-foreground">{paper.subject?.code || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {paper.examDate ? format(new Date(paper.examDate), 'MMM dd, yyyy') : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getExamTypeColor(paper.exam?.examType || '')}>
                            {paper.exam?.examType || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(paper.exam?.status || '')}>
                              {paper.exam?.status || '-'}
                            </Badge>
                            {isLocked && (
                              <Badge variant="outline" className="text-orange-600">
                                Locked
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getCompletionColor(progress)}`}>
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {paper.marksEntryStatus?.marksEntered || 0} / {paper.marksEntryStatus?.totalStudents || 0} students
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/exams/${paper.examId}/results`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            {!isLocked && progress < 100 && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link to={`/exams/${paper.examId}/marks`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
