import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { showApiSuccess, showApiError, getApiFieldErrors } from '@/lib/api-toast';
import { Plus, Edit, Trash2, Shield, Search, ChevronLeft, ChevronRight, Users, Loader2 } from 'lucide-react';
import { userApi } from '@/services/api';

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UserStats {
  totalUsers: number;
  roleBreakdown: { role: string; count: number }[];
}

const roleColors: Record<string, string> = {
  school_admin: 'bg-primary/10 text-primary border-primary/20',
  teacher: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  accountant: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  student: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  parent: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
};

const roleIcons: Record<string, string> = {
  teacher: '👨‍🏫',
  accountant: '💼',
  student: '🎓',
  parent: '👨‍👩‍👧',
};

const ROLES = ['teacher', 'accountant', 'parent', 'student'] as const;

const UserManagement = () => {
  const { toast } = useToast();

  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (searchDebounce) params.search = searchDebounce;
      if (roleFilter) params.role = roleFilter;
      const { data } = await userApi.getAll(params as any);
      setUsers(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [searchDebounce, roleFilter, toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await userApi.getStats();
      setStats(data.data);
    } catch {
      // silent fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Validation
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2)
      errors.firstName = 'First name must be at least 2 characters';
    if (!form.lastName.trim() || form.lastName.trim().length < 2)
      errors.lastName = 'Last name must be at least 2 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Please provide a valid email';
    if (!editingUser) {
      if (!form.password || form.password.length < 6)
        errors.password = 'Password must be at least 6 characters';
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        errors.password = 'Must contain uppercase, lowercase, and number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      if (editingUser) {
        const res = await userApi.update(editingUser._id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          name: fullName,
          email: form.email.trim(),
          role: form.role,
        });
        showApiSuccess(res);
      } else {
        const res = await userApi.create({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          name: fullName,
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
        showApiSuccess(res);
      }
      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err: any) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) {
        setFormErrors(fieldErrors);
      } else {
        showApiError(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await userApi.delete(deleteTarget._id);
      showApiSuccess(res);
      setDeleteTarget(null);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err: any) {
      showApiError(err, 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, password: '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', role: 'teacher', password: '' });
    setFormErrors({});
  };

  const getRoleCount = (role: string) => {
    if (!stats) return 0;
    return stats.roleBreakdown.find(r => r.role === role)?.count || 0;
  };

  const selectClasses =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage teachers, accountants and other staff — {stats ? stats.totalUsers : '…'} total users
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingUser(null); resetForm(); }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John"
                    maxLength={50}
                  />
                  {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
                    maxLength={50}
                  />
                  {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john.doe@school.com"
                  maxLength={255}
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={selectClasses}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label>
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 chars, upper+lower+number"
                    maxLength={128}
                  />
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <Card key={role} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${roleColors[role]}`}>
                {roleIcons[role] || <Shield className="h-4 w-4" />}
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="mb-1 h-6 w-8" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{getRoleCount(role)}</p>
                )}
                <p className="text-xs capitalize text-muted-foreground">{role}s</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            maxLength={100}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`${selectClasses} w-full sm:w-40`}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Email</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Role</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[user.role] || ''}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages} — {pagination.total} total users
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
