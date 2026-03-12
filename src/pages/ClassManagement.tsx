import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DataTable, { Column } from '@/components/shared/DataTable';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, School } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  sections: string[];
  capacity: number;
  currentStrength: number;
  classTeacher: string;
}

const mockClasses: ClassData[] = [
  { id: '1', name: 'Class 1', sections: ['A', 'B'], capacity: 80, currentStrength: 72, classTeacher: 'Mrs. Sharma' },
  { id: '2', name: 'Class 2', sections: ['A', 'B', 'C'], capacity: 120, currentStrength: 110, classTeacher: 'Mr. Gupta' },
  { id: '3', name: 'Class 3', sections: ['A', 'B'], capacity: 80, currentStrength: 65, classTeacher: 'Mrs. Verma' },
  { id: '4', name: 'Class 4', sections: ['A', 'B', 'C'], capacity: 120, currentStrength: 115, classTeacher: 'Mr. Singh' },
  { id: '5', name: 'Class 5', sections: ['A', 'B'], capacity: 80, currentStrength: 78, classTeacher: 'Mrs. Joshi' },
  { id: '6', name: 'Class 10', sections: ['A', 'B', 'C', 'D'], capacity: 160, currentStrength: 148, classTeacher: 'Mr. Rao' },
];

const ClassManagement = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>(mockClasses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [form, setForm] = useState({ name: '', sections: '', capacity: '', classTeacher: '' });

  const handleSave = () => {
    if (!form.name || !form.sections) return;
    const sections = form.sections.split(',').map(s => s.trim());
    if (editingClass) {
      setClasses(classes.map(c => c.id === editingClass.id ? { ...c, name: form.name, sections, capacity: Number(form.capacity), classTeacher: form.classTeacher } : c));
      toast({ title: 'Updated', description: `${form.name} has been updated.` });
    } else {
      setClasses([...classes, { id: Date.now().toString(), name: form.name, sections, capacity: Number(form.capacity), currentStrength: 0, classTeacher: form.classTeacher }]);
      toast({ title: 'Created', description: `${form.name} has been created.` });
    }
    setDialogOpen(false);
    setEditingClass(null);
    setForm({ name: '', sections: '', capacity: '', classTeacher: '' });
  };

  const openEdit = (cls: ClassData) => {
    setEditingClass(cls);
    setForm({ name: cls.name, sections: cls.sections.join(', '), capacity: cls.capacity.toString(), classTeacher: cls.classTeacher });
    setDialogOpen(true);
  };

  const columns: Column<ClassData>[] = [
    { key: 'name', label: 'Class' },
    { key: 'sections', label: 'Sections', render: (val: string[]) => (
      <div className="flex gap-1">{val.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
    )},
    { key: 'capacity', label: 'Capacity' },
    { key: 'currentStrength', label: 'Strength', render: (val: number, row: ClassData) => (
      <span className={val >= row.capacity * 0.9 ? 'font-medium text-warning' : ''}>{val}/{row.capacity}</span>
    )},
    { key: 'classTeacher', label: 'Class Teacher' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Management</h1>
          <p className="text-sm text-muted-foreground">Manage classes, sections, and teacher assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingClass(null); setForm({ name: '', sections: '', capacity: '', classTeacher: '' }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Class Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Class 10" />
              </div>
              <div className="space-y-2">
                <Label>Sections <span className="text-destructive">*</span></Label>
                <Input value={form.sections} onChange={e => setForm({ ...form, sections: e.target.value })} placeholder="A, B, C" />
                <p className="text-xs text-muted-foreground">Comma-separated section names</p>
              </div>
              <div className="space-y-2">
                <Label>Total Capacity</Label>
                <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="120" />
              </div>
              <div className="space-y-2">
                <Label>Class Teacher</Label>
                <Input value={form.classTeacher} onChange={e => setForm({ ...form, classTeacher: e.target.value })} placeholder="Teacher name" />
              </div>
              <Button onClick={handleSave} className="w-full">{editingClass ? 'Update' : 'Create'} Class</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <School className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classes.reduce((acc, c) => acc + c.sections.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <School className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classes.reduce((acc, c) => acc + c.currentStrength, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        searchPlaceholder="Search classes..."
        actions={(row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
              setClasses(classes.filter(c => c.id !== row.id));
              toast({ variant: 'destructive', title: 'Deleted', description: `${row.name} has been deleted.` });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default ClassManagement;
