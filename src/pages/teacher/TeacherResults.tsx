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
  Edit,
  Save,
  Eye,
  Filter,
  TrendingUp,
  Star
} from 'lucide-react';
import { teacherApi, marksApi, examApi } from '@/services/api';
import { showApiError, showApiSuccess as showSuccess } from '@/lib/api-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeacherContext } from '@/contexts/TeacherContext';

interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

interface Exam {
  _id: string;
  name: string;
  description: string;
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  examDate: string;
  totalMarks: number;
  duration: string;
  isActive: boolean;
}

interface Result {
  _id: string;
  studentId: {
    _id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  examId: {
    _id: string;
    name: string;
    examDate: string;
  };
  subjectId: { _id: string; name: string };
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
  enteredBy: string;
  updatedBy?: string;
}

interface SubjectAssignment {
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
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
  const [resultRecords, setResultRecords] = useState<Array<{
    studentId: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    remarks: string;
  }>>([]);

  // Get exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['teacher-exams', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || selectedClass === 'all' || !selectedSection || selectedSection === 'all') {
        return { data: { data: [] } };
      }
      return teacherApi.getExams({ classId: selectedClass, sectionId: selectedSection });
    },
    enabled: !!selectedClass && !!selectedSection,
    staleTime: 3 * 60 * 1000,
  });

  // Get students for marks entry
  const { data: studentsForEntryData } = useQuery({
    queryKey: ['marks-students-for-entry', selectedExam, selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedExam || selectedExam === 'all' || !selectedClass || selectedClass === 'all' || !selectedSection || selectedSection === 'all') {
        return { data: { data: [] } };
      }
      return marksApi.getStudentsForEntry({ 
        examId: selectedExam, 
        classId: selectedClass, 
        sectionId: selectedSection 
      });
    },
    enabled: !!selectedExam && selectedExam !== 'all' && resultsDialogOpen,
  });

  // Get results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['teacher-results', selectedExam],
    queryFn: async () => {
      if (!selectedExam || selectedExam === 'all') return { data: { data: [] } };
      return examApi.getResults(selectedExam);
    },
    enabled: !!selectedExam,
    staleTime: 2 * 60 * 1000,
  });

  const exams = (examsData as any)?.data?.data as Exam[] || [];
  const studentsForEntry = (studentsForEntryData as any)?.data?.data || [];
  const results = (resultsData as any)?.data?.data as Result[] || [];

  // Refetch and initialize records when dialog opens
  useEffect(() => {
    if (resultsDialogOpen && selectedExam !== 'all') {
      initializeResultRecords();
    }
  }, [resultsDialogOpen, studentsForEntry.length]);

  // Get unique classes and sections using optimized functions
  const uniqueClasses = getUniqueClasses();
  const sectionsForClass = getSectionsForClass(selectedClass);

  // Find selected exam details
  const selectedExamDetails = exams.find(exam => exam._id === selectedExam);

  // Mutations
  // New Phase 2 Mutations
  const saveMarksMutation = useMutation({
    mutationFn: (data: any) => marksApi.save(data),
    onSuccess: () => {
      showSuccess('Marks saved as draft');
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
    },
    onError: (error) => showApiError(error, 'Failed to save marks'),
  });

  const submitMarksMutation = useMutation({
    mutationFn: (data: { examId: string; classId: string; sectionId: string }) => marksApi.submit(data),
    onSuccess: () => {
      showSuccess('Marks submitted for verification');
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
      setResultsDialogOpen(false);
    },
    onError: (error) => showApiError(error, 'Failed to submit marks'),
  });

  const addResultsMutation = useMutation({
    mutationFn: (data: {
      examId: string;
      subjectId: string;
      classId: string;
      sectionId: string;
      results: Array<{
        studentId: string;
        marksObtained: number;
        maxMarks: number;
        grade: string;
        remarks: string;
      }>;
    }) => teacherApi.addResults(data),
    onSuccess: (response) => {
      showSuccess(`Results added for ${response.data?.data?.length || 0} students`);
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
      setResultsDialogOpen(false);
      setResultRecords([]);
    },
    onError: (error) => showApiError(error, 'Failed to add results'),
  });

  const updateResultMutation = useMutation({
    mutationFn: (data: {
      resultId: string;
      marksObtained: number;
      grade: string;
      remarks: string;
    }) => teacherApi.updateResults(data),
    onSuccess: () => {
      showSuccess('Result updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-results'] });
    },
    onError: (error) => showApiError(error, 'Failed to update result'),
  });

  // Calculate grade based on marks
  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-purple-100 text-purple-800';
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
        return 'bg-blue-100 text-blue-800';
      case 'B':
        return 'bg-cyan-100 text-cyan-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Initialize result records when dialog opens
  const initializeResultRecords = () => {
    if (!selectedExamDetails) return;
    
    // If we have entry data, use it, otherwise use students
    const sourceList = studentsForEntry.length > 0 ? studentsForEntry : [];
    
    const records = sourceList.map((item: any) => ({
      studentId: item.studentId?._id || item.studentId || item._id,
      enrollmentId: item.enrollmentId || item._id, // Use enrollmentId if available
      marksObtained: item.marksObtained || 0,
      maxMarks: selectedExamDetails.totalMarks,
      grade: calculateGrade(item.marksObtained || 0, selectedExamDetails.totalMarks),
      remarks: item.remarks || ''
    }));
    setResultRecords(records);
  };

  // Update result record
  const updateResultRecord = (studentId: string, field: 'marksObtained' | 'remarks', value: string | number) => {
    setResultRecords(prev => 
      prev.map(record => {
        if (record.studentId === studentId) {
          const updatedRecord = { ...record, [field]: value };
          if (field === 'marksObtained') {
            updatedRecord.grade = calculateGrade(Number(value), record.maxMarks);
          }
          return updatedRecord;
        }
        return record;
      })
    );
  };

  // Handle results submission (Phase 2)
  const handleSaveDraft = () => {
    if (!selectedExam || !selectedExamDetails || selectedExam === 'all') {
      showApiError(new Error('Please select an exam'), 'Missing information');
      return;
    }

    saveMarksMutation.mutate({
      examId: selectedExam,
      classId: selectedClass,
      sectionId: selectedSection,
      students: resultRecords.map(r => ({
        enrollmentId: (r as any).enrollmentId,
        subjects: [
          { 
            subjectId: selectedExamDetails.subjectId._id, 
            marksObtained: r.marksObtained, 
            maxMarks: r.maxMarks 
          }
        ]
      }))
    });
  };

  const handleSubmitFinal = () => {
    if (!selectedExam || selectedExam === 'all') return;
    
    if (confirm('Are you sure you want to submit these marks? You won\'t be able to edit them after submission.')) {
      submitMarksMutation.mutate({
        examId: selectedExam,
        classId: selectedClass,
        sectionId: selectedSection
      });
    }
  };

  const handleSubmitResults = () => {
    if (!selectedExam || !selectedExamDetails) {
      showApiError(new Error('Please select an exam'), 'Missing information');
      return;
    }

    addResultsMutation.mutate({
      examId: selectedExam,
      subjectId: selectedExamDetails.subjectId._id,
      classId: selectedExamDetails.classId._id,
      sectionId: selectedSection,
      results: resultRecords
    });
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

  if (classesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Results Management</h1>
        <p className="text-sm text-muted-foreground">Enter and manage exam results</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={(value) => {
                setSelectedClass(value);
                setSelectedSection('all');
                setSelectedExam('all');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Class</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select 
                value={selectedSection} 
                onValueChange={(value) => {
                  setSelectedSection(value);
                  setSelectedExam('all');
                }}
                disabled={!selectedClass || selectedClass === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Section</SelectItem>
                  {sectionsForClass.map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.name}
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
                disabled={!selectedClass || selectedClass === 'all' || !selectedSection || selectedSection === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Exam</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.name} - {exam.subjectId?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={initializeResultRecords}
                      disabled={!selectedExam || selectedExam === 'all' || !selectedExamDetails}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Enter Results
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Enter Results - {selectedExamDetails?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {selectedExamDetails && (
                          <span>
                            Entering results for {selectedExamDetails.subjectId?.name} - 
                            {selectedExamDetails.classId?.name} {(selectedExamDetails as any).sectionId?.name} 
                            (Max Marks: {selectedExamDetails.totalMarks})
                          </span>
                        )}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Marks Obtained</TableHead>
                            <TableHead>Max Marks</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resultRecords.map((record) => {
                            const studentInfo = studentsForEntry.find((s: any) => 
                              (s.studentId?._id || s.studentId || s._id) === record.studentId
                            );
                            return (
                              <TableRow key={record.studentId}>
                                <TableCell>{studentInfo?.admissionNumber || '-'}</TableCell>
                                <TableCell>{studentInfo?.name || studentInfo?.firstName ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Unknown'}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={selectedExamDetails?.totalMarks || 100}
                                    value={record?.marksObtained || 0}
                                    onChange={(e) => updateResultRecord(record.studentId, 'marksObtained', Number(e.target.value))}
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>{selectedExamDetails?.totalMarks || 100}</TableCell>
                                <TableCell>
                                  <Badge className={getGradeColor(record?.grade || 'F')}>
                                    {record?.grade || 'F'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Optional remarks"
                                    value={record?.remarks || ''}
                                    onChange={(e) => updateResultRecord(record.studentId, 'remarks', e.target.value)}
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
                          variant="secondary"
                          onClick={handleSaveDraft}
                          disabled={saveMarksMutation.isPending}
                        >
                          {saveMarksMutation.isPending ? 'Saving...' : 'Save Draft'}
                        </Button>
                        <Button 
                          onClick={handleSubmitFinal}
                          disabled={submitMarksMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {submitMarksMutation.isPending ? 'Submitting...' : 'Submit Final'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={viewResultsDialogOpen} onOpenChange={setViewResultsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedExam || selectedExam === 'all'}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Results
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Results - {selectedExamDetails?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Statistics */}
                      {results.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <div className="text-2xl font-bold">{stats.average.toFixed(1)}</div>
                                <div className="text-sm text-muted-foreground">Average</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Star className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <div className="text-2xl font-bold">{stats.highest}</div>
                                <div className="text-sm text-muted-foreground">Highest</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Award className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                <div className="text-2xl font-bold">{stats.lowest}</div>
                                <div className="text-sm text-muted-foreground">Lowest</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Pass Rate</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      
                      {resultsLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : results.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">No results found</h3>
                          <p className="text-muted-foreground">
                            No results have been entered for this exam yet.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Roll No</TableHead>
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
                                <TableCell>{result.studentId.admissionNumber}</TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {result.studentId.firstName} {result.studentId.lastName}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-center">
                                    <span className="font-medium">{result.marksObtained}</span>
                                    <span className="text-muted-foreground">/{result.maxMarks}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getGradeColor(result.grade)}>
                                    {result.grade}
                                  </Badge>
                                </TableCell>
                                <TableCell>{result.remarks || '-'}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Update result logic here
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      {selectedClass && selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Available Exams ({exams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No exams found</h3>
                <p className="text-muted-foreground">
                  No exams have been created for your assigned subjects in this class.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow 
                      key={exam._id}
                      className={selectedExam === exam._id ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subjectId?.name}</TableCell>
                      <TableCell>
                        {exam.examDate ? format(new Date(exam.examDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>{exam.duration}</TableCell>
                      <TableCell>
                        <Badge variant={exam.isActive ? 'default' : 'secondary'}>
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Select your assigned class and section from the filters above.</p>
            <p>2. Choose the exam for which you want to enter results.</p>
            <p>3. Click "Enter Results" to open the results entry form.</p>
            <p>4. Enter marks obtained for each student (grades will be calculated automatically).</p>
            <p>5. Add optional remarks for each student if needed.</p>
            <p>6. Click "Save Results" to submit the records.</p>
            <p>7. Use "View Results" to see previously entered results and statistics.</p>
            <p className="text-amber-600 font-medium">
              Note: You can only enter results for subjects that you are assigned to teach.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherResults;
