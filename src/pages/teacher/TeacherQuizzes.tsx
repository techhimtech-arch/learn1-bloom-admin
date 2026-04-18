import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Users, Trophy, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { teacherQuizService, quizUtils } from '@/services/quizService';
import { Quiz, QuizFilters } from '@/types/quiz';
import QuizCreateForm from '@/components/quiz/QuizCreateForm';
import QuizResultsView from '@/components/quiz/QuizResultsView';
import QuizLeaderboardView from '@/components/quiz/QuizLeaderboardView';

const TeacherQuizzes: React.FC = () => {
  const [filters, setFilters] = useState<QuizFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const queryClient = useQueryClient();

  // Fetch quizzes
  const { data: quizzesData, isLoading, error } = useQuery({
    queryKey: ['teacher-quizzes', filters],
    queryFn: () => teacherQuizService.getQuizzes(filters),
  });

  // Publish quiz mutation
  const publishQuizMutation = useMutation({
    mutationFn: teacherQuizService.publishQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      toast({ title: 'Success', description: 'Quiz published successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to publish quiz',
        variant: 'destructive' 
      });
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: teacherQuizService.deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      toast({ title: 'Success', description: 'Quiz deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to delete quiz',
        variant: 'destructive' 
      });
    },
  });

  const handlePublishQuiz = (quizId: string) => {
    publishQuizMutation.mutate(quizId);
  };

  const handleDeleteQuiz = (quizId: string) => {
    deleteQuizMutation.mutate(quizId);
  };

  const handleViewResults = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowResultsDialog(true);
  };

  const handleViewLeaderboard = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowLeaderboardDialog(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowCreateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'DRAFT': 'secondary',
      'PUBLISHED': 'default',
      'ACTIVE': 'default',
      'ENDED': 'outline',
      'CANCELLED': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{quizUtils.formatQuizStatus(status)}</Badge>;
  };

  const filteredQuizzes = quizzesData?.data?.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getQuizzesByStatus = (status: string) => {
    if (status === 'all') return filteredQuizzes;
    return filteredQuizzes.filter(quiz => quiz.status === status);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error loading quizzes</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Create and manage quizzes for your classes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedQuiz(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
              <DialogDescription>
                {selectedQuiz ? 'Edit quiz details and questions' : 'Fill in the details to create a new quiz'}
              </DialogDescription>
            </DialogHeader>
            <QuizCreateForm 
              quiz={selectedQuiz}
              onSuccess={() => {
                setShowCreateDialog(false);
                setSelectedQuiz(null);
                queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
              }}
              onCancel={() => {
                setShowCreateDialog(false);
                setSelectedQuiz(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Quizzes ({filteredQuizzes.length})</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft ({getQuizzesByStatus('DRAFT').length})</TabsTrigger>
          <TabsTrigger value="PUBLISHED">Published ({getQuizzesByStatus('PUBLISHED').length})</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active ({getQuizzesByStatus('ACTIVE').length})</TabsTrigger>
          <TabsTrigger value="ENDED">Ended ({getQuizzesByStatus('ENDED').length})</TabsTrigger>
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
                        {getStatusBadge(quiz.status)}
                        <Badge variant="outline">{quizUtils.formatQuizType(quiz.quizType)}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {quiz.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishQuiz(quiz._id)}
                          disabled={publishQuizMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                      )}
                      {quiz.status === 'PUBLISHED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublishQuiz(quiz._id)}
                          disabled={publishQuizMutation.isPending}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{quiz.classId.name} - {quiz.sectionId.name}</span>
                    </div>
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
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewResults(quiz)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Results
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewLeaderboard(quiz)}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Leaderboard
                    </Button>
                    {quiz.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deleteQuizMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteQuiz(quiz._id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getQuizzesByStatus(activeTab).length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No quizzes found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
            <DialogDescription>
              View detailed results and submissions for this quiz
            </DialogDescription>
          </DialogHeader>
          {selectedQuiz && (
            <QuizResultsView 
              quizId={selectedQuiz._id}
              onClose={() => setShowResultsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboardDialog} onOpenChange={setShowLeaderboardDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Leaderboard</DialogTitle>
            <DialogDescription>
              View top performers for this quiz
            </DialogDescription>
          </DialogHeader>
          {selectedQuiz && (
            <QuizLeaderboardView 
              quizId={selectedQuiz._id}
              onClose={() => setShowLeaderboardDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherQuizzes;
