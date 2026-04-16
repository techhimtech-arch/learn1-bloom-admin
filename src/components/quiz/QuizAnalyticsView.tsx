import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, Trophy, Clock, TrendingUp, BookOpen, Target } from 'lucide-react';
import { QuizAnalytics } from '@/types/quiz';

interface QuizAnalyticsViewProps {
  analytics: QuizAnalytics;
}

const QuizAnalyticsView: React.FC<QuizAnalyticsViewProps> = ({ analytics }) => {
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getParticipationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-600';
    if (rate >= 60) return 'bg-blue-600';
    if (rate >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Top Subjects
          </CardTitle>
          <CardDescription>Most active quiz subjects by submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topSubjects.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-800">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{subject.subjectName}</div>
                    <div className="text-sm text-muted-foreground">
                      {subject.quizCount} quiz{subject.quizCount !== 1 ? 'zes' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{subject.totalSubmissions}</div>
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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>Students with highest quiz performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{performer.studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {performer.totalQuizzes} quiz{performer.totalQuizzes !== 1 ? 'zes' : ''} taken
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getPerformanceColor(performer.averageScore)}`}>
                    {performer.averageScore.toFixed(1)}%
                  </div>
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participation by Class
          </CardTitle>
          <CardDescription>Quiz participation rates across different classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.participationByClass.map((classData, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{classData.className}</div>
                    <div className="text-sm text-muted-foreground">
                      {classData.participatedStudents} of {classData.totalStudents} students
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getPerformanceColor(classData.participationRate)}`}>
                      {classData.participationRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">participation</div>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={classData.participationRate} 
                    className="h-3"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-3 rounded-full ${getParticipationColor(classData.participationRate)}`}
                    style={{ width: `${classData.participationRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Insights
          </CardTitle>
          <CardDescription>Important observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Engagement Level</h4>
              <p className="text-sm text-blue-800">
                {analytics.averageParticipation >= 80 
                  ? "Excellent student engagement across all classes!"
                  : analytics.averageParticipation >= 60
                  ? "Good engagement with room for improvement."
                  : "Consider strategies to improve quiz participation."
                }
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Quiz Activity</h4>
              <p className="text-sm text-green-800">
                {analytics.activeQuizzes > analytics.totalQuizzes * 0.3
                  ? "High number of active quizzes keeping students engaged."
                  : "Consider publishing more quizzes to maintain engagement."
                }
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Subject Performance</h4>
              <p className="text-sm text-purple-800">
                {analytics.topSubjects.length > 0
                  ? `${analytics.topSubjects[0].subjectName} leads with ${analytics.topSubjects[0].quizCount} quizzes.`
                  : "Start creating quizzes to see subject performance data."
                }
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">Student Achievement</h4>
              <p className="text-sm text-orange-800">
                {analytics.topPerformers.length > 0
                  ? `Top performer: ${analytics.topPerformers[0].studentName} with ${analytics.topPerformers[0].averageScore.toFixed(1)}% average.`
                  : "No quiz data available yet."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizAnalyticsView;
