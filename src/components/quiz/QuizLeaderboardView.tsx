import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Trophy, Medal, Award, Crown, Star, Download } from 'lucide-react';
import { teacherQuizService } from '@/services/quizService';
import { QuizLeaderboardResponse, LeaderboardEntry } from '@/types/quiz';

interface QuizLeaderboardViewProps {
  quizId: string;
  onClose: () => void;
}

const QuizLeaderboardView: React.FC<QuizLeaderboardViewProps> = ({ quizId, onClose }) => {
  const [limit, setLimit] = useState(10);

  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['quiz-leaderboard', quizId, limit],
    queryFn: () => teacherQuizService.getQuizLeaderboard(quizId, limit),
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-800">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-800">3rd</Badge>;
    return <Badge variant="outline">{rank}th</Badge>;
  };

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error loading leaderboard</div>;
  }

  const quiz = leaderboardData?.data?.quiz;
  const leaderboard = leaderboardData?.data?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Leaderboard
          </CardTitle>
          <CardDescription>
            Top performers for {quiz?.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quiz?.maxMarks}</div>
              <div className="text-sm text-muted-foreground">Maximum Marks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{leaderboard.length}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {leaderboard.length > 0 ? leaderboard[0].percentage.toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Highest Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show top:</span>
          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">students</span>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Leaderboard
        </Button>
      </div>

      {/* Top 3 Winners */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((entry, index) => (
            <Card key={entry._id} className={`text-center ${
              index === 0 ? 'border-yellow-200 bg-yellow-50' :
              index === 1 ? 'border-gray-200 bg-gray-50' :
              'border-orange-200 bg-orange-50'
            }`}>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  {getRankIcon(index + 1)}
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {entry.studentId.firstName} {entry.studentId.lastName}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {entry.studentId.admissionNumber}
                </p>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {entry.percentage.toFixed(1)}%
                  </div>
                  <Badge className={getGradeColor(entry.grade)}>
                    {entry.grade}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
          <CardDescription>
            Complete ranking of all participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry._id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {entry.studentId.firstName} {entry.studentId.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {entry.studentId.admissionNumber}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {entry.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score
                    </div>
                  </div>
                  <Badge className={getGradeColor(entry.grade)}>
                    {entry.grade}
                  </Badge>
                  {getRankBadge(index + 1)}
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No submissions yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <DialogFooter>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
};

export default QuizLeaderboardView;
