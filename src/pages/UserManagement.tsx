import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DataTable, { Column } from '@/components/shared/DataTable';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: 'active' | 'inactive';
}

const mockUsers: UserData[] = [
  { id: '1', name: 'John Doe', email: 'john@school.edu', role: 'school_admin', phone: '+91-9876543210', status: 'active' },
  { id: '2', name: 'Mrs. Sharma', email: 'sharma@school.edu', role: 'teacher', phone: '+91-9876543211', status: 'active' },
  { id: '3', name: 'Mr. Gupta', email: 'gupta@school.edu', role: 'teacher', phone: '+91-9876543212', status: 'active' },
  { id: '4', name: 'Rajesh Patel', email: 'rajesh@email.com', role: 'parent', phone: '+91-9876543213', status: 'active' },
  { id: '5', name: 'Aarav Patel', email: 'aarav@school.edu', role: 'student', phone: '', status: 'active' },
];

const roleColors: Record<string, string> = {
  school_admin: 'bg-primary/10 text-primary',
  teacher: 'bg-secondary/10 text-secondary',
  student: 'bg-success/10 text-success',
  parent: 'bg-warning/10 text-warning',
};

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'teacher', phone: '', password: '' });

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: form.name, email: form.email, role: form.role, phone: form.phone } : u));
      toast({ title: 'Updated', description: `${form.name} has been updated.` });
    } else {
      setUsers([...users, { id: Date.now().toString(), name: form.name, email: form.email, role: form.role, phone: form.phone, status: 'active' }]);
      toast({ title: 'Created', description: `${form.name} has been added.` });
    }
    setDialogOpen(false);
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'teacher', phone: '', password: '' });
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone, password: '' });
    setDialogOpen(true);
  };

  const selectClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const columns: Column<UserData>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (val: string) => (
      <Badge variant="secondary" className={roleColors[val] || ''}>{val.replace('_', ' ')}</Badge>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <Badge variant={val === 'active' ? 'default' : 'secondary'}>{val}</Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage users and assign roles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingUser(null); setForm({ name: '', email: '', role: 'teacher', phone: '', password: '' }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={selectClasses}>
                  <option value="school_admin">School Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <Button onClick={handleSave} className="w-full">{editingUser ? 'Update' : 'Create'} User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {['school_admin', 'teacher', 'student', 'parent'].map(role => (
          <Card key={role}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${roleColors[role]}`}>
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{users.filter(u => u.role === role).length}</p>
                <p className="text-xs capitalize text-muted-foreground">{role.replace('_', ' ')}s</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        actions={(row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
              setUsers(users.filter(u => u.id !== row.id));
              toast({ variant: 'destructive', title: 'Deleted', description: `${row.name} has been removed.` });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default UserManagement;
