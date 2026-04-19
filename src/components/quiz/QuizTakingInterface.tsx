import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { studentQuizService, quizUtils } from '@/services/quizService';
import { StudentQuiz, QuizStartResponse, QuizAnswerRequest, QuizSubmitResponse, ApiResponse } from '@/types/quiz';

interface QuizTakingInterfaceProps {
  quiz: StudentQuiz;
  onComplete: () => void;
}

const QuizTakingInterface: React.FC<QuizTakingInterfaceProps> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Start quiz query
  const { data: quizStartData, isLoading: isStartingQuiz } = useQuery({
    queryKey: ['quiz-start', quiz._id],
    queryFn: () => studentQuizService.startQuiz(quiz._id),
    enabled: !quizStarted,
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionIndex, selectedAnswer }: QuizAnswerRequest) =>
      studentQuizService.submitAnswer(quiz._id, { questionIndex, selectedAnswer }),
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: () => studentQuizService.submitQuiz(quiz._id),
    onSuccess: (data: ApiResponse<QuizSubmitResponse>) => {
      toast({ 
        title: 'Quiz Completed!', 
        description: `You scored ${data.data?.results.percentage}% (${data.data?.results.grade})` 
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to submit quiz',
        variant: 'destructive' 
      });
      setIsSubmitting(false);
    },
  });

  const questions = quizStartData?.data?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Initialize quiz data
  useEffect(() => {
    if (quizStartData?.data && !quizStarted) {
      setTimeRemaining(quizStartData.data.timeRemaining);
      setQuizStarted(true);
    }
  }, [quizStartData, quizStarted]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 && quizStarted) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, quizStarted]);

  // Save answer when user selects an option
  const handleAnswerSelect = useCallback(async (questionIndex: number, selectedAnswer: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: selectedAnswer }));
    
    try {
      await submitAnswerMutation.mutateAsync({ questionIndex, selectedAnswer });
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  }, [submitAnswerMutation]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    submitQuizMutation.mutate();
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isCurrentQuestionAnswered = () => {
    return answers[currentQuestionIndex] !== undefined;
  };

  if (isStartingQuiz) {
    return <div className="flex items-center justify-center h-64">Starting quiz...</div>;
  }

  if (!quizStarted || !currentQuestion) {
    return <div className="flex items-center justify-center h-64">Loading quiz...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {getAnsweredCount()}/{totalQuestions} Answered
              </Badge>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">
                  {quizUtils.formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-1">
              Q{currentQuestionIndex + 1}
            </Badge>
            <div className="flex-1">
              <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
              <CardDescription>Mark: {currentQuestion.marks} points</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={answers[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, parseInt(value))}
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {String.fromCharCode(65 + index)}
                    </Badge>
                    <span>{option}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {submitAnswerMutation.isPending && (
            <Alert>
              <Save className="h-4 w-4" />
              <AlertDescription>Saving your answer...</AlertDescription>
            </Alert>
          )}

          {isCurrentQuestionAnswered() && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your answer has been saved.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Progress: {currentQuestionIndex + 1} / {totalQuestions}
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || submitQuizMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting || submitQuizMutation.isPending ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Overview</CardTitle>
          <CardDescription>
            Click on any question number to jump directly to it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? 'default' : 'outline'}
                size="sm"
                className={`h-10 w-10 ${
                  answers[index] !== undefined 
                    ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' 
                    : ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-gray-300 rounded"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Current</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Warning */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Time Warning:</strong> You have less than 5 minutes remaining. Please complete and submit your quiz soon.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default QuizTakingInterface;
