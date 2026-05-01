import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import DataTable, { Column } from '@/components/shared/DataTable';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { enrollmentApi, classApi, sectionApi, academicYearApi, admissionApi, schoolApi } from '@/pages/services/api';
import { Users, UserPlus, Upload, Eye, TrendingUp } from 'lucide-react';

interface ClassOption { _id: string; name: string; }
interface SectionOption { _id: string; name: string; classId: string | { _id: string; name: string }; }
interface AcademicYearOption { _id: string; name: string; label?: string; isActive?: boolean; }
interface StudentOption { _id: string; firstName: string; lastName: string; admissionNumber: string; }

interface EnrollmentRow {
  _id?: string;
  studentName: string;
  admissionNumber: string;
  academicYearName: string;
  className: string;
  sectionName: string;
  rollNumber: string;
  status: string;
  schoolName: string;
  raw: any;
}

const getDisplayName = (value: any, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value.name || value.label || value.title || value.firstName || fallback;
};

const getStudentDisplayName = (student: any) => {
  if (!student) return '-';
  if (typeof student === 'string') return student;
  const firstName = student.firstName || '';
  const lastName = student.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || student.name || student.admissionNumber || '-';
};

const Enrollment = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [school, setSchool] = useState<{ _id: string }>();

  // Individual enrollment form
  const [enrollForm, setEnrollForm] = useState({
    studentId: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    rollNumber: '',
  });

  // Class view
  const [viewForm, setViewForm] = useState({
    academicYearId: '',
    classId: '',
    sectionId: '',
  });

  // Promote form
  const [promoteForm, setPromoteForm] = useState({
    studentId: '',
    currentEnrollmentId: '',
    newClassId: '',
    newSectionId: '',
    newRollNumber: '',
  });

  // Bulk enrollment
  const [bulkData, setBulkData] = useState('');

  // Lists & Dialogs
  const [classEnrollments, setClassEnrollments] = useState<EnrollmentRow[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    classApi.getAll().then(r => setClasses(r.data?.data || [])).catch(() => {});
    sectionApi.getAll().then(r => setSections(r.data?.data || [])).catch(() => {});
    academicYearApi.getAll().then(r => setAcademicYears(r.data?.data || [])).catch(() => {});
    admissionApi.getAll({ limit: 1000 }).then(r => {
      const admitted = r.data?.data || [];
      setStudents(admitted.map(s => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        admissionNumber: s.admissionNumber,
      })));
    }).catch(() => {});
    
    // Get schoolId from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.schoolId) {
          setSchool({ _id: user.schoolId });
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
      }
    }
  }, []);

  const getSectionsForClass = (classId: string) =>
    sections.filter(s => {
      const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
      return cId === classId;
    });

  const selectField = (name: string, value: string, onChange: (e: any) => void, options: any[]) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
    >
      <option value="">-- Select --</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  // Individual enrollment
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?._id) {
      showApiError({ response: { data: { message: 'School not found' } } } as any);
      return;
    }

    setLoading(true);
    try {
      const res = await enrollmentApi.create({
        studentId: enrollForm.studentId,
        academicYearId: enrollForm.academicYearId,
        classId: enrollForm.classId,
        sectionId: enrollForm.sectionId,
        schoolId: school._id,
        rollNumber: enrollForm.rollNumber,
      });
      showApiSuccess(res, 'Student enrolled successfully!');
      setEnrollForm({ studentId: '', academicYearId: '', classId: '', sectionId: '', rollNumber: '' });
    } catch (err: any) {
      showApiError(err);
    }
    setLoading(false);
  };

  // View class enrollments
  const handleViewEnrollments = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollmentsLoading(true);
    try {
      const res = await enrollmentApi.getClassEnrollments({
        academicYearId: viewForm.academicYearId,
        classId: viewForm.classId,
        sectionId: viewForm.sectionId,
      });
      const rows = (res.data?.data || []).map((item: any) => ({
        _id: item._id,
        studentName: getStudentDisplayName(item.studentId),
        admissionNumber: item.studentId?.admissionNumber || item.admissionNumber || '-',
        academicYearName: getDisplayName(item.academicYearId, '-'),
        className: getDisplayName(item.classId, '-'),
        sectionName: getDisplayName(item.sectionId, '-'),
        rollNumber: item.rollNumber ?? '-',
        status: item.status || 'ENROLLED',
        schoolName: getDisplayName(item.schoolId, '-'),
        raw: item,
      }));
      setClassEnrollments(rows);
    } catch (err: any) {
      showApiError(err);
      setClassEnrollments([]);
    }
    setEnrollmentsLoading(false);
  };

  // Promote student
  const handlePromote = async () => {
    if (!promoteForm.studentId || !promoteForm.currentEnrollmentId || !promoteForm.newClassId || !promoteForm.newSectionId) {
      showApiError({ response: { data: { message: 'All fields are required' } } } as any);
      return;
    }

    setLoading(true);
    try {
      const res = await enrollmentApi.promote({
        studentId: promoteForm.studentId,
        currentEnrollmentId: promoteForm.currentEnrollmentId,
        newClassId: promoteForm.newClassId,
        newSectionId: promoteForm.newSectionId,
        newRollNumber: promoteForm.newRollNumber,
      });
      showApiSuccess(res, 'Student promoted successfully!');
      setPromotionDialog(false);
      setPromoteForm({ studentId: '', currentEnrollmentId: '', newClassId: '', newSectionId: '', newRollNumber: '' });
    } catch (err: any) {
      showApiError(err);
    }
    setLoading(false);
  };

  // Bulk enrollment
  const handleBulkEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse CSV or JSON data
      const lines = bulkData.trim().split('\n').filter(line => line.trim());
      const enrollments: any[] = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          enrollments.push({
            studentId: parts[0],
            academicYearId: parts[1],
            classId: parts[2],
            sectionId: parts[3],
            schoolId: school?._id || '',
            rollNumber: parts[4] || '',
          });
        }
      }

      if (enrollments.length === 0) {
        showApiError({ response: { data: { message: 'No valid enrollment data found' } } } as any);
        return;
      }

      setLoading(true);
      const res = await enrollmentApi.bulkEnroll({ enrollments });
      showApiSuccess(res, `${enrollments.length} students enrolled successfully!`);
      setBulkData('');
    } catch (err: any) {
      showApiError(err);
    }
    setLoading(false);
  };

  const enrollmentColumns: Column<EnrollmentRow>[] = [
    { key: 'studentName', label: 'Student' },
    { key: 'admissionNumber', label: 'Admission No.' },
    { key: 'academicYearName', label: 'Academic Year' },
    { key: 'className', label: 'Class' },
    { key: 'sectionName', label: 'Section' },
    { key: 'rollNumber', label: 'Roll Number' },
    { key: 'schoolName', label: 'School' },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant="secondary">{v || 'ENROLLED'}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Enrollment</h1>
        <p className="text-sm text-muted-foreground">Manage student enrollments across classes and academic years</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual" className="gap-1.5"><UserPlus className="h-4 w-4" />Individual</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-1.5"><Upload className="h-4 w-4" />Bulk</TabsTrigger>
          <TabsTrigger value="view" className="gap-1.5"><Eye className="h-4 w-4" />View Class</TabsTrigger>
          <TabsTrigger value="promote" className="gap-1.5"><TrendingUp className="h-4 w-4" />Promote</TabsTrigger>
        </TabsList>

        {/* INDIVIDUAL ENROLLMENT */}
        <TabsContent value="individual" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Enroll Individual Student</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleEnrollSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Student *</Label>
                    {selectField('studentId', enrollForm.studentId, e => setEnrollForm({ ...enrollForm, studentId: e.target.value }), 
                      students.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    {selectField('academicYearId', enrollForm.academicYearId, e => setEnrollForm({ ...enrollForm, academicYearId: e.target.value }), 
                      academicYears.map(ay => ({ value: ay._id, label: ay.name })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    {selectField('classId', enrollForm.classId, e => setEnrollForm({ ...enrollForm, classId: e.target.value, sectionId: '' }), 
                      classes.map(c => ({ value: c._id, label: c.name })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Section *</Label>
                    {selectField('sectionId', enrollForm.sectionId, e => setEnrollForm({ ...enrollForm, sectionId: e.target.value }), 
                      getSectionsForClass(enrollForm.classId).map(s => ({ value: s._id, label: s.name })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input type="number" value={enrollForm.rollNumber} onChange={e => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })} placeholder="Optional" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Enrolling...' : 'Enroll Student'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BULK ENROLLMENT */}
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Bulk Enrollment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleBulkEnroll} className="space-y-5">
                <div className="space-y-2">
                  <Label>Enrollment Data (CSV Format)</Label>
                  <p className="text-xs text-muted-foreground">studentId, academicYearId, classId, sectionId, rollNumber (one per line)</p>
                  <Textarea
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    placeholder="69d4916c8345864e85b173bf,65a123...,65b234...,65c345...,10&#10;69d48f6f8345864e85b1739d,65a123...,65b234...,65c345...,11"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Processing...' : 'Enroll Students'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIEW CLASS ENROLLMENTS */}
        <TabsContent value="view" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">View Class Enrollments</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleViewEnrollments} className="space-y-5 mb-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    {selectField('academicYearId', viewForm.academicYearId, e => setViewForm({ ...viewForm, academicYearId: e.target.value }), 
                      academicYears.map(ay => ({ value: ay._id, label: ay.name })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    {selectField('classId', viewForm.classId, e => setViewForm({ ...viewForm, classId: e.target.value, sectionId: '' }), 
                      classes.map(c => ({ value: c._id, label: c.name })))}
                  </div>
                  <div className="space-y-2">
                    <Label>Section *</Label>
                    {selectField('sectionId', viewForm.sectionId, e => setViewForm({ ...viewForm, sectionId: e.target.value }), 
                      getSectionsForClass(viewForm.classId).map(s => ({ value: s._id, label: s.name })))}
                  </div>
                </div>
                <Button type="submit" disabled={enrollmentsLoading} className="w-full">{enrollmentsLoading ? 'Loading...' : 'View Enrollments'}</Button>
              </form>
              
              {classEnrollments.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Academic Year</p>
                        <p className="font-semibold">
                          {academicYears.find(ay => ay._id === viewForm.academicYearId)?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Class</p>
                        <p className="font-semibold">
                          {classes.find(c => c._id === viewForm.classId)?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Section</p>
                        <p className="font-semibold">
                          {sections.find(s => s._id === viewForm.sectionId)?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Students</p>
                        <p className="font-semibold text-lg">{classEnrollments.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <DataTable
                    columns={enrollmentColumns}
                    data={classEnrollments}
                    loading={false}
                    searchPlaceholder="Search students..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROMOTE STUDENTS */}
        <TabsContent value="promote" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Promote Students to Next Class</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a student and their current enrollment to promote them to the next class.
              </p>
              <Button onClick={() => setPromotionDialog(true)} className="w-full">
                Open Promotion Form
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PROMOTION DIALOG */}
      <Dialog open={promotionDialog} onOpenChange={setPromotionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Promote Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              {selectField('studentId', promoteForm.studentId, e => setPromoteForm({ ...promoteForm, studentId: e.target.value }), 
                students.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName}` })))}
            </div>
            <div className="space-y-2">
              <Label>Current Enrollment ID *</Label>
              <Input value={promoteForm.currentEnrollmentId} onChange={e => setPromoteForm({ ...promoteForm, currentEnrollmentId: e.target.value })} placeholder="Enter current enrollment ID" />
            </div>
            <div className="space-y-2">
              <Label>New Class *</Label>
              {selectField('newClassId', promoteForm.newClassId, e => setPromoteForm({ ...promoteForm, newClassId: e.target.value, newSectionId: '' }), 
                classes.map(c => ({ value: c._id, label: c.name })))}
            </div>
            <div className="space-y-2">
              <Label>New Section *</Label>
              {selectField('newSectionId', promoteForm.newSectionId, e => setPromoteForm({ ...promoteForm, newSectionId: e.target.value }), 
                getSectionsForClass(promoteForm.newClassId).map(s => ({ value: s._id, label: s.name })))}
            </div>
            <div className="space-y-2">
              <Label>New Roll Number</Label>
              <Input type="number" value={promoteForm.newRollNumber} onChange={e => setPromoteForm({ ...promoteForm, newRollNumber: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromotionDialog(false)}>Cancel</Button>
            <Button onClick={handlePromote} disabled={loading}>{loading ? 'Promoting...' : 'Promote Student'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enrollment;
