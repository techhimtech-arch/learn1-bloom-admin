import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { teacherQuizService } from '@/services/quizService';
import { QuizCreateRequest, QuizQuestion, Quiz } from '@/types/quiz';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { subjectApi, sectionApi, teacherApi, classApi } from '@/pages/services/api';
import { useAuth } from '@/contexts/AuthContext';

const quizFormSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().min(1, 'Description is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().optional().or(z.literal('')),
  sectionId: z.string().optional().or(z.literal('')),
  quizType: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'MIXED']),
  timeLimit: z.number().min(1, 'Time limit must be at least 1 minute'),
  maxMarks: z.number().min(1, 'Max marks must be at least 1'),
  passingMarks: z.number().min(0, 'Passing marks must be at least 0'),
  startsAt: z.string().min(1, 'Start time is required'),
  endsAt: z.string().min(1, 'End time is required'),
  allowRetake: z.boolean(),
  maxAttempts: z.number().min(1, 'Max attempts must be at least 1'),
  showCorrectAnswers: z.boolean(),
  showResultsImmediately: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  isSchoolWide: z.boolean(),
  questions: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    options: z.array(z.string()).min(2, 'At least 2 options required'),
    correctAnswer: z.number().min(0, 'Correct answer is required'),
    marks: z.number().min(1, 'Marks must be at least 1'),
    explanation: z.string().optional(),
  })).min(1, 'At least one question is required'),
}).refine((data) => data.passingMarks <= data.maxMarks, {
  message: 'Passing marks cannot be greater than max marks',
}).refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
  message: 'End time must be after start time',
}).refine((data) => data.isSchoolWide || (!!data.classId && !!data.sectionId), {
  message: 'Class and Section are required unless quiz is School Wide',
  path: ['classId'],
});

type QuizFormData = z.infer<typeof quizFormSchema>;

interface QuizCreateFormProps {
  quiz?: Quiz | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const QuizCreateForm: React.FC<QuizCreateFormProps> = ({ quiz, onSuccess, onCancel }) => {
  // Clear bad cache on component mount
  useEffect(() => {
    const cached = sessionStorage.getItem('quiz_classes');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // If cache has wrong structure, clear it
        if (!Array.isArray(parsed) || (parsed.length > 0 && !parsed[0]._id)) {
          console.log('🗑️ Clearing bad cache');
          sessionStorage.removeItem('quiz_classes');
          sessionStorage.removeItem('quiz_subjects');
        }
      } catch (e) {
        sessionStorage.removeItem('quiz_classes');
        sessionStorage.removeItem('quiz_subjects');
      }
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);

  // Load subjects from sessionStorage or API
  useEffect(() => {
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      console.log('🔄 Loading subjects...');
      try {
        // Try to get from sessionStorage first
        const cached = sessionStorage.getItem('quiz_subjects');
        if (cached && cached.startsWith('[') && cached.includes('_id')) {
          const parsed = JSON.parse(cached);
          // Validate it's actually an array of subjects
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]._id) {
            console.log('✅ Subjects from cache:', parsed);
            setSubjects(parsed);
            return;
          }
        }
        // Clear invalid cache
        sessionStorage.removeItem('quiz_subjects');
        
        // Fetch from API
        const response = await teacherApi.getClasses();
          console.log('📡 Full API response:', response);
          let data: any[] = [];
          
          // Navigate through nested structure: response.data.data.subjectAssignments
          const innerData = response?.data?.data;
          console.log('📦 Inner data:', innerData);
          
          if (innerData?.subjectAssignments && Array.isArray(innerData.subjectAssignments)) {
            // Extract unique subjects from assignments
            const subjectsSet = new Map();
            innerData.subjectAssignments.forEach((assignment: any) => {
              const subject = assignment.subjectId;
              console.log('Subject from assignment:', subject);
              if (subject && subject._id) {
                subjectsSet.set(subject._id, subject);
              }
            });
            data = Array.from(subjectsSet.values());
            console.log('✅ Extracted subjects:', data);
          }
          
        setSubjects(Array.isArray(data) ? data : []);
        // Cache in sessionStorage
        if (Array.isArray(data) && data.length > 0) {
          sessionStorage.setItem('quiz_subjects', JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Error loading subjects:', error);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

  // Load classes from sessionStorage or API
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      console.log('🔄 Loading classes...');
      try {
        // Try to get from sessionStorage first
        const cached = sessionStorage.getItem('quiz_classes');
        if (cached && cached.startsWith('[') && cached.includes('_id')) {
          const parsed = JSON.parse(cached);
          // Validate it's actually an array of classes
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]._id) {
            console.log('✅ Classes from cache:', parsed);
            setClasses(parsed);
            return;
          }
        }
        // Clear invalid cache
        sessionStorage.removeItem('quiz_classes');
        
        // Fetch from API
        const response = await teacherApi.getClasses();
        console.log('📡 Classes API response:', response);
        let data: any[] = [];
        
        // Navigate through nested structure: response.data.data
        const innerData = response?.data?.data;
        console.log('📦 Inner data:', innerData);
        
        if (innerData?.classTeacherAssignment?.classId) {
          // Extract just the class object from classTeacherAssignment
          const classObj = innerData.classTeacherAssignment.classId;
          console.log('Class object:', classObj);
          if (classObj && classObj._id) {
            data = [classObj];
            console.log('✅ Extracted class:', data);
          }
        }
        
        setClasses(Array.isArray(data) ? data : []);
        console.log('Set classes state to:', data);
        // Cache in sessionStorage
        if (Array.isArray(data) && data.length > 0) {
          sessionStorage.setItem('quiz_classes', JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Error loading classes:', error);
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Load sections based on selected class
  useEffect(() => {
    const loadSections = async () => {
      if (!selectedClass) {
        console.log('⚠️ No class selected, clearing sections');
        setSections([]);
        return;
      }
      
      console.log('🔄 Loading sections for class:', selectedClass);
      setLoadingSections(true);
      try {
        // Try to get from sessionStorage first
        const cacheKey = `quiz_sections_${selectedClass}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          console.log('✅ Sections from cache:', parsed);
          setSections(Array.isArray(parsed) ? parsed : []);
        } else {
          // Get sections from teacher classes data (which we loaded earlier)
          let data: any[] = [];
          
          // We need to re-fetch to get sections for the selected class
          try {
            const response = await teacherApi.getClasses();
            console.log('📡 Sections API response:', response);
            const innerData = response?.data?.data;
            
            if (innerData?.subjectAssignments && Array.isArray(innerData.subjectAssignments)) {
              // Find all unique sections for the selected class
              const sectionsSet = new Map();
              innerData.subjectAssignments.forEach((assignment: any) => {
                // Check if this assignment is for the selected class
                console.log('Assignment:', assignment.classId?._id, 'vs selected:', selectedClass);
                if (assignment.classId?._id === selectedClass) {
                  const section = assignment.sectionId;
                  if (section && section._id) {
                    sectionsSet.set(section._id, section);
                  }
                }
              });
              data = Array.from(sectionsSet.values());
              console.log('✅ Extracted sections:', data);
            } else if (innerData?.classTeacherAssignment?.sectionId) {
              // Fallback to classTeacherAssignment section
              const section = innerData.classTeacherAssignment.sectionId;
              if (section && section._id) {
                data = [section];
                console.log('✅ Extracted section from classTeacherAssignment:', data);
              }
            }
          } catch (error) {
            console.error('❌ Error fetching sections:', error);
          }
          
          setSections(Array.isArray(data) ? data : []);
          // Cache in sessionStorage
          if (Array.isArray(data) && data.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('❌ Error loading sections:', error);
        setSections([]);
      } finally {
        setLoadingSections(false);
      }
    };
    loadSections();
  }, [selectedClass]);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: quiz?.title || '',
      description: quiz?.description || '',
      subjectId: quiz?.subjectId._id || '',
      classId: quiz?.classId._id || '',
      sectionId: quiz?.sectionId._id || '',
      quizType: quiz?.quizType || 'MCQ',
      timeLimit: quiz?.timeLimit || 30,
      maxMarks: quiz?.maxMarks || 50,
      passingMarks: quiz?.passingMarks || 25,
      startsAt: quiz?.startsAt ? new Date(quiz.startsAt).toISOString().slice(0, 16) : '',
      endsAt: quiz?.endsAt ? new Date(quiz.endsAt).toISOString().slice(0, 16) : '',
      allowRetake: quiz?.allowRetake || false,
      maxAttempts: quiz?.maxAttempts || 3,
      showCorrectAnswers: quiz?.showCorrectAnswers || true,
      showResultsImmediately: quiz?.showResultsImmediately || true,
      randomizeQuestions: quiz?.randomizeQuestions || false,
      randomizeOptions: quiz?.randomizeOptions || false,
      isSchoolWide: quiz?.isSchoolWide || false,
      questions: quiz?.questions || [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          marks: 10,
          explanation: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const selectedQuizType = form.watch('quizType');
  const questions = form.watch('questions');

  useEffect(() => {
    if (quiz?.classId._id) {
      setSelectedClass(quiz.classId._id);
    }
  }, [quiz]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('=== QUIZ FORM STATE DEBUG ===');
    console.log('Subjects:', subjects);
    console.log('Classes:', classes);
    console.log('Sections:', sections);
    console.log('Selected Class:', selectedClass);
    console.log('Loading states:', { loadingSubjects, loadingClasses, loadingSections });
    console.log('=============================');
  }, [subjects, classes, sections, selectedClass, loadingSubjects, loadingClasses, loadingSections]);

  const handleAddQuestion = () => {
    append({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 10,
      explanation: '',
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleAddOption = (questionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    form.setValue(`questions.${questionIndex}.options`, [...currentOptions, '']);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
      form.setValue(`questions.${questionIndex}.options`, newOptions);
      
      // Adjust correctAnswer if necessary
      const correctAnswer = form.getValues(`questions.${questionIndex}.correctAnswer`);
      if (correctAnswer >= newOptions.length) {
        form.setValue(`questions.${questionIndex}.correctAnswer`, 0);
      }
    }
  };

  const onSubmit = async (data: QuizFormData) => {
    setIsSubmitting(true);
    try {
      const quizData: QuizCreateRequest = {
        ...data,
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
      } as QuizCreateRequest;

      if (quiz) {
        // Update existing quiz
        const response = await teacherQuizService.updateQuiz(quiz._id, quizData);
        showApiSuccess(response);
      } else {
        // Create new quiz
        const response = await teacherQuizService.createQuiz(quizData);
        showApiSuccess(response);
      }
      
      onSuccess();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalMarks = () => {
    return questions.reduce((total, question) => total + question.marks, 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for your quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quiz title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter quiz description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger disabled={loadingSubjects}>
                          <SelectValue placeholder={loadingSubjects ? "Loading subjects..." : "Select subject"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(subjects) && subjects.map((subject: any) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={(value) => {
                      console.log('📍 Class selected:', value);
                      console.log('Current classes array:', classes);
                      field.onChange(value);
                      setSelectedClass(value);
                      form.setValue('sectionId', '');
                    }} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger disabled={loadingClasses} onClick={() => {
                          console.log('🖱️ Class dropdown clicked');
                          console.log('Classes loaded:', classes);
                          console.log('Loading state:', loadingClasses);
                        }}>
                          <SelectValue placeholder={loadingClasses ? "Loading classes..." : `Select class (${classes.length})`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(classes) && classes.length > 0 ? (
                          classes.map((cls: any) => (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-red-500 text-sm">
                            {loadingClasses ? "Loading..." : "No classes found"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedClass}>
                      <FormControl>
                        <SelectTrigger disabled={!selectedClass || loadingSections}>
                          <SelectValue placeholder={!selectedClass ? "Select class first" : loadingSections ? "Loading sections..." : "Select section"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(sections) && sections.map((section: any) => (
                          <SelectItem key={section._id} value={section._id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>Configure quiz parameters and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quizType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quiz type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MCQ">Multiple Choice</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                        <SelectItem value="MIXED">Mixed Type</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allowRetake"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Retake</FormLabel>
                      <FormDescription>
                        Allow students to retake the quiz
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Attempts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Configure how quiz results are displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="showCorrectAnswers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Correct Answers</FormLabel>
                      <FormDescription>
                        Display correct answers after submission
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showResultsImmediately"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Results Immediately</FormLabel>
                      <FormDescription>
                        Display results immediately after submission
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Randomize Questions</FormLabel>
                      <FormDescription>
                        Randomize question order for each student
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="randomizeOptions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Randomize Options</FormLabel>
                      <FormDescription>
                        Randomize option order for each question
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isSchoolWide"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">School Wide Quiz</FormLabel>
                    <FormDescription>
                      Make this quiz available to all students in the school
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add questions to your quiz</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Total Marks: {calculateTotalMarks()}
                </Badge>
                <Button type="button" onClick={handleAddQuestion} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, questionIndex) => (
              <Card key={field.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveQuestion(questionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your question here"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.marks`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {questions[questionIndex]?.options.map((_, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  Option {String.fromCharCode(65 + index)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.explanation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Explanation (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain the correct answer"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Options</FormLabel>
                    {questions[questionIndex]?.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline">
                            {String.fromCharCode(65 + optionIndex)}
                          </Badge>
                          <FormField
                            control={form.control}
                            name={`questions.${questionIndex}.options.${optionIndex}`}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  placeholder={`Option ${optionIndex + 1}`}
                                  {...field}
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                        {questions[questionIndex]?.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOption(questionIndex)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : quiz ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuizCreateForm;
