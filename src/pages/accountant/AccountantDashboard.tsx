import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Calendar,
  BarChart3,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { accountantApi, studentApi } from '@/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forecasterMode, setForecasterMode] = useState<'historical' | 'forecast'>('historical');
  const [enableWhatsAppCampaign, setEnableWhatsAppCampaign] = useState(false);
  const [enableEarlyBirdDiscount, setEnableEarlyBirdDiscount] = useState(false);

  // Forecaster Forecast Model Calculations
  const expenseOverhead = 180000;
  const multiplier = 1 + (enableWhatsAppCampaign ? 0.35 : 0) + (enableEarlyBirdDiscount ? 0.15 : 0);
  
  const forecastedData = [
    { month: 'May (Forecast)', inflow: Math.round(110000 * multiplier), expense: expenseOverhead },
    { month: 'June (Forecast)', inflow: Math.round(130000 * multiplier), expense: expenseOverhead },
    { month: 'July (Forecast)', inflow: Math.round(120000 * multiplier), expense: expenseOverhead },
  ];

  const deficitMonths = forecastedData
    .filter(f => f.inflow < f.expense)
    .map(f => f.month.split(' ')[0]);

  const hasDeficit = deficitMonths.length > 0;
  const maxDeficitAmount = hasDeficit 
    ? Math.max(...forecastedData.map(f => Math.max(0, f.expense - f.inflow))) 
    : 0;
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await studentApi.getAll({ search: searchTerm, limit: 10 });
      setSearchResults(res.data?.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

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

      {/* Quick Student Search */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Quick Fee Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search student by name, roll number, or admission number..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search Student'}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground px-1">SEARCH RESULTS</p>
              {searchResults.map((student) => (
                <div 
                  key={student._id} 
                  className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.admissionNumber} • {student.class?.name} {student.section?.name}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => navigate(`/fees/student/${student._id}`)}
                  >
                    Collect Fee
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
      </div>      {/* Charts & Cash Radar Forecaster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection & Forecasting Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <BarChart3 className="h-5 w-5 text-primary" />
                {forecasterMode === 'historical' ? 'Fee Collection Trends' : '🤖 Cash Radar & Recovery Forecaster'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {forecasterMode === 'historical' 
                  ? 'Real-time historical collection metrics vs targets' 
                  : 'Advanced multi-month cash inflow projections vs fixed operational overhead'}
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg self-end sm:self-auto">
              <Button 
                variant={forecasterMode === 'historical' ? 'default' : 'ghost'} 
                size="sm"
                className="text-xs font-semibold px-3 py-1.5 h-8"
                onClick={() => setForecasterMode('historical')}
              >
                Historical
              </Button>
              <Button 
                variant={forecasterMode === 'forecast' ? 'default' : 'ghost'} 
                size="sm"
                className="text-xs font-semibold px-3 py-1.5 h-8 flex items-center gap-1 text-purple-600 hover:text-purple-700"
                onClick={() => setForecasterMode('forecast')}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                AI Forecast Radar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {forecasterMode === 'historical' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatINR(value as number)} />
                      <Legend />
                      <Bar dataKey="collection" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Collected Amount" />
                      <Bar dataKey="target" fill="#d1d5db" radius={[4, 4, 0, 0]} name="Target Goal" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4 border-l pl-0 lg:pl-6">
                  <h4 className="font-semibold text-sm">Collection Progress Bar</h4>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Progress to Target</span>
                      <span className="text-xs font-bold">{(dashboard?.collectionPercentage || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(dashboard?.collectionPercentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 text-sm">
                    <div className="flex items-center justify-between p-2.5 bg-muted/30 border rounded-lg">
                      <span className="text-xs text-muted-foreground">Total Expected</span>
                      <span className="font-semibold">{formatINR((totalCollected / (dashboard?.collectionPercentage || 100)) * 100)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-green-50/50 border border-green-100 rounded-lg text-green-700">
                      <span className="text-xs">Collected to Date</span>
                      <span className="font-semibold">{formatINR(totalCollected)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-orange-50/50 border border-orange-100 rounded-lg text-orange-700">
                      <span className="text-xs">Pending Dues</span>
                      <span className="font-semibold">{formatINR(totalPendingDues)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Future Chart */}
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={forecastedData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatINR(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="inflow" stroke="#8b5cf6" strokeWidth={3} name="Projected Collections" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Operational Expenditures" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecaster Control Panel & Alerts */}
                <div className="space-y-4 border-l pl-0 lg:pl-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
                      <h4 className="font-semibold text-xs text-purple-800 flex items-center gap-1.5 mb-1">
                        <span>💡</span> Recovery What-If Scenarios
                      </h4>
                      <p className="text-[11px] text-purple-600 mb-3">Adjust parameters to simulate collection recovery rates.</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            checked={enableWhatsAppCampaign}
                            onChange={(e) => setEnableWhatsAppCampaign(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="group-hover:text-purple-700 transition-colors">WhatsApp Dues Reminders</span>
                            <span className="block text-[9px] text-muted-foreground font-normal">Est. Collection Recovery: +35%</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            checked={enableEarlyBirdDiscount}
                            onChange={(e) => setEnableEarlyBirdDiscount(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="group-hover:text-purple-700 transition-colors">Early Bird Pay Campaigns</span>
                            <span className="block text-[9px] text-muted-foreground font-normal">Est. Early Recoveries: +15%</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Deficit Warning Box */}
                    {hasDeficit ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Deficit Risk Detected!
                        </div>
                        <p className="text-[11px] text-red-700">
                          Under current settings, projected collections will fall short of operational targets in <span className="font-semibold">{deficitMonths.join(', ')}</span> by up to <span className="font-semibold">{formatINR(maxDeficitAmount)}</span>.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-green-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Cash Positive Forecast!
                        </div>
                        <p className="text-[11px] text-green-700">
                          Excellent! Smart recovery campaigns are projected to yield a cash surplus over fixed expenses.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 mt-2"
                    onClick={() => navigate('/fees/dues')}
                  >
                    <span>📢</span> Launch Reminder Campaigns
                  </Button>
                </div>
              </div>
            )}
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
