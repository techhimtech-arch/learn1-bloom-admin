import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Trophy, Target, BookOpen } from 'lucide-react';
import { studentQuizService } from '@/services/quizService';
import { QuizStudentResults } from '@/types/quiz';

interface QuizResultsViewProps {
  quizId: string;
  onClose: () => void;
}

const QuizResultsView: React.FC<QuizResultsViewProps> = ({ quizId, onClose }) => {
  const { data: resultsData, isLoading, error } = useQuery({
    queryKey: ['student-quiz-results', quizId],
    queryFn: () => studentQuizService.getQuizResults(quizId),
  });

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

  const getPerformanceMessage = (percentage: number, grade: string) => {
    if (percentage >= 90) return "Outstanding performance! Excellent work!";
    if (percentage >= 80) return "Great job! Keep up the excellent work!";
    if (percentage >= 70) return "Good performance! Room for improvement.";
    if (percentage >= 60) return "Satisfactory performance. Keep practicing!";
    if (percentage >= 50) return "You passed! Review the material and try again.";
    return "Keep trying! Review the explanations and practice more.";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error loading results</div>;
  }

  const quiz = resultsData?.data?.quiz;
  const submission = resultsData?.data?.submission;

  if (!quiz || !submission) {
    return <div className="text-center text-muted-foreground">No results available</div>;
  }

  const performanceMessage = getPerformanceMessage(submission.percentage, submission.grade);
  const accuracy = (submission.correctAnswers / submission.totalQuestions) * 100;

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Results
          </CardTitle>
          <CardDescription>
            {quiz.title} - Attempt #{submission.attemptNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(submission.grade).split(' ')[1]}`}>
                  {submission.percentage.toFixed(1)}%
                </div>
                <Badge className={`mt-2 ${getGradeColor(submission.grade)}`}>
                  {submission.grade}
                </Badge>
                <div className="mt-2 text-sm text-muted-foreground">
                  {submission.marksObtained} / {quiz.maxMarks} marks
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${submission.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {submission.passed ? '✓ PASSED' : '✗ FAILED'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Passing score: {quiz.passingMarks} marks ({((quiz.passingMarks / quiz.maxMarks) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{submission.correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{submission.wrongAnswers}</div>
                  <div className="text-sm text-muted-foreground">Wrong</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-semibold">{accuracy.toFixed(1)}%</span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time taken: {submission.timeTakenFormatted}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-center text-blue-800 font-medium">
              {performanceMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Detailed Answers
          </CardTitle>
          <CardDescription>
            Review your answers and explanations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submission.answers.map((answer, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">
                      Question {index + 1}
                    </h4>
                    <p className="text-muted-foreground">{answer.question}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Your Answer:</span>
                        <div className={`mt-1 p-2 rounded ${
                          answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        } border`}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {String.fromCharCode(65 + answer.selectedAnswer)}
                            </Badge>
                            <span>{answer.options[answer.selectedAnswer]}</span>
                          </div>
                        </div>
                      </div>
                      
                      {!answer.isCorrect && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Correct Answer:</span>
                          <div className="mt-1 p-2 rounded bg-green-50 border-green-200 border">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                {String.fromCharCode(65 + answer.correctAnswer)}
                              </Badge>
                              <span>{answer.options[answer.correctAnswer]}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {answer.explanation && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Explanation:</span>
                        </div>
                        <p className="text-sm text-blue-800">{answer.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <DialogFooter>
        <div className="flex gap-2">
          <Button variant="outline">
            Download Results
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
