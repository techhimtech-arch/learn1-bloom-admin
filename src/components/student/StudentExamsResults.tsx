import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Calendar, TrendingUp, Award, Download, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface Exam {
  _id: string;
  name: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  totalMarks: number;
  status: 'upcoming' | 'completed' | 'in-progress';
  marks?: number;
  percentage?: number;
  grade?: string;
}

interface Result {
  _id: string;
  examName: string;
  subjects: Array<{
    name: string;
    marks: number;
    total: number;
    percentage: number;
    grade: string;
  }>;
  totalMarks: number;
  totalObtained: number;
  overallPercentage: number;
  overallGrade: string;
  rank?: number;
  date: string;
}

export const StudentExamsResults = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  useEffect(() => {
    // Simulate API call
    setExams([
      {
        _id: '1',
        name: 'Unit Test 1',
        subject: 'Mathematics',
        date: '2026-04-20',
        time: '09:00 AM',
        duration: 60,
        totalMarks: 50,
        status: 'upcoming',
      },
      {
        _id: '2',
        name: 'Mid-Term Exam',
        subject: 'English',
        date: '2026-04-25',
        time: '10:00 AM',
        duration: 120,
        totalMarks: 100,
        status: 'upcoming',
      },
    ]);

    setResults([
      {
        _id: '1',
        examName: 'Unit Test - March 2026',
        date: '2026-03-20',
        subjects: [
          { name: 'Mathematics', marks: 42, total: 50, percentage: 84, grade: 'A' },
          { name: 'English', marks: 38, total: 50, percentage: 76, grade: 'B+' },
          { name: 'Science', marks: 45, total: 50, percentage: 90, grade: 'A+' },
          { name: 'Social Studies', marks: 40, total: 50, percentage: 80, grade: 'A' },
        ],
        totalMarks: 200,
        totalObtained: 165,
        overallPercentage: 82.5,
        overallGrade: 'A',
        rank: 5,
      },
    ]);

    setLoading(false);
  }, []);

  const getGradeColor = (grade: string) => {
    const gradeMap: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return gradeMap[grade] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, any> = {
      upcoming: { label: 'Upcoming', className: 'bg-blue-500' },
      'in-progress': { label: 'In Progress', className: 'bg-orange-500' },
      completed: { label: 'Completed', className: 'bg-green-500' },
    };
    return <Badge className={statusMap[status]?.className}>{statusMap[status]?.label}</Badge>;
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  const upcomingCount = exams.filter(e => e.status === 'upcoming').length;
  const completedCount = exams.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-blue-600">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">Upcoming Exams</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold">{results[0]?.overallGrade || '—'}</p>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        {/* Upcoming Exams Tab */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {exams.filter(e => e.status === 'upcoming').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming exams scheduled
              </CardContent>
            </Card>
          ) : (
            exams
              .filter(e => e.status === 'upcoming')
              .map(exam => (
                <Card key={exam._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{exam.name}</h3>
                          <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        </div>
                        {getStatusBadge(exam.status)}
                      </div>

                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Date</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(exam.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Time</p>
                          <p className="font-semibold">{exam.time}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Duration</p>
                          <p className="font-semibold">{exam.duration} mins</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Total Marks</p>
                          <p className="font-semibold">{exam.totalMarks}</p>
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-xs">
                          Make sure to review syllabus and important questions before the exam.
                        </AlertDescription>
                      </Alert>

                      <Button className="w-full">View Syllabus</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No exam results available yet
              </CardContent>
            </Card>
          ) : (
            results.map(result => (
              <Card key={result._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{result.examName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{result.overallPercentage.toFixed(1)}%</p>
                      <Badge className={`mt-2 ${getGradeColor(result.overallGrade)}`}>
                        Grade: {result.overallGrade}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Marks</span>
                      <span className="font-semibold">{result.totalObtained}/{result.totalMarks}</span>
                    </div>
                    {result.rank && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Class Rank</span>
                        <span className="font-semibold flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-600" />
                          {result.rank}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm">Subject-wise Breakdown</h4>
                    {result.subjects.map((subject, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{subject.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getGradeColor(subject.grade)}`}
                              variant="outline"
                            >
                              {subject.grade}
                            </Badge>
                            <span className="font-semibold min-w-fit">
                              {subject.marks}/{subject.total}
                            </span>
                          </div>
                        </div>
                        <Progress value={subject.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">{subject.percentage}%</p>
                      </div>
                    ))}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Download Report Card</DialogTitle>
                        <DialogDescription>
                          Choose format to download your report card
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Button className="w-full">Download as PDF</Button>
                        <Button className="w-full" variant="outline">Download as Image</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
