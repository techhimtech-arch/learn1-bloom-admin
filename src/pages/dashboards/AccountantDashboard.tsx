import { IndianRupee, Receipt, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';

const AccountantDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accountant Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Accountant'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="Total Collection" value="—" change="This month" changeType="neutral" icon={IndianRupee} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Pending Fees" value="—" change="Students" changeType="neutral" icon={Receipt} iconColor="bg-warning/10 text-warning" />
        <StatWidget title="Reports" value="—" change="Generated" changeType="neutral" icon={BarChart3} iconColor="bg-secondary/10 text-secondary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fee Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fee collection summary, pending payments, and financial reports will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountantDashboard;
