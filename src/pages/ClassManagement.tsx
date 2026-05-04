import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable, { Column } from '@/components/shared/DataTable';
import { classApi, sectionApi, academicYearApi } from '@/pages/services/api';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { Plus, Edit, Trash2, School, Layers, DoorOpen } from 'lucide-react';

interface ClassItem {
  _id: string;
  name: string;
  isActive: boolean;
}

interface SectionItem {
  _id: string;
  name: string;
  classId: { _id: string; name: string } | string;
  capacity: number;
  roomNumber?: string;
  floor?: string;
  building?: string;
  isActive: boolean;
  academicSessionId?: string;
}

interface AcademicYear {
  _id: string;
  name: string;
  isActive: boolean;
  isCurrent: boolean;
}

const ClassManagement = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Class dialog
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [className, setClassName] = useState('');
  const [sectionsInput, setSectionsInput] = useState('');
  const [classSaving, setClassSaving] = useState(false);
  const navigate = useNavigate();

  // Section dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [sectionForm, setSectionForm] = useState({ 
    name: '', 
    classId: '', 
    academicSessionId: '',
    capacity: '40', 
    roomNumber: '', 
    floor: '', 
    building: '' 
  });
  const [sectionSaving, setSectionSaving] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data } = await classApi.getAll();
      setClasses(data.data || []);
    } catch (err) {
      showApiError(err, 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const { data } = await sectionApi.getAll();
      setSections(data.data || []);
    } catch (err) {
      showApiError(err, 'Failed to load sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data } = await academicYearApi.getAll();
      setAcademicYears(data.data || []);
      
      // Auto-select current academic year for new sections
      const currentYear = data.data?.find((year: AcademicYear) => year.isCurrent || year.isActive);
      if (currentYear) {
        setSectionForm(prev => ({ ...prev, academicSessionId: currentYear._id }));
      }
    } catch (err) {
      showApiError(err, 'Failed to load academic years');
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, []);

  // Class CRUD
  const handleSaveClass = async () => {
    if (!className.trim()) return;
    setClassSaving(true);
    try {
      let createdClassId = editingClass?._id;
      
      if (editingClass) {
        const res = await classApi.update(editingClass._id, { name: className.trim() });
        showApiSuccess(res.data, 'Class updated successfully');
      } else {
        const res = await classApi.create({ name: className.trim() });
        createdClassId = res.data?.data?._id || res.data?.data?.id;
        
        // Auto create sections if provided
        if (sectionsInput.trim() && createdClassId) {
          const sectionNames = sectionsInput.split(',').map(s => s.trim()).filter(s => s);
          const currentYearId = academicYears.find(y => y.isCurrent || y.isActive)?._id;
          
          if (currentYearId) {
            await Promise.all(
              sectionNames.map(name => 
                sectionApi.create({
                  name,
                  classId: createdClassId,
                  academicSessionId: currentYearId,
                  capacity: 40
                })
              )
            );
          }
        }
        
        toast.success('Class created successfully', {
          action: {
            label: 'Assign Teacher',
            onClick: () => navigate('/teacher-assignments')
          }
        });
      }
      
      setClassDialogOpen(false);
      setEditingClass(null);
      setClassName('');
      setSectionsInput('');
      fetchClasses();
      if (!editingClass && sectionsInput.trim()) {
        fetchSections();
      }
    } catch (err) {
      showApiError(err);
    } finally {
      setClassSaving(false);
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    try {
      const res = await classApi.delete(cls._id);
      showApiSuccess(res.data, 'Class deleted successfully');
      fetchClasses();
      fetchSections();
    } catch (err) {
      showApiError(err);
    }
  };

  const openEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassDialogOpen(true);
  };

  // Section CRUD
  const handleSaveSection = async () => {
    if (!sectionForm.name.trim() || (!editingSection && (!sectionForm.classId || !sectionForm.academicSessionId))) return;
    setSectionSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: sectionForm.name.trim(),
        capacity: Number(sectionForm.capacity) || 40,
        academicSessionId: sectionForm.academicSessionId,
      };
      if (sectionForm.roomNumber) payload.roomNumber = sectionForm.roomNumber;
      if (sectionForm.floor) payload.floor = sectionForm.floor;
      if (sectionForm.building) payload.building = sectionForm.building;

      if (editingSection) {
        const res = await sectionApi.update(editingSection._id, payload);
        showApiSuccess(res.data, 'Section updated successfully');
      } else {
        payload.classId = sectionForm.classId;
        const res = await sectionApi.create(payload);
        showApiSuccess(res.data, 'Section created successfully');
      }
      setSectionDialogOpen(false);
      setEditingSection(null);
      setSectionForm({ 
        name: '', 
        classId: '', 
        academicSessionId: academicYears.find(y => y.isCurrent || y.isActive)?._id || '',
        capacity: '40', 
        roomNumber: '', 
        floor: '', 
        building: '' 
      });
      fetchSections();
    } catch (err) {
      showApiError(err);
    } finally {
      setSectionSaving(false);
    }
  };

  const handleDeleteSection = async (sec: SectionItem) => {
    try {
      const res = await sectionApi.delete(sec._id);
      showApiSuccess(res.data, 'Section deleted successfully');
      fetchSections();
    } catch (err) {
      showApiError(err);
    }
  };

  const openEditSection = (sec: SectionItem) => {
    setEditingSection(sec);
    setSectionForm({
      name: sec.name,
      classId: typeof sec.classId === 'object' ? sec.classId._id : sec.classId,
      academicSessionId: sec.academicSessionId || academicYears.find(y => y.isCurrent || y.isActive)?._id || '',
      capacity: String(sec.capacity || 40),
      roomNumber: sec.roomNumber || '',
      floor: sec.floor || '',
      building: sec.building || '',
    });
    setSectionDialogOpen(true);
  };

  const getClassName = (sec: SectionItem) => {
    if (typeof sec.classId === 'object' && sec.classId?.name) return sec.classId.name;
    const cls = classes.find(c => c._id === sec.classId);
    return cls?.name || '-';
  };

  const classColumns: Column<ClassItem>[] = [
    { key: 'name', label: 'Class Name' },
    {
      key: 'isActive', label: 'Status', render: (val: boolean) => (
        <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ];

  const sectionColumns: Column<SectionItem>[] = [
    { key: 'name', label: 'Section Name' },
    { key: 'classId', label: 'Class', render: (_: any, row: SectionItem) => getClassName(row) },
    { key: 'capacity', label: 'Capacity' },
    { key: 'roomNumber', label: 'Room', render: (val: string) => val || '-' },
    { key: 'building', label: 'Building', render: (val: string) => val || '-' },
    {
      key: 'isActive', label: 'Status', render: (val: boolean) => (
        <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ];

  const totalSections = sections.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Class & Section Management</h1>
        <p className="text-sm text-muted-foreground">Manage classes, sections, and room assignments</p>
      </div>

      {/* Summary */}
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
              <Layers className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalSections}</p>
              <p className="text-sm text-muted-foreground">Total Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <DoorOpen className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sections.reduce((a, s) => a + (s.capacity || 0), 0)}</p>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        {/* CLASSES TAB */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingClass(null); setClassName(''); setClassDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Class
            </Button>
          </div>
          <DataTable
            columns={classColumns}
            data={classes}
            loading={loading}
            searchPlaceholder="Search classes..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEditClass(row)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteClass(row)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
          />
        </TabsContent>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingSection(null); setSectionForm({ 
              name: '', 
              classId: '', 
              academicSessionId: academicYears.find(y => y.isCurrent || y.isActive)?._id || '',
              capacity: '40', 
              roomNumber: '', 
              floor: '', 
              building: '' 
            }); setSectionDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Section
            </Button>
          </div>
          <DataTable
            columns={sectionColumns}
            data={sections}
            loading={sectionsLoading}
            searchPlaceholder="Search sections..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEditSection(row)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteSection(row)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Class Dialog */}
      <Dialog open={classDialogOpen} onOpenChange={(o) => { setClassDialogOpen(o); if (!o) { setEditingClass(null); setClassName(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Class Name <span className="text-destructive">*</span></Label>
              <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Class 10" />
            </div>
            {!editingClass && (
              <div className="space-y-2">
                <Label>Sections (comma separated) <span className="text-muted-foreground font-normal ml-2">Optional</span></Label>
                <Input value={sectionsInput} onChange={e => setSectionsInput(e.target.value)} placeholder="e.g. A, B, C" />
                <p className="text-xs text-muted-foreground">Auto-generates these sections for the new class</p>
              </div>
            )}
            <Button onClick={handleSaveClass} className="w-full" disabled={classSaving}>
              {classSaving ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={(o) => { setSectionDialogOpen(o); if (!o) { setEditingSection(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Create New Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Section Name <span className="text-destructive">*</span></Label>
              <Input value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="e.g. Section A" />
            </div>
            {!editingSection && (
              <div className="space-y-2">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Select value={sectionForm.classId} onValueChange={v => setSectionForm({ ...sectionForm, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Academic Year <span className="text-destructive">*</span></Label>
              <Select value={sectionForm.academicSessionId} onValueChange={v => setSectionForm({ ...sectionForm, academicSessionId: v })}>
                <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })} placeholder="40" />
              </div>
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input value={sectionForm.roomNumber} onChange={e => setSectionForm({ ...sectionForm, roomNumber: e.target.value })} placeholder="101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input value={sectionForm.floor} onChange={e => setSectionForm({ ...sectionForm, floor: e.target.value })} placeholder="Ground Floor" />
              </div>
              <div className="space-y-2">
                <Label>Building</Label>
                <Input value={sectionForm.building} onChange={e => setSectionForm({ ...sectionForm, building: e.target.value })} placeholder="Main Building" />
              </div>
            </div>
            <Button onClick={handleSaveSection} className="w-full" disabled={sectionSaving}>
              {sectionSaving ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
