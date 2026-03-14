import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable, { Column } from '@/components/shared/DataTable';
import { academicYearApi } from '@/services/api';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { Plus, Edit, Trash2, CalendarDays, Star, CalendarPlus, Palmtree } from 'lucide-react';

interface Term {
  _id?: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

interface Holiday {
  _id?: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  terms?: Term[];
  holidays?: Holiday[];
  settings?: { workingDays?: string[]; gradingSystem?: string };
  description?: string;
}

const WORKING_DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toInputDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

const AcademicYearManagement = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', startDate: '', endDate: '', description: '',
    isCurrent: false, gradingSystem: 'percentage',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as string[],
  });

  // Term dialog
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [termYearId, setTermYearId] = useState('');
  const [termForm, setTermForm] = useState({ name: '', startDate: '', endDate: '' });
  const [termSaving, setTermSaving] = useState(false);

  // Holiday dialog
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayYearId, setHolidayYearId] = useState('');
  const [holidayForm, setHolidayForm] = useState({ name: '', startDate: '', endDate: '', description: '' });
  const [holidaySaving, setHolidaySaving] = useState(false);

  // Detail view
  const [detailYear, setDetailYear] = useState<AcademicYear | null>(null);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const { data } = await academicYearApi.getAll();
      setYears(data.data || []);
    } catch (err) {
      showApiError(err, 'Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
        isCurrent: form.isCurrent,
        settings: { workingDays: form.workingDays, gradingSystem: form.gradingSystem },
      };
      if (editingYear) {
        const res = await academicYearApi.update(editingYear._id, payload);
        showApiSuccess(res.data, 'Academic year updated');
      } else {
        const res = await academicYearApi.create(payload);
        showApiSuccess(res.data, 'Academic year created');
      }
      setDialogOpen(false);
      setEditingYear(null);
      fetchYears();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      const res = await academicYearApi.setCurrent(id);
      showApiSuccess(res.data, 'Current academic year updated');
      fetchYears();
    } catch (err) {
      showApiError(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await academicYearApi.delete(id);
      showApiSuccess(res.data, 'Academic year deleted');
      fetchYears();
    } catch (err) {
      showApiError(err);
    }
  };

  const openEdit = (yr: AcademicYear) => {
    setEditingYear(yr);
    setForm({
      name: yr.name,
      startDate: toInputDate(yr.startDate),
      endDate: toInputDate(yr.endDate),
      description: yr.description || '',
      isCurrent: yr.isCurrent,
      gradingSystem: yr.settings?.gradingSystem || 'percentage',
      workingDays: yr.settings?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    });
    setDialogOpen(true);
  };

  const openDetail = async (yr: AcademicYear) => {
    try {
      const { data } = await academicYearApi.getById(yr._id);
      setDetailYear(data.data);
    } catch {
      setDetailYear(yr);
    }
  };

  const handleAddTerm = async () => {
    if (!termForm.name || !termForm.startDate || !termForm.endDate) return;
    setTermSaving(true);
    try {
      const res = await academicYearApi.addTerm(termYearId, termForm);
      showApiSuccess(res.data, 'Term added');
      setTermDialogOpen(false);
      setTermForm({ name: '', startDate: '', endDate: '' });
      fetchYears();
      if (detailYear?._id === termYearId) openDetail(detailYear);
    } catch (err) {
      showApiError(err);
    } finally {
      setTermSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.name || !holidayForm.startDate || !holidayForm.endDate) return;
    setHolidaySaving(true);
    try {
      const res = await academicYearApi.addHoliday(holidayYearId, holidayForm);
      showApiSuccess(res.data, 'Holiday added');
      setHolidayDialogOpen(false);
      setHolidayForm({ name: '', startDate: '', endDate: '', description: '' });
      fetchYears();
      if (detailYear?._id === holidayYearId) openDetail(detailYear);
    } catch (err) {
      showApiError(err);
    } finally {
      setHolidaySaving(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setForm(f => ({
      ...f,
      workingDays: f.workingDays.includes(day) ? f.workingDays.filter(d => d !== day) : [...f.workingDays, day],
    }));
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', label: 'Name' },
    { key: 'startDate', label: 'Start', render: (v: string) => formatDate(v) },
    { key: 'endDate', label: 'End', render: (v: string) => formatDate(v) },
    {
      key: 'isCurrent', label: 'Status', render: (v: boolean, row: AcademicYear) => (
        <div className="flex gap-1">
          {v && <Badge className="bg-primary text-primary-foreground">Current</Badge>}
          <Badge variant={row.isActive ? 'default' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
      ),
    },
  ];

  const currentYear = years.find(y => y.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Year Management</h1>
          <p className="text-sm text-muted-foreground">Manage academic years, terms, and holidays</p>
        </div>
        <Button onClick={() => { setEditingYear(null); setForm({ name: '', startDate: '', endDate: '', description: '', isCurrent: false, gradingSystem: 'percentage', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Academic Year
        </Button>
      </div>

      {/* Current Year Card */}
      {currentYear && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground">{currentYear.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentYear.startDate)} — {formatDate(currentYear.endDate)}
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Current Year</Badge>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={years}
        loading={loading}
        searchPlaceholder="Search academic years..."
        actions={(row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" title="View Details" onClick={() => openDetail(row)}>
              <CalendarDays className="h-4 w-4" />
            </Button>
            {!row.isCurrent && (
              <Button size="sm" variant="ghost" title="Set as Current" onClick={() => handleSetCurrent(row._id)}>
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" title="Add Term" onClick={() => { setTermYearId(row._id); setTermForm({ name: '', startDate: '', endDate: '' }); setTermDialogOpen(true); }}>
              <CalendarPlus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" title="Add Holiday" onClick={() => { setHolidayYearId(row._id); setHolidayForm({ name: '', startDate: '', endDate: '', description: '' }); setHolidayDialogOpen(true); }}>
              <Palmtree className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Edit className="h-4 w-4" /></Button>
            {!row.isCurrent && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(row._id)}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        )}
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailYear} onOpenChange={(o) => { if (!o) setDetailYear(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailYear?.name} — Details</DialogTitle>
          </DialogHeader>
          {detailYear && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Start:</span> {formatDate(detailYear.startDate)}</div>
                <div><span className="text-muted-foreground">End:</span> {formatDate(detailYear.endDate)}</div>
                <div><span className="text-muted-foreground">Grading:</span> {detailYear.settings?.gradingSystem || '-'}</div>
                <div><span className="text-muted-foreground">Working Days:</span> {detailYear.settings?.workingDays?.join(', ') || '-'}</div>
              </div>
              {detailYear.description && <p className="text-sm text-muted-foreground">{detailYear.description}</p>}

              {/* Terms */}
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Terms</h3>
                {detailYear.terms?.length ? (
                  <div className="space-y-2">
                    {detailYear.terms.map((t, i) => (
                      <div key={t._id || i} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="font-medium text-foreground">{t.name}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(t.startDate)} — {formatDate(t.endDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No terms added yet.</p>}
              </div>

              {/* Holidays */}
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Holidays</h3>
                {detailYear.holidays?.length ? (
                  <div className="space-y-2">
                    {detailYear.holidays.map((h, i) => (
                      <div key={h._id || i} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{h.name}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(h.startDate)} — {formatDate(h.endDate)}</span>
                        </div>
                        {h.description && <p className="mt-1 text-xs text-muted-foreground">{h.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No holidays added yet.</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Year Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingYear(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Edit Academic Year' : 'Create Academic Year'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="2025-2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Grading System</Label>
              <Select value={form.gradingSystem} onValueChange={v => setForm({ ...form, gradingSystem: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="gpa">GPA</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {WORKING_DAYS_OPTIONS.map(day => (
                  <Badge
                    key={day}
                    variant={form.workingDays.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleWorkingDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? 'Saving...' : editingYear ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Term Dialog */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Term</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Term Name <span className="text-destructive">*</span></Label>
              <Input value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} placeholder="Term 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={termForm.startDate} onChange={e => setTermForm({ ...termForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={termForm.endDate} onChange={e => setTermForm({ ...termForm, endDate: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddTerm} className="w-full" disabled={termSaving}>
              {termSaving ? 'Adding...' : 'Add Term'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Holiday Name <span className="text-destructive">*</span></Label>
              <Input value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="Summer Vacation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={holidayForm.startDate} onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={holidayForm.endDate} onChange={e => setHolidayForm({ ...holidayForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={holidayForm.description} onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })} placeholder="Optional description" />
            </div>
            <Button onClick={handleAddHoliday} className="w-full" disabled={holidaySaving}>
              {holidaySaving ? 'Adding...' : 'Add Holiday'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearManagement;
