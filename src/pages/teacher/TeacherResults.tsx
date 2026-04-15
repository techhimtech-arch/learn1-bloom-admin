import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Award, 
  Users, 
  FileText, 
  Plus,
  Edit,
  Save,
  Calculator,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { teacherApi } from '@/pages/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { format } from 'date-fns';
import { useTeacherContext } from '@/contexts/TeacherContext';

interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

interface Exam {
  _id: string;
  name: string;
  subjectId: { _id: string; name: string };
  classId: { _id: string; name: string };
  examDate: string;
  totalMarks: number;
}

interface Result {
  _id: string;
  studentId: Student;
  examId: Exam;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
  rank?: number;
}

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
}

const TeacherResults = () => {
  const queryClient = useQueryClient();
  const { 
    classesLoading, 
    classes, 
    getUniqueClasses, 
    getClassName, 
    getSectionName, 
    getSectionsForClass 
  } = useTeacherContext();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [resultsData, setResultsData] = useState<Array<{
    studentId: string;
    marksObtained: number;
    grade: string;
    remarks: string;
  }>>([]);

  // Get exams for teacher's classes
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['teacher-exams', selectedClass],
    queryFn: () => teacherApi.getExams({ classId: selectedClass }),
    enabled: !!selectedClass,
    staleTime: 3 * 60 * 1000,
  });

  const exams = examsData?.data?.data as Exam[] || [];

  // Get students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config: {} as any };
      const classData = classes.find(cls => (cls.classId?._id || cls.classId) === selectedClass);
      if (!classData) return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config: {} as any };
      return teacherApi.getStudents({ classId: selectedClass, sectionId: classData.sectionId?._id || classData.sectionId });
    },
    enabled: !!selectedClass,
    staleTime: 3 * 60 * 1000,
  });

  const students = (studentsData as any)?.data?.data as Student[] || [];

  // Get results for selected exam
  const { data: resultsDataQuery, isLoading: resultsLoading } = useQuery({
    queryKey: ['teacher-results', selectedExam],
    queryFn: () => teacherApi.getResults({ examId: selectedExam }),
    enabled: !!selectedExam,
    staleTime: 2 * 60 * 1000,
  });

  const results = (resultsDataQuery as any)?.data?.data as Result[] || [];

  // Get unique classes and sections using optimized functions
  const uniqueClasses = getUniqueClasses();
  const sectionsForClass = getSectionsForClass(selectedClass);

  // Add results mutation
  const addResultsMutation = useMutation({
    mutationFn: (data: any) => teacherApi.addResults(data),
    onSuccess: (response) => {
      showApiSuccess(response, `Results added for ${response.data?.data?.length || 0} students`);
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
      setResultsDialogOpen(false);
      setResultsData([]);
    },
    onError: (error) => showApiError(error, 'Failed to add results'),
  });

  // Update result mutation
  const updateResultMutation = useMutation({
    mutationFn: (data: any) => teacherApi.updateResults(data),
    onSuccess: () => {
      showApiSuccess(null, 'Result updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
    },
    onError: (error) => showApiError(error, 'Failed to update result'),
  });

  // Calculate grade from marks
  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  // Initialize results data when dialog opens
  const initializeResultsData = () => {
    if (!students.length || !selectedExam) return;
    
    const exam = exams.find(e => e._id === selectedExam);
    if (!exam) return;

    const existingResults = new Map(results.map(r => [r.studentId._id, r]));
    
    const data = students.map(student => {
      const existingResult = existingResults.get(student._id);
      return {
        studentId: student._id,
        marksObtained: existingResult?.marksObtained || 0,
        grade: existingResult?.grade || calculateGrade(0, exam.totalMarks),
        remarks: existingResult?.remarks || ''
      };
    });
    
    setResultsData(data);
  };

  // Update result data
  const updateResultData = (studentId: string, field: 'marksObtained' | 'remarks', value: string | number) => {
    setResultsData(prev => 
      prev.map(result => 
        result.studentId === studentId 
          ? { 
              ...result, 
              [field]: field === 'marksObtained' ? Number(value) : value,
              grade: field === 'marksObtained' 
                ? calculateGrade(Number(value), exams.find(e => e._id === selectedExam)?.totalMarks || 100)
                : result.grade
            }
          : result
      )
    );
  };

  // Handle results submission
  const handleSubmitResults = () => {
    if (!selectedExam) {
      showApiError(new Error('Please select an exam'), 'Missing information');
      return;
    }

    const exam = exams.find(e => e._id === selectedExam);
    if (!exam) return;

    addResultsMutation.mutate({
      examId: selectedExam,
      subjectId: exam.subjectId._id,
      classId: exam.classId._id,
      results: resultsData.map(result => ({
        studentId: result.studentId,
        marksObtained: result.marksObtained,
        maxMarks: exam.totalMarks,
        grade: result.grade,
        remarks: result.remarks
      }))
    });
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B+': return 'bg-purple-100 text-purple-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!results.length) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const marks = results.map(r => r.marksObtained);
    const average = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const passCount = results.filter(r => r.grade !== 'F').length;
    const passRate = (passCount / results.length) * 100;

    return { average, highest, lowest, passRate };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results Management</h1>
          <p className="text-sm text-muted-foreground">Enter and manage exam results</p>
        </div>
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedExam}>
              <Plus className="mr-2 h-4 w-4" />
              Enter Results
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enter Results - {exams.find(e => e._id === selectedExam)?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const result = resultsData.find(r => r.studentId === student._id);
                    return (
                      <TableRow key={student._id}>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={result?.marksObtained || 0}
                            onChange={(e) => updateResultData(student._id, 'marksObtained', e.target.value)}
                            min="0"
                            max={exams.find(e => e._id === selectedExam)?.totalMarks || 100}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result?.grade || 'F')}>
                            {result?.grade || 'F'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result?.remarks || ''}
                            onChange={(e) => updateResultData(student._id, 'remarks', e.target.value)}
                            placeholder="Optional remarks"
                            className="w-48"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResultsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitResults}
                  disabled={addResultsMutation.isPending}
                >
                  {addResultsMutation.isPending ? 'Saving...' : 'Save Results'}
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
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select 
                value={selectedExam} 
                onValueChange={setSelectedExam}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.name} - {exam.subjectId.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Marks</p>
                  <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Highest</p>
                  <p className="text-2xl font-bold">{stats.highest}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Lowest</p>
                  <p className="text-2xl font-bold">{stats.lowest}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Results List
            </div>
            <Badge variant="secondary">
              {results.length} results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !selectedExam ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Select an Exam</h3>
              <p className="text-muted-foreground">
                Please select a class and exam to view results.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Results Found</h3>
              <p className="text-muted-foreground">
                No results have been entered for this exam yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {result.studentId.firstName} {result.studentId.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.studentId.admissionNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{result.marksObtained}</div>
                        <div className="text-sm text-muted-foreground">/ {result.maxMarks}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade)}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.remarks || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherResults;
