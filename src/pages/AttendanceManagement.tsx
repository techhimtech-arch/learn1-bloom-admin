import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Users, UserX, Clock } from 'lucide-react';
import StatWidget from '@/components/shared/StatWidget';

interface StudentAttendance {
  id: string;
  name: string;
  rollNo: string;
  status: 'present' | 'absent' | 'late' | null;
}

const mockStudents: StudentAttendance[] = [
  { id: '1', name: 'Aarav Patel', rollNo: '001', status: null },
  { id: '2', name: 'Ananya Singh', rollNo: '002', status: null },
  { id: '3', name: 'Rohan Kumar', rollNo: '003', status: null },
  { id: '4', name: 'Priya Sharma', rollNo: '004', status: null },
  { id: '5', name: 'Arjun Reddy', rollNo: '005', status: null },
  { id: '6', name: 'Kavya Nair', rollNo: '006', status: null },
  { id: '7', name: 'Vikram Joshi', rollNo: '007', status: null },
  { id: '8', name: 'Sneha Gupta', rollNo: '008', status: null },
  { id: '9', name: 'Aditya Verma', rollNo: '009', status: null },
  { id: '10', name: 'Meera Das', rollNo: '010', status: null },
];

const AttendanceManagement = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentAttendance[]>(mockStudents);
  const [submitted, setSubmitted] = useState(false);

  const setStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setStudents(students.map(s => s.id === id ? { ...s, status: s.status === status ? null : status } : s));
  };

  const markAllPresent = () => {
    setStudents(students.map(s => ({ ...s, status: 'present' })));
  };

  const handleSubmit = () => {
    const unmarked = students.filter(s => !s.status);
    if (unmarked.length > 0) {
      toast({ variant: 'destructive', title: 'Incomplete', description: `${unmarked.length} student(s) are not marked.` });
      return;
    }
    setSubmitted(true);
    toast({ title: 'Attendance Saved', description: `Attendance for ${selectedDate} has been recorded.` });
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;

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
        <StatWidget title="Late" value={lateCount} icon={Clock} iconColor="bg-warning/10 text-warning" />
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
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={selectClasses}>
                <option value="">Select Class</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={`class-${i + 1}`}>Class {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className={selectClasses}>
                <option value="">Select Section</option>
                {['A', 'B', 'C', 'D'].map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={markAllPresent} className="w-full">Mark All Present</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground sm:grid-cols-[60px_1fr_auto]">
              <span className="hidden sm:block">Roll</span>
              <span>Student Name</span>
              <div className="flex gap-6">
                <span className="w-16 text-center">Present</span>
                <span className="w-16 text-center">Absent</span>
                <span className="w-16 text-center">Late</span>
              </div>
            </div>

            {students.map((student) => (
              <div
                key={student.id}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border px-4 py-3 transition-colors sm:grid-cols-[60px_1fr_auto] ${
                  student.status === 'present' ? 'border-success/20 bg-success/5' :
                  student.status === 'absent' ? 'border-destructive/20 bg-destructive/5' :
                  student.status === 'late' ? 'border-warning/20 bg-warning/5' : ''
                }`}
              >
                <span className="hidden text-sm font-medium text-muted-foreground sm:block">{student.rollNo}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{student.name}</span>
                  {student.status && (
                    <Badge variant="secondary" className={`text-xs ${
                      student.status === 'present' ? 'bg-success/10 text-success' :
                      student.status === 'absent' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {student.status}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="flex w-16 justify-center">
                    <Checkbox checked={student.status === 'present'} onCheckedChange={() => setStatus(student.id, 'present')} disabled={submitted} />
                  </div>
                  <div className="flex w-16 justify-center">
                    <Checkbox checked={student.status === 'absent'} onCheckedChange={() => setStatus(student.id, 'absent')} disabled={submitted} />
                  </div>
                  <div className="flex w-16 justify-center">
                    <Checkbox checked={student.status === 'late'} onCheckedChange={() => setStatus(student.id, 'late')} disabled={submitted} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSubmit} disabled={submitted}>
              {submitted ? 'Attendance Saved' : 'Save Attendance'}
            </Button>
            {submitted && (
              <Button variant="outline" onClick={() => { setSubmitted(false); setStudents(mockStudents); }}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;
