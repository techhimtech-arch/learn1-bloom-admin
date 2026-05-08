import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { IndianRupee, Receipt, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { accountantApi } from '@/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const AccountantDashboard = () => {
  const { user } = useAuth();

  // Recent payments (last 30 days approx via API default)
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['accountant-recent-payments'],
    queryFn: async () => {
      const res = await accountantApi.getPayments({ limit: 5 });
      return res.data;
    },
  });

  // Pending dues
  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ['accountant-dues-summary'],
    queryFn: async () => {
      const res = await accountantApi.getDues({ limit: 5 });
      return res.data;
    },
  });

  const payments = paymentsData?.data || [];
  const paymentsSummary = paymentsData?.summary || {};
  const dues = duesData?.data || [];
  const duesSummary = duesData?.summary || {};

  const totalCollection = paymentsSummary.totalPayments || 0;
  const totalPendingDues = duesSummary.totalPendingDues || 0;
  const pendingStudents = duesSummary.studentCount || dues.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accountant Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Accountant'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget
          title="Total Collection"
          value={paymentsLoading ? '—' : formatINR(totalCollection)}
          change="Recent payments"
          changeType="neutral"
          icon={IndianRupee}
          iconColor="bg-primary/10 text-primary"
        />
        <StatWidget
          title="Pending Dues"
          value={duesLoading ? '—' : formatINR(totalPendingDues)}
          change={`${pendingStudents} students`}
          changeType="neutral"
          icon={AlertTriangle}
          iconColor="bg-warning/10 text-warning"
        />
        <StatWidget
          title="Total Payments"
          value={paymentsLoading ? '—' : String(paymentsSummary.count || payments.length || 0)}
          change="Transactions"
          changeType="neutral"
          icon={Receipt}
          iconColor="bg-secondary/10 text-secondary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Recent Payments
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/fees/payments">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent payments.</p>
            ) : (
              <ul className="divide-y">
                {payments.slice(0, 5).map((p: any) => (
                  <li key={p.paymentId || p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.studentName || 'Student'}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.receiptNumber} • {p.date ? format(new Date(p.date), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">{formatINR(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Pending Dues
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/fees/dues">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {duesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : dues.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No pending dues 🎉</p>
            ) : (
              <ul className="divide-y">
                {dues.slice(0, 5).map((d: any) => (
                  <li key={d.studentId || d.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{d.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.className || d.class} {d.sectionName ? `- ${d.sectionName}` : ''} • {d.rollNumber}
                      </p>
                    </div>
                    <span className="font-semibold text-destructive">{formatINR(d.totalDue ?? d.dueAmount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountantDashboard;
