import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRoute } from '@/lib/role-config';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="max-w-md text-muted-foreground">
        You don't have permission to access this page.
        {user && (
          <span className="block mt-1 text-sm">
            Your role: <strong className="capitalize">{user.role.replace('_', ' ')}</strong>
          </span>
        )}
      </p>
      <Button onClick={() => navigate(getDefaultRoute(user?.role || ''), { replace: true })}>
        Go to Dashboard
      </Button>
    </div>
  );
};

export default Unauthorized;
