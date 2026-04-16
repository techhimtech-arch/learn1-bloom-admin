import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Search, BarChart3, Users, Trophy, Clock, TrendingUp, Trash2, Eye } from 'lucide-react';
import { adminQuizService } from '@/services/quizService';
import { AdminQuiz, QuizAnalytics, QuizFilters, QuizAnalyticsFilters } from '@/types/quiz';
import QuizAnalyticsView from '@/components/quiz/QuizAnalyticsView';

const AdminQuizzes: React.FC = () => {
  const [filters, setFilters] = useState<QuizFilters>({
    page: 1,
    limit: 20,
  });
  const [analyticsFilters, setAnalyticsFilters] = useState<QuizAnalyticsFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all quizzes
  const { data: quizzesData, isLoading: isLoadingQuizzes, error: quizzesError } = useQuery({
    queryKey: ['admin-quizzes', filters],
    queryFn: () => adminQuizService.getAllQuizzes(filters),
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['quiz-analytics', analyticsFilters],
    queryFn: () => adminQuizService.getQuizAnalytics(analyticsFilters),
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: adminQuizService.deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
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

  const handleDeleteQuiz = (quizId: string) => {
    deleteQuizMutation.mutate(quizId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'DRAFT': 'secondary',
      'PUBLISHED': 'default',
      'ACTIVE': 'default',
      'ENDED': 'outline',
      'CANCELLED': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const filteredQuizzes = quizzesData?.data?.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.teacherId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.teacherId.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingQuizzes || isLoadingAnalytics) {
    return <div className="flex items-center justify-center h-64">Loading quiz data...</div>;
  }

  const analytics = analyticsData?.data;
  const quizzes = filteredQuizzes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Admin overview and management of all school quizzes</p>
        </div>
        <Button onClick={() => setShowAnalyticsDialog(true)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">All Quizzes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">{analytics.totalQuizzes}</div>
                        <div className="text-sm text-muted-foreground">Total Quizzes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold">{analytics.activeQuizzes}</div>
                        <div className="text-sm text-muted-foreground">Active Quizzes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
                        <div className="text-sm text-muted-foreground">Total Submissions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold">{analytics.averageParticipation.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Participation Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Subjects */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Subjects</CardTitle>
                  <CardDescription>Most active quiz subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topSubjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-800">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{subject.subjectName}</div>
                            <div className="text-sm text-muted-foreground">
                              {subject.quizCount} quizzes
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{subject.totalSubmissions}</div>
                          <div className="text-sm text-muted-foreground">submissions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest quiz performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-800">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{performer.studentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {performer.totalQuizzes} quizzes
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{performer.averageScore.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">average score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Participation by Class */}
              <Card>
                <CardHeader>
                  <CardTitle>Participation by Class</CardTitle>
                  <CardDescription>Quiz participation rates across classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.participationByClass.map((classData, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{classData.className}</span>
                          <span>{classData.participationRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${classData.participationRate}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {classData.participatedStudents} of {classData.totalStudents} students
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* All Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ENDED">Ended</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quizzes Grid */}
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(quiz.status)}
                        <Badge variant="outline">{quiz.subjectId.name}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{quiz.teacherId.firstName} {quiz.teacherId.lastName}</span>
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{quiz.totalSubmissions}</div>
                      <div className="text-xs text-muted-foreground">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{quiz.averagePercentage.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{quiz.classId.name}</div>
                      <div className="text-xs text-muted-foreground">Class</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* Navigate to quiz details */}}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
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
                            Are you sure you want to delete "{quiz.title}"? This action cannot be undone and will remove all associated data.
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
            
            {quizzes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No quizzes found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Filters */}
          <div className="flex gap-4 items-center">
            <Input
              type="date"
              placeholder="Start date"
              value={analyticsFilters.startDate || ''}
              onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="End date"
              value={analyticsFilters.endDate || ''}
              onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-40"
            />
            <Button
              variant="outline"
              onClick={() => setAnalyticsFilters({})}
            >
              Clear Filters
            </Button>
          </div>

          {analytics && <QuizAnalyticsView analytics={analytics} />}
        </TabsContent>
      </Tabs>

      {/* Analytics Dialog */}
      <AlertDialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Quiz Analytics Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Comprehensive analytics and insights for school quizzes
            </AlertDialogDescription>
          </AlertDialogHeader>
          {analytics && <QuizAnalyticsView analytics={analytics} />}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAnalyticsDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminQuizzes;
