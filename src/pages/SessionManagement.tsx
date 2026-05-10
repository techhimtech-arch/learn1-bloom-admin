import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Globe, Trash2, LogOut, Loader2, Shield } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { toast } from '@/hooks/use-toast';

interface Session {
  _id: string;
  device?: string;
  browser?: string;
  ip?: string;
  os?: string;
  lastActive?: string;
  createdAt?: string;
  isCurrent?: boolean;
}

const SessionManagement = () => {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logoutAllConfirm, setLogoutAllConfirm] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.getSessions();
      setSessions(data.data || []);
    } catch (err) {
      showApiError(err, 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await authApi.revokeSession(sessionId);
      showApiSuccess(res, 'Session revoked');
      setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (err) {
      showApiError(err, 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast({ title: 'Success', description: 'Logged out from all devices' });
      await logout();
    } catch (err) {
      showApiError(err, 'Failed to logout from all devices');
    } finally {
      setLoggingOutAll(false);
      setLogoutAllConfirm(false);
    }
  };

  const getDeviceIcon = (session: Session) => {
    const device = (session.device || session.os || '').toLowerCase();
    if (device.includes('mobile') || device.includes('android') || device.includes('iphone'))
      return <Smartphone className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Sessions</h1>
          <p className="text-sm text-muted-foreground">Manage your active login sessions across devices</p>
        </div>
        <Button variant="destructive" onClick={() => setLogoutAllConfirm(true)} disabled={loading || sessions.length === 0}>
          <LogOut className="mr-2 h-4 w-4" /> Logout All Devices
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
            </div></CardContent></Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No active sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card key={session._id} className={session.isCurrent ? 'border-primary/50 bg-primary/5' : ''}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {getDeviceIcon(session)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {session.browser || 'Unknown Browser'}
                        {session.os ? ` on ${session.os}` : ''}
                      </span>
                      {session.isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {session.ip && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {session.ip}
                        </span>
                      )}
                      {session.createdAt && <span>Login: {formatDate(session.createdAt)}</span>}
                      {session.lastActive && <span>Last active: {formatDate(session.lastActive)}</span>}
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(session._id)}
                    disabled={revoking === session._id}
                  >
                    {revoking === session._id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 h-4 w-4" />
                    )}
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={logoutAllConfirm} onOpenChange={setLogoutAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from All Devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end all your active sessions including the current one. You will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOutAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll} disabled={loggingOutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loggingOutAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Logout All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionManagement;
