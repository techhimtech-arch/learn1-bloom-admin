import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Users, UserX, Clock, Loader2, AlertCircle } from 'lucide-react';
import StatWidget from '@/components/shared/StatWidget';
import { attendanceApi, classApi, sectionApi, admissionApi } from '@/services/api';
import { showApiSuccess, showApiError } from '@/lib/api-toast';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late' | null;

interface StudentRecord {
  id: string;
  name: string;
  admissionNumber: string;
  status: AttendanceStatus;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; bg: string }[] = [
  { value: 'Present', label: 'Present', color: 'text-success', bg: 'border-success/20 bg-success/5' },
  { value: 'Absent', label: 'Absent', color: 'text-destructive', bg: 'border-destructive/20 bg-destructive/5' },
  { value: 'Late', label: 'Late', color: 'text-warning', bg: 'border-warning/20 bg-warning/5' },
  { value: 'Leave', label: 'Leave', color: 'text-muted-foreground', bg: 'border-muted bg-muted/30' },
];

const AttendanceManagement = () => {
  const { toast } = useToast();

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    setLoadingClasses(true);
    classApi.getAll()
      .then(res => setClasses(res.data?.data || res.data || []))
      .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to load classes' }))
      .finally(() => setLoadingClasses(false));
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    setSections([]);
    setSelectedSection('');
    setStudents([]);
    if (!selectedClass) return;
    setLoadingSections(true);
    sectionApi.getByClass(selectedClass)
      .then(res => setSections(res.data?.data || res.data || []))
      .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sections' }))
      .finally(() => setLoadingSections(false));
  }, [selectedClass]);

  // Fetch students + existing attendance when class, section, date all set
  useEffect(() => {
    setStudents([]);
    setSubmitted(false);
    setExistingAttendance(false);
    if (!selectedClass || !selectedSection || !selectedDate) return;

    setLoadingStudents(true);

    // Fetch students in this class/section and existing attendance in parallel
    Promise.all([
      admissionApi.getAll({ classId: selectedClass, sectionId: selectedSection, limit: 100 }),
      attendanceApi.getAll({ date: selectedDate, classId: selectedClass, sectionId: selectedSection }),
    ])
      .then(([studentsRes, attendanceRes]) => {
        const studentList = studentsRes.data?.data?.students || studentsRes.data?.data || studentsRes.data || [];
        const attendanceList = attendanceRes.data?.data || [];

        // Build a map of studentId -> status from existing attendance
        const attendanceMap: Record<string, AttendanceStatus> = {};
        attendanceList.forEach((a: any) => {
          const sid = typeof a.studentId === 'object' ? a.studentId._id : a.studentId;
          attendanceMap[sid] = a.status;
        });

        const hasExisting = attendanceList.length > 0;
        setExistingAttendance(hasExisting);
        if (hasExisting) setSubmitted(true);

        const mapped: StudentRecord[] = studentList.map((s: any) => ({
          id: s._id || s.id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Unknown',
          admissionNumber: s.admissionNumber || '-',
          status: attendanceMap[s._id || s.id] || null,
        }));

        setStudents(mapped);
      })
      .catch(err => showApiError(err, 'Failed to load students/attendance'))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, selectedSection, selectedDate]);

  const setStatus = (id: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === status ? null : status } : s));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'Present' })));
  };

  const handleSubmit = async () => {
    const unmarked = students.filter(s => !s.status);
    if (unmarked.length > 0) {
      toast({ variant: 'destructive', title: 'Incomplete', description: `${unmarked.length} student(s) not marked yet.` });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        classId: selectedClass,
        sectionId: selectedSection,
        attendanceType: 'daily',
        records: students.map(s => ({ studentId: s.id, status: s.status })),
      };
      const res = await attendanceApi.markBulk(payload);
      showApiSuccess(res, 'Attendance saved successfully');
      setSubmitted(true);
      setExistingAttendance(true);
    } catch (err: any) {
      showApiError(err, 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStudents(prev => prev.map(s => ({ ...s, status: null })));
  };

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const lateCount = students.filter(s => s.status === 'Late').length;
  const leaveCount = students.filter(s => s.status === 'Leave').length;

  const selectClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
        <p className="text-sm text-muted-foreground">Mark and manage daily student attendance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatWidget title="Total Students" value={students.length} icon={Users} iconColor="bg-primary/10 text-primary" />
        <StatWidget title="Present" value={presentCount} icon={CalendarCheck} iconColor="bg-success/10 text-success" />
        <StatWidget title="Absent" value={absentCount} icon={UserX} iconColor="bg-destructive/10 text-destructive" />
        <StatWidget title="Late / Leave" value={lateCount + leaveCount} icon={Clock} iconColor="bg-warning/10 text-warning" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={selectClasses} />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={selectClasses} disabled={loadingClasses}>
                <option value="">{loadingClasses ? 'Loading...' : 'Select Class'}</option>
                {classes.map((c: any) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className={selectClasses} disabled={!selectedClass || loadingSections}>
                <option value="">{loadingSections ? 'Loading...' : 'Select Section'}</option>
                {sections.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={markAllPresent} className="w-full" disabled={students.length === 0 || submitted}>
                Mark All Present
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing attendance warning */}
      {existingAttendance && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Attendance already marked for this date. Showing saved records.</span>
        </div>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {selectedClass && selectedSection ? 'No students found in this class/section.' : 'Select a class and section to load students.'}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground sm:grid-cols-[80px_1fr_auto]">
                  <span className="hidden sm:block">Adm No</span>
                  <span>Student Name</span>
                  <div className="flex gap-3">
                    {STATUS_OPTIONS.map(opt => (
                      <span key={opt.value} className="w-16 text-center text-xs">{opt.label}</span>
                    ))}
                  </div>
                </div>

                {students.map((student) => {
                  const activeOpt = STATUS_OPTIONS.find(o => o.value === student.status);
                  return (
                    <div
                      key={student.id}
                      className={`grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border px-4 py-3 transition-colors sm:grid-cols-[80px_1fr_auto] ${activeOpt?.bg || ''}`}
                    >
                      <span className="hidden text-sm font-medium text-muted-foreground sm:block">{student.admissionNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{student.name}</span>
                        {student.status && (
                          <Badge variant="secondary" className={`text-xs ${activeOpt?.color || ''}`}>
                            {student.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {STATUS_OPTIONS.map(opt => (
                          <div key={opt.value} className="flex w-16 justify-center">
                            <button
                              type="button"
                              disabled={submitted}
                              onClick={() => setStatus(student.id, opt.value)}
                              className={`h-5 w-5 rounded-full border-2 transition-colors ${
                                student.status === opt.value
                                  ? `border-current ${opt.color} bg-current`
                                  : 'border-muted-foreground/30 hover:border-muted-foreground/60'
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {student.status === opt.value && (
                                <span className="flex h-full w-full items-center justify-center text-[10px] text-background font-bold">✓</span>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={handleSubmit} disabled={submitted || submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : submitted ? 'Attendance Saved' : 'Save Attendance'}
                </Button>
                {submitted && !existingAttendance && (
                  <Button variant="outline" onClick={handleReset}>Reset</Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;
