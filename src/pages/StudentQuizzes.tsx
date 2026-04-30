import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Play, Clock, Trophy, CheckCircle, XCircle, AlertCircle, Eye, BarChart3, RotateCcw } from 'lucide-react';
import { studentQuizService, quizUtils } from '@/services/quizService';
import { StudentQuiz, QuizStatistics } from '@/types/quiz';
import QuizTakingInterface from '@/components/quiz/QuizTakingInterface';
import QuizResultsView from '@/components/quiz/StudentQuizResultsView';

const StudentQuizzes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuiz | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  const queryClient = useQueryClient();

  // Fetch available quizzes
  const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['student-quizzes'],
    queryFn: () => studentQuizService.getAvailableQuizzes(),
  });

  // Fetch quiz statistics
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['student-quiz-stats'],
    queryFn: () => studentQuizService.getQuizStatistics(),
  });

  // Start quiz mutation
  const handleStartQuiz = (quiz: StudentQuiz) => {
    setSelectedQuiz(quiz);
    setShowQuizDialog(true);
  };

  const handleViewResults = (quiz: StudentQuiz) => {
    setSelectedQuiz(quiz);
    setShowResultsDialog(true);
  };

  const getStatusBadge = (quiz: StudentQuiz) => {
    if (quiz.submissionStatus === 'COMPLETED') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (quiz.submissionStatus === 'IN_PROGRESS') {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    } else if (!quizUtils.isQuizActive(quiz)) {
      return <Badge variant="outline">Not Available</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    }
  };

  const canStartQuiz = (quiz: StudentQuiz) => {
    return quizUtils.isQuizActive(quiz) && 
           (quiz.submissionStatus === 'NOT_ATTEMPTED' || 
            (quiz.submissionStatus === 'ATTEMPTED' && quiz.canRetake) ||
            (quiz.submissionStatus === 'COMPLETED' && quiz.canRetake));
  };

  const filteredQuizzes = quizzesData?.data?.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getQuizzesByStatus = (status: string) => {
    if (status === 'available') {
      return filteredQuizzes.filter(quiz => canStartQuiz(quiz));
    } else if (status === 'in-progress') {
      return filteredQuizzes.filter(quiz => quiz.submissionStatus === 'IN_PROGRESS');
    } else if (status === 'completed') {
      // Show quizzes that have been attempted and no retakes available
      return filteredQuizzes.filter(quiz => 
        (quiz.submissionStatus === 'ATTEMPTED' || quiz.submissionStatus === 'COMPLETED') && !quiz.canRetake
      );
    }
    return filteredQuizzes;
  };

  if (isLoadingQuizzes || isLoadingStats) {
    return <div className="flex items-center justify-center h-64">Loading quizzes...</div>;
  }

  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Quizzes</h1>
          <p className="text-muted-foreground">Take quizzes and view your results</p>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                <div className="text-sm text-muted-foreground">Total Quizzes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.passedCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.averagePercentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.bestScore.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Best Score</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      {/* Quiz Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap gap-1 sm:gap-2 justify-start">
          <TabsTrigger value="available">
            Available ({getQuizzesByStatus('available').length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({getQuizzesByStatus('in-progress').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getQuizzesByStatus('completed').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredQuizzes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4">
            {getQuizzesByStatus(activeTab).map((quiz) => (
              <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(quiz)}
                        <Badge variant="outline">{quizUtils.formatQuizType(quiz.quizType)}</Badge>
                        <Badge variant="outline">{quiz.subjectId.name}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{quiz.timeLimit} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{quiz.maxMarks} marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{quiz.totalQuestions} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        By {quiz.teacherId.firstName} {quiz.teacherId.lastName}
                      </span>
                    </div>
                  </div>

                  {/* Progress for attempted quizzes */}
                  {quiz.submissionStatus !== 'NOT_ATTEMPTED' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">
                          Attempt {quiz.attempts}/{quiz.maxAttempts}
                        </span>
                        <span className="text-green-600">Best: {quiz.bestScore}% ({quiz.bestGrade})</span>
                      </div>
                      <Progress value={quiz.bestScore} className="h-2 mb-2" />
                      {quiz.submissionStatus === 'ATTEMPTED' && quiz.canRetake && (
                        <p className="text-xs text-yellow-600 font-medium">
                          ✅ You can attempt {quiz.maxAttempts - quiz.attempts} more time(s)
                        </p>
                      )}
                      {quiz.submissionStatus === 'ATTEMPTED' && !quiz.canRetake && (
                        <p className="text-xs text-red-600 font-medium">
                          ❌ All attempts completed
                        </p>
                      )}
                    </div>
                  )}

                  {/* Time remaining for active quizzes */}
                  {quizUtils.isQuizActive(quiz) && (
                    <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Ends: {new Date(quiz.endsAt).toLocaleDateString()} at {new Date(quiz.endsAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {/* RETAKE LOGIC */}
                    {quiz.submissionStatus === 'NOT_ATTEMPTED' && (
                      <Button
                        onClick={() => handleStartQuiz(quiz)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Take Quiz
                      </Button>
                    )}
                    
                    {quiz.submissionStatus === 'ATTEMPTED' && quiz.canRetake && (
                      <Button
                        onClick={() => {
                          const remaining = quiz.maxAttempts - quiz.attempts;
                          const confirmed = window.confirm(
                            `🔄 RETAKE QUIZ\n\n` +
                            `Attempt: ${quiz.attempts}/${quiz.maxAttempts}\n` +
                            `Best Score: ${quiz.bestScore}% (${quiz.bestGrade})\n` +
                            `Remaining: ${remaining} more attempt(s)\n\n` +
                            `Ready to try again?`
                          );
                          if (confirmed) {
                            handleStartQuiz(quiz);
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake Quiz
                      </Button>
                    )}
                    
                    {quiz.submissionStatus === 'ATTEMPTED' && !quiz.canRetake && (
                      <Button
                        onClick={() => handleViewResults(quiz)}
                        variant="outline"
                        disabled
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        All Attempts Used
                      </Button>
                    )}
                    
                    {quiz.submissionStatus === 'ATTEMPTED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleViewResults(quiz)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Results
                      </Button>
                    )}

                    {quiz.submissionStatus === 'IN_PROGRESS' && (
                      <Button
                        onClick={() => handleStartQuiz(quiz)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Continue Quiz
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getQuizzesByStatus(activeTab).length === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {activeTab === 'available' && 'No available quizzes at the moment'}
                  {activeTab === 'in-progress' && 'No quizzes in progress'}
                  {activeTab === 'completed' && 'No completed quizzes yet'}
                  {activeTab === 'all' && 'No quizzes found'}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quiz Taking Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz: {selectedQuiz?.title}</DialogTitle>
            <DialogDescription>
              Answer all questions carefully. Your progress will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          {selectedQuiz && (
            <QuizTakingInterface 
              quiz={selectedQuiz}
              onComplete={() => {
                setShowQuizDialog(false);
                setSelectedQuiz(null);
                queryClient.invalidateQueries({ queryKey: ['student-quizzes'] });
                queryClient.invalidateQueries({ queryKey: ['student-quiz-stats'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="w-[96vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
            <DialogDescription>
              View your detailed quiz performance
            </DialogDescription>
          </DialogHeader>
          {selectedQuiz && (
            <QuizResultsView 
              quizId={selectedQuiz._id}
              onClose={() => {
                setShowResultsDialog(false);
                setSelectedQuiz(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentQuizzes;
