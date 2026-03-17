import { GraduationCap, ClipboardCheck, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Parent'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatWidget title="My Children" value="—" change="Enrolled" changeType="neutral" icon={GraduationCap} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Attendance" value="—" change="This month" changeType="neutral" icon={ClipboardCheck} iconColor="bg-secondary/10 text-secondary" />
        <StatWidget title="Fee Status" value="—" change="Pending" changeType="neutral" icon={IndianRupee} iconColor="bg-warning/10 text-warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Child's Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your child's attendance, grades, and fee information will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
