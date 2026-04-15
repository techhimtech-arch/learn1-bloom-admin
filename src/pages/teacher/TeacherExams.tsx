import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { teacherApi } from '@/pages/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { format } from 'date-fns';
import { useTeacherContext } from '@/contexts/TeacherContext';

interface Exam {
  _id: string;
  name: string;
  description: string;
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  examDate: string;
  totalMarks: number;
  duration: number;
  isActive: boolean;
  instructions: string[];
}

interface ClassAssignment {
  _id: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
}

const TeacherExams = () => {
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
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    name: '',
    description: '',
    examDate: '',
    totalMarks: 100,
    duration: 60,
    instructions: ['']
  });

  // Get exams for teacher's classes
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['teacher-exams', selectedClass],
    queryFn: () => teacherApi.getExams({ classId: selectedClass }),
    enabled: !!selectedClass,
    staleTime: 3 * 60 * 1000,
  });

  const exams = examsData?.data?.data as Exam[] || [];

  // Get unique classes and sections using optimized functions
  const uniqueClasses = getUniqueClasses();
  const sectionsForClass = getSectionsForClass(selectedClass);

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: (data: any) => {
      // You'll need to add this API endpoint
      return teacherApi.createExam(data);
    },
    onSuccess: () => {
      showApiSuccess(null, 'Exam created successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] });
      setCreateDialogOpen(false);
      resetExamForm();
    },
    onError: (error) => showApiError(error, 'Failed to create exam'),
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: (data: any) => {
      // You'll need to add this API endpoint
      return teacherApi.updateExam(selectedExam?._id || '', data);
    },
    onSuccess: () => {
      showApiSuccess(null, 'Exam updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] });
      setEditDialogOpen(false);
      setSelectedExam(null);
    },
    onError: (error) => showApiError(error, 'Failed to update exam'),
  });

  const resetExamForm = () => {
    setExamForm({
      name: '',
      description: '',
      examDate: '',
      totalMarks: 100,
      duration: 60,
      instructions: ['']
    });
  };

  const handleCreateExam = () => {
    if (!selectedClass) {
      showApiError(new Error('Please select a class'), 'Missing information');
      return;
    }

    const selectedClassData = classes.find(cls => cls.classId._id === selectedClass);
    if (!selectedClassData) return;

    createExamMutation.mutate({
      ...examForm,
      classId: selectedClass,
      subjectId: selectedClassData.subjectId._id,
      sectionId: selectedClassData.sectionId._id
    });
  };

  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setExamForm({
      name: exam.name,
      description: exam.description,
      examDate: exam.examDate,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      instructions: exam.instructions || ['']
    });
    setEditDialogOpen(true);
  };

  const handleUpdateExam = () => {
    if (!selectedExam) return;

    updateExamMutation.mutate(examForm);
  };

  const addInstruction = () => {
    setExamForm(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setExamForm(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const removeInstruction = (index: number) => {
    setExamForm(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (exam: Exam) => {
    const examDate = new Date(exam.examDate);
    const today = new Date();
    const isPast = examDate < today;
    
    if (isPast) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="default">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground">Manage exams for your classes</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedClass}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input
                    value={examForm.name}
                    onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Mid-Term Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam Date</Label>
                  <Input
                    type="date"
                    value={examForm.examDate}
                    onChange={(e) => setExamForm(prev => ({ ...prev, examDate: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) => setExamForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the exam details..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Instructions</Label>
                  <Button variant="outline" size="sm" onClick={addInstruction}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Instruction
                  </Button>
                </div>
                {examForm.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Instruction ${index + 1}`}
                    />
                    {examForm.instructions.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeInstruction(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateExam}
                  disabled={createExamMutation.isPending}
                >
                  {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
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

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exams List
            </div>
            <Badge variant="secondary">
              {exams.length} exams
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !selectedClass ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Select a Class</h3>
              <p className="text-muted-foreground">
                Please select a class to view exams.
              </p>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Exams Found</h3>
              <p className="text-muted-foreground">
                No exams have been created for this class yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{exam.name}</h3>
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(exam.examDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.classId.name} - {exam.subjectId.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.totalMarks} marks</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(exam)}
                      <Button variant="ghost" size="sm" onClick={() => handleEditExam(exam)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherExams;
