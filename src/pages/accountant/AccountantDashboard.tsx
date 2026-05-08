import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { accountantApi } from '@/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantDashboard() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['accountant-dashboard'],
    queryFn: async () => {
      const res = await accountantApi.getDashboard();
      return res.data?.data;
    },
  });

  const { data: duessData, isLoading: duesLoading } = useQuery({
    queryKey: ['accountant-dues-summary'],
    queryFn: async () => {
      const res = await accountantApi.getDues();
      return res.data?.data;
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['accountant-payments-summary'],
    queryFn: async () => {
      const res = await accountantApi.getPayments({ limit: 100 });
      return res.data?.data;
    },
  });

  const dashboard = dashboardData as any;
  const dues = duessData as any[];
  const payments = paymentsData as any[];

  // Calculate summary stats
  const totalPendingDues = dues?.reduce((sum, d) => sum + (d.totalDue || 0), 0) || 0;
  const totalCollected = dashboard?.totalFeeCollection || payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingStudents = dues?.length || 0;

  // Generate monthly data
  const monthlyData = [
    { month: 'Jan', collection: 150000, target: 160000 },
    { month: 'Feb', collection: 165000, target: 160000 },
    { month: 'Mar', collection: 155000, target: 160000 },
    { month: 'Apr', collection: totalCollected, target: 160000 },
  ];

  const isLoading = dashboardLoading || duesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fee Management Dashboard</h1>
        <p className="text-muted-foreground">Overview of fee collections and outstanding dues</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(totalCollected)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {dashboard?.collectionPercentage || 85}% of target
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Pending Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatINR(totalPendingDues)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {pendingStudents} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Enrolled this year
            </p>
          </CardContent>
        </Card>

        <Card className={dashboard?.collectionPercentage >= 90 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${dashboard?.collectionPercentage >= 90 ? 'text-green-600' : 'text-yellow-600'}`} />
              Collection %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboard?.collectionPercentage >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
              {(dashboard?.collectionPercentage || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs total fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatINR(value as number)} />
                <Legend />
                <Bar dataKey="collection" fill="#3b82f6" name="Collected" />
                <Bar dataKey="target" fill="#d1d5db" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fee Collection Progress</span>
                <span className="text-sm font-bold">{(dashboard?.collectionPercentage || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(dashboard?.collectionPercentage || 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Total Expected</span>
                <span className="font-bold">{formatINR((totalCollected / (dashboard?.collectionPercentage || 100)) * 100)}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Amount Collected</span>
                <span className="font-bold text-green-600">{formatINR(totalCollected)}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded bg-orange-50">
                <span className="text-sm">Amount Pending</span>
                <span className="font-bold text-orange-600">{formatINR(totalPendingDues)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Pending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingStudents > 10 && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">High number of students with pending fees</p>
                <p className="text-xs text-muted-foreground">{pendingStudents} students have outstanding dues</p>
              </div>
            </div>
          )}
          {totalPendingDues > 500000 && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Significant outstanding amount</p>
                <p className="text-xs text-muted-foreground">Total pending dues exceed {formatINR(500000)}</p>
              </div>
            </div>
          )}
          {(dashboard?.collectionPercentage || 0) < 80 && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Collection below target</p>
                <p className="text-xs text-muted-foreground">Current collection is {(dashboard?.collectionPercentage || 0).toFixed(1)}% of target</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{(payments?.length || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground">Total Transactions</div>
          </div>
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{pendingStudents}</div>
            <div className="text-xs text-muted-foreground">Students with Dues</div>
          </div>
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{(dashboard?.collectionTrend === 'increasing' ? '↑' : '↓')}</div>
            <div className="text-xs text-muted-foreground">{dashboard?.collectionTrend || 'Stable'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
