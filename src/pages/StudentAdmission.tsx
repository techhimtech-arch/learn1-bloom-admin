import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DataTable, { Column } from '@/components/shared/DataTable';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { admissionApi, classApi, sectionApi, academicYearApi } from '@/services/api';
import { UserPlus, Users, ClipboardList, Eye, CheckCircle } from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface ClassOption { _id: string; name: string; }
interface SectionOption { _id: string; name: string; classId: string | { _id: string; name: string }; }
interface AcademicYearOption { _id: string; year: string; label?: string; isActive?: boolean; }

const StudentAdmission = () => {
  const [activeTab, setActiveTab] = useState('partial');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  // Partial admission form
  const [partialForm, setPartialForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', address: '', emergencyContact: '',
  });

  // Full admission form
  const [fullForm, setFullForm] = useState({
    firstName: '', lastName: '', admissionNumber: '', gender: '',
    dateOfBirth: '', email: '', password: '', classId: '', sectionId: '',
    rollNumber: '', address: '', bloodGroup: '', emergencyContact: '',
  });

  // Lists
  const [partialList, setPartialList] = useState<any[]>([]);
  const [admittedList, setAdmittedList] = useState<any[]>([]);
  const [partialLoading, setPartialLoading] = useState(false);
  const [admittedLoading, setAdmittedLoading] = useState(false);

  // Complete dialog
  const [completeDialog, setCompleteDialog] = useState(false);
  const [selectedPartial, setSelectedPartial] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({
    classId: '', sectionId: '', rollNumber: '', bloodGroup: '', admissionNumber: '',
  });

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState(false);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  useEffect(() => {
    classApi.getAll().then(r => setClasses(r.data?.data || [])).catch(() => {});
    sectionApi.getAll().then(r => setSections(r.data?.data || [])).catch(() => {});
  }, []);

  const fetchPartial = useCallback(async () => {
    setPartialLoading(true);
    try {
      const res = await admissionApi.getPartial({ limit: 100 });
      setPartialList(res.data?.data || []);
    } catch { /* ignore */ }
    setPartialLoading(false);
  }, []);

  const fetchAdmitted = useCallback(async () => {
    setAdmittedLoading(true);
    try {
      const res = await admissionApi.getAll({ limit: 100 });
      setAdmittedList(res.data?.data || []);
    } catch { /* ignore */ }
    setAdmittedLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'partial-list') fetchPartial();
    if (activeTab === 'admitted') fetchAdmitted();
  }, [activeTab, fetchPartial, fetchAdmitted]);

  const getSectionsForClass = (classId: string) =>
    sections.filter(s => {
      const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
      return cId === classId;
    });

  const handlePartialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await admissionApi.createPartial(partialForm);
      showApiSuccess(res, 'Partial admission created successfully.');
      setPartialForm({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '', emergencyContact: '' });
    } catch (err: any) {
      showApiError(err, 'Failed to create partial admission');
    }
    setLoading(false);
  };

  const handleFullSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { ...fullForm };
      if (fullForm.rollNumber) payload.rollNumber = parseInt(fullForm.rollNumber);
      if (!fullForm.password) delete payload.password;
      const res = await admissionApi.create(payload);
      showApiSuccess(res, 'Student admitted successfully.');
      setFullForm({ firstName: '', lastName: '', admissionNumber: '', gender: '', dateOfBirth: '', email: '', password: '', classId: '', sectionId: '', rollNumber: '', address: '', bloodGroup: '', emergencyContact: '' });
    } catch (err: any) {
      showApiError(err, 'Failed to admit student');
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!selectedPartial) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { ...completeForm };
      if (completeForm.rollNumber) payload.rollNumber = parseInt(completeForm.rollNumber);
      const res = await admissionApi.completePartial(selectedPartial._id, payload);
      showApiSuccess(res, 'Admission completed successfully.');
      setCompleteDialog(false);
      setSelectedPartial(null);
      fetchPartial();
    } catch (err: any) {
      showApiError(err, 'Failed to complete admission');
    }
    setLoading(false);
  };

  const viewDetail = async (id: string) => {
    try {
      const res = await admissionApi.getById(id);
      setStudentDetail(res.data?.data?.studentProfile || res.data?.data);
      setDetailDialog(true);
    } catch (err: any) {
      showApiError(err, 'Failed to load student details');
    }
  };

  const selectField = (name: string, value: string, onChange: (e: any) => void, options: { value: string; label: string }[], required = false) => (
    <select name={name} value={value} onChange={onChange} required={required}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <option value="">Select</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const partialColumns: Column<any>[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dateOfBirth', label: 'DOB', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'email', label: 'Email', render: (v: string) => v || '-' },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant="secondary">{v || 'partial'}</Badge> },
  ];

  const admittedColumns: Column<any>[] = [
    { key: 'firstName', label: 'Name', render: (_: any, row: any) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
    { key: 'admissionNumber', label: 'Adm No.', render: (_: any, row: any) => row.admissionNumber || '-' },
    { key: 'gender', label: 'Gender' },
    { key: 'currentEnrollment', label: 'Class', render: (_: any, row: any) => row.currentEnrollment?.classId?.name || '-' },
    { key: 'status', label: 'Status', render: (v: string) => (
      <Badge variant={v === 'completed' ? 'default' : 'secondary'}>{v}</Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Admission</h1>
        <p className="text-sm text-muted-foreground">Manage partial and full student admissions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="partial" className="gap-1.5"><ClipboardList className="h-4 w-4" />Partial Admission</TabsTrigger>
          <TabsTrigger value="full" className="gap-1.5"><UserPlus className="h-4 w-4" />Full Admission</TabsTrigger>
          <TabsTrigger value="partial-list" className="gap-1.5"><ClipboardList className="h-4 w-4" />Partial List</TabsTrigger>
          <TabsTrigger value="admitted" className="gap-1.5"><Users className="h-4 w-4" />Admitted Students</TabsTrigger>
        </TabsList>

        {/* PARTIAL ADMISSION FORM */}
        <TabsContent value="partial" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Partial Admission Form</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handlePartialSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2"><Label>First Name <span className="text-destructive">*</span></Label><Input name="firstName" value={partialForm.firstName} onChange={e => setPartialForm({ ...partialForm, firstName: e.target.value })} required minLength={2} maxLength={50} /></div>
                  <div className="space-y-2"><Label>Last Name <span className="text-destructive">*</span></Label><Input name="lastName" value={partialForm.lastName} onChange={e => setPartialForm({ ...partialForm, lastName: e.target.value })} required minLength={2} maxLength={50} /></div>
                  <div className="space-y-2"><Label>Gender <span className="text-destructive">*</span></Label>{selectField('gender', partialForm.gender, e => setPartialForm({ ...partialForm, gender: e.target.value }), GENDER_OPTIONS.map(g => ({ value: g, label: g })), true)}</div>
                  <div className="space-y-2"><Label>Date of Birth <span className="text-destructive">*</span></Label><Input type="date" value={partialForm.dateOfBirth} onChange={e => setPartialForm({ ...partialForm, dateOfBirth: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={partialForm.email} onChange={e => setPartialForm({ ...partialForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={partialForm.phone} onChange={e => setPartialForm({ ...partialForm, phone: e.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Address</Label><Input value={partialForm.address} onChange={e => setPartialForm({ ...partialForm, address: e.target.value })} maxLength={200} /></div>
                  <div className="space-y-2"><Label>Emergency Contact</Label><Input type="tel" value={partialForm.emergencyContact} onChange={e => setPartialForm({ ...partialForm, emergencyContact: e.target.value })} /></div>
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Create Partial Admission'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FULL ADMISSION FORM */}
        <TabsContent value="full" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Full Admission Form</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleFullSubmit} className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Personal Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2"><Label>First Name <span className="text-destructive">*</span></Label><Input value={fullForm.firstName} onChange={e => setFullForm({ ...fullForm, firstName: e.target.value })} required minLength={2} maxLength={50} /></div>
                    <div className="space-y-2"><Label>Last Name <span className="text-destructive">*</span></Label><Input value={fullForm.lastName} onChange={e => setFullForm({ ...fullForm, lastName: e.target.value })} required minLength={2} maxLength={50} /></div>
                    <div className="space-y-2"><Label>Admission Number <span className="text-destructive">*</span></Label><Input value={fullForm.admissionNumber} onChange={e => setFullForm({ ...fullForm, admissionNumber: e.target.value })} required minLength={3} maxLength={20} /></div>
                    <div className="space-y-2"><Label>Gender <span className="text-destructive">*</span></Label>{selectField('gender', fullForm.gender, e => setFullForm({ ...fullForm, gender: e.target.value }), GENDER_OPTIONS.map(g => ({ value: g, label: g })), true)}</div>
                    <div className="space-y-2"><Label>Date of Birth <span className="text-destructive">*</span></Label><Input type="date" value={fullForm.dateOfBirth} onChange={e => setFullForm({ ...fullForm, dateOfBirth: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Blood Group</Label>{selectField('bloodGroup', fullForm.bloodGroup, e => setFullForm({ ...fullForm, bloodGroup: e.target.value }), BLOOD_GROUP_OPTIONS.map(b => ({ value: b, label: b })))}</div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Contact & Account</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={fullForm.email} onChange={e => setFullForm({ ...fullForm, email: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Password</Label><Input type="password" value={fullForm.password} onChange={e => setFullForm({ ...fullForm, password: e.target.value })} placeholder="Auto-generated if empty" minLength={6} /></div>
                    <div className="space-y-2"><Label>Emergency Contact</Label><Input type="tel" value={fullForm.emergencyContact} onChange={e => setFullForm({ ...fullForm, emergencyContact: e.target.value })} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={fullForm.address} onChange={e => setFullForm({ ...fullForm, address: e.target.value })} maxLength={200} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Academic Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2"><Label>Class</Label>{selectField('classId', fullForm.classId, e => setFullForm({ ...fullForm, classId: e.target.value, sectionId: '' }), classes.map(c => ({ value: c._id, label: c.name })))}</div>
                    <div className="space-y-2"><Label>Section</Label>{selectField('sectionId', fullForm.sectionId, e => setFullForm({ ...fullForm, sectionId: e.target.value }), getSectionsForClass(fullForm.classId).map(s => ({ value: s._id, label: s.name })))}</div>
                    <div className="space-y-2"><Label>Roll Number</Label><Input type="number" value={fullForm.rollNumber} onChange={e => setFullForm({ ...fullForm, rollNumber: e.target.value })} /></div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Admit Student'}</Button>
                  <Button type="button" variant="outline" onClick={() => setFullForm({ firstName: '', lastName: '', admissionNumber: '', gender: '', dateOfBirth: '', email: '', password: '', classId: '', sectionId: '', rollNumber: '', address: '', bloodGroup: '', emergencyContact: '' })}>Clear</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARTIAL LIST */}
        <TabsContent value="partial-list" className="mt-4">
          <DataTable
            columns={partialColumns}
            data={partialList}
            loading={partialLoading}
            searchPlaceholder="Search partial admissions..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setSelectedPartial(row); setCompleteForm({ classId: '', sectionId: '', rollNumber: '', bloodGroup: '', admissionNumber: '' }); setCompleteDialog(true); }}>
                  <CheckCircle className="h-4 w-4 text-success mr-1" /> Complete
                </Button>
              </div>
            )}
          />
        </TabsContent>

        {/* ADMITTED STUDENTS */}
        <TabsContent value="admitted" className="mt-4">
          <DataTable
            columns={admittedColumns}
            data={admittedList}
            loading={admittedLoading}
            searchPlaceholder="Search admitted students..."
            actions={(row) => (
              <Button size="sm" variant="ghost" onClick={() => viewDetail(row._id)}>
                <Eye className="h-4 w-4 mr-1" /> View
              </Button>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* COMPLETE PARTIAL DIALOG */}
      <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Admission — {selectedPartial?.firstName} {selectedPartial?.lastName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Class</Label>{selectField('classId', completeForm.classId, e => setCompleteForm({ ...completeForm, classId: e.target.value, sectionId: '' }), classes.map(c => ({ value: c._id, label: c.name })))}</div>
            <div className="space-y-2"><Label>Section</Label>{selectField('sectionId', completeForm.sectionId, e => setCompleteForm({ ...completeForm, sectionId: e.target.value }), getSectionsForClass(completeForm.classId).map(s => ({ value: s._id, label: s.name })))}</div>
            <div className="space-y-2"><Label>Admission Number</Label><Input value={completeForm.admissionNumber} onChange={e => setCompleteForm({ ...completeForm, admissionNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>Roll Number</Label><Input type="number" value={completeForm.rollNumber} onChange={e => setCompleteForm({ ...completeForm, rollNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>Blood Group</Label>{selectField('bloodGroup', completeForm.bloodGroup, e => setCompleteForm({ ...completeForm, bloodGroup: e.target.value }), BLOOD_GROUP_OPTIONS.map(b => ({ value: b, label: b })))}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={loading}>{loading ? 'Saving...' : 'Complete Admission'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STUDENT DETAIL DIALOG */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {studentDetail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> {studentDetail.firstName} {studentDetail.lastName}</div>
                <div><span className="text-muted-foreground">Gender:</span> {studentDetail.gender}</div>
                <div><span className="text-muted-foreground">DOB:</span> {studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString() : '-'}</div>
                <div><span className="text-muted-foreground">Blood Group:</span> {studentDetail.bloodGroup || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {studentDetail.email || '-'}</div>
                <div><span className="text-muted-foreground">Phone:</span> {studentDetail.phone || '-'}</div>
                <div><span className="text-muted-foreground">Admission No:</span> {studentDetail.admissionNumber || '-'}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={studentDetail.status === 'completed' ? 'default' : 'secondary'}>{studentDetail.status}</Badge></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {studentDetail.address || '-'}</div>
                {studentDetail.currentEnrollment && (
                  <>
                    <div><span className="text-muted-foreground">Class:</span> {studentDetail.currentEnrollment.classId?.name || '-'}</div>
                    <div><span className="text-muted-foreground">Section:</span> {studentDetail.currentEnrollment.sectionId?.name || '-'}</div>
                    <div><span className="text-muted-foreground">Roll No:</span> {studentDetail.currentEnrollment.rollNumber || '-'}</div>
                  </>
                )}
                {studentDetail.parentUserId && (
                  <div className="col-span-2"><span className="text-muted-foreground">Parent:</span> {studentDetail.parentUserId.name || studentDetail.parentUserId.email || '-'}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAdmission;
