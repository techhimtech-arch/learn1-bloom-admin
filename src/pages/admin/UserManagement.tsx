import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Edit, Trash2, Shield, Search, ChevronLeft, ChevronRight, Users, Loader2, Key } from 'lucide-react';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

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
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<UserData | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetPasswordErrors, setResetPasswordErrors] = useState<Record<string, string>>({});

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

  // Password Reset Handlers
  const validateResetPassword = () => {
    const errors: Record<string, string> = {};
    const pwd = resetPasswordForm.newPassword;
    
    if (!pwd) {
      errors.newPassword = 'Password is required';
    } else if (pwd.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    } else if (pwd.length > 128) {
      errors.newPassword = 'Password must be at most 128 characters';
    } else if (!/[A-Z]/.test(pwd)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(pwd)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/\d/.test(pwd)) {
      errors.newPassword = 'Password must contain at least one number';
    }
    
    if (!resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm the password';
    } else if (resetPasswordForm.confirmPassword !== pwd) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setResetPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateResetPassword() || !resetPasswordTarget) return;
    
    setResettingPassword(true);
    try {
      const res = await userApi.adminResetPassword(resetPasswordTarget._id, resetPasswordForm.newPassword);
      showApiSuccess(res, 'Password reset successfully. Please inform the user of their new password.');
      setResetPasswordDialogOpen(false);
      setResetPasswordTarget(null);
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
      setResetPasswordErrors({});
    } catch (err: any) {
      showApiError(err, 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const openResetPasswordDialog = (user: UserData) => {
    setResetPasswordTarget(user);
    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    setResetPasswordErrors({});
    setResetPasswordDialogOpen(true);
  };

  const selectClasses =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <motion.div 
      className="space-y-8 p-6 pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-lg">
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
      </motion.div>

      {/* Role Stats */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <motion.div key={role} whileHover={{ y: -5, scale: 1.02 }}>
            <Card className="relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-xl p-2 shadow-sm transition-all hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${roleColors[role]}`}>
                  {roleIcons[role] || <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground capitalize">{role}s</p>
                  {statsLoading ? (
                    <Skeleton className="mt-1 h-8 w-12" />
                  ) : (
                    <h3 className="text-3xl font-bold tracking-tight mt-1 text-foreground">{getRoleCount(role)}</h3>
                  )}
                </div>
              </CardContent>
              {/* Decorative background element */}
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${roleColors[role].split(' ')[0]} blur-2xl opacity-40`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <CardTitle className="text-2xl">All Users</CardTitle>
              </div>
              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 backdrop-blur-sm border-border/50 focus:ring-primary/50 transition-all"
                    maxLength={100}
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All Roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold py-4">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
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
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      <p>No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group border-b hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.firstName?.charAt(0).toUpperCase()}
                          </div>
                          {(user as any).name || `${user.firstName} ${user.lastName}`}
                        </div>
                      </TableCell>
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
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => openResetPasswordDialog(user)}
                            title="Reset User Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Pagination */}
      <motion.div variants={itemVariants}>
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) {
          setResetPasswordTarget(null);
          setResetPasswordForm({ newPassword: '', confirmPassword: '' });
          setResetPasswordErrors({});
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {resetPasswordTarget && (
              <div className="bg-muted/50 p-3 rounded-md border border-border">
                <p className="text-sm text-muted-foreground">User:</p>
                <p className="font-semibold text-foreground">
                  {resetPasswordTarget.firstName} {resetPasswordTarget.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{resetPasswordTarget.email}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={resetPasswordForm.newPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                placeholder="Min 6 chars: uppercase, lowercase, number"
                maxLength={128}
              />
              {resetPasswordErrors.newPassword && (
                <p className="text-xs text-destructive">{resetPasswordErrors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                • At least 6 characters<br/>
                • One uppercase letter (A-Z)<br/>
                • One lowercase letter (a-z)<br/>
                • One number (0-9)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter the password"
                maxLength={128}
              />
              {resetPasswordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{resetPasswordErrors.confirmPassword}</p>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                ⚠️ Make sure to inform the user of their new password through a secure channel (email, SMS, or in-person).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </motion.div>
  );
};

export default UserManagement;
