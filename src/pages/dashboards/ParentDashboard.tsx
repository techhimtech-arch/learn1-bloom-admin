import { useEffect, useState } from 'react';
import { GraduationCap, ClipboardCheck, IndianRupee, BookOpen, Calendar, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatWidget from '@/components/shared/StatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { parentApi } from '@/pages/services/api';
import { showApiError } from '@/lib/api-toast';
import { format } from 'date-fns';

interface StudentProfile {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: string;
  remarks?: string;
}

interface FeeData {
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentHistory: {
    _id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }[];
}

interface SubjectResult {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks?: string;
}

interface ResultData {
  subjectWiseMarks: SubjectResult[];
  total: { marksObtained: number; maxMarks: number; percentage: string };
  grade: string;
}

const ParentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, attendanceRes, feesRes, resultsRes] = await Promise.allSettled([
          parentApi.getProfile(),
          parentApi.getAttendance(),
          parentApi.getFees(),
          parentApi.getResults(),
        ]);

        if (profileRes.status === 'fulfilled') {
          setStudent(profileRes.value.data.data?.student || null);
        }
        if (attendanceRes.status === 'fulfilled') {
          setAttendance(attendanceRes.value.data.data?.attendance || []);
        }
        if (feesRes.status === 'fulfilled') {
          const fd = feesRes.value.data.data;
          if (fd) setFees({ totalAmount: fd.totalAmount, paidAmount: fd.paidAmount, balanceAmount: fd.balanceAmount, paymentHistory: fd.paymentHistory || [] });
        }
        if (resultsRes.status === 'fulfilled') {
          const rd = resultsRes.value.data.data;
          if (rd) setResults({ subjectWiseMarks: rd.subjectWiseMarks || [], total: rd.total, grade: rd.grade });
        }
      } catch (err) {
        showApiError(err, 'Failed to load parent dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const attendancePercent = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Parent'}</p>
      </div>

      {/* Child Info Card */}
      {student ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-foreground">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-muted-foreground">
                {student.classId?.name} • {student.sectionId?.name} • Adm: {student.admissionNumber}
              </p>
            </div>
            <Badge variant="secondary">{student.gender}</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No linked student found. Please contact your school administration.</p>
          </CardContent>
        </Card>
      )}

      {/* Stat Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Attendance"
          value={`${attendancePercent}%`}
          change={`${presentCount} present / ${absentCount} absent`}
          changeType={attendancePercent >= 75 ? 'positive' : 'negative'}
          icon={ClipboardCheck}
          iconColor="bg-primary/10 text-primary"
        />
        <StatWidget
          title="Total Fee"
          value={fees ? `₹${fees.totalAmount.toLocaleString()}` : '—'}
          change={fees ? `Paid: ₹${fees.paidAmount.toLocaleString()}` : 'N/A'}
          changeType="neutral"
          icon={IndianRupee}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatWidget
          title="Fee Balance"
          value={fees ? `₹${fees.balanceAmount.toLocaleString()}` : '—'}
          change={fees && fees.balanceAmount > 0 ? 'Pending' : 'Cleared'}
          changeType={fees && fees.balanceAmount > 0 ? 'negative' : 'positive'}
          icon={IndianRupee}
          iconColor="bg-destructive/10 text-destructive"
        />
        <StatWidget
          title="Overall Grade"
          value={results?.grade || '—'}
          change={results?.total ? `${results.total.percentage}%` : 'N/A'}
          changeType="neutral"
          icon={GraduationCap}
          iconColor="bg-accent/50 text-accent-foreground"
        />
      </div>

      {/* Attendance & Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendance.slice(0, 15).map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-sm text-foreground">{format(new Date(a.date), 'dd MMM yyyy')}</span>
                    <Badge variant={a.status === 'Present' ? 'default' : 'destructive'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attendance records available.</p>
            )}
          </CardContent>
        </Card>

        {/* Exam Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results && results.subjectWiseMarks.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.subjectWiseMarks.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">{s.marksObtained}/{s.maxMarks}</p>
                    </div>
                    <Badge variant="outline">{s.grade}</Badge>
                  </div>
                ))}
                <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Total: {results.total.marksObtained}/{results.total.maxMarks} ({results.total.percentage}%)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exam results available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {fees && fees.paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fees.paymentHistory.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">₹{p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.paymentDate), 'dd MMM yyyy')} • {p.paymentMethod}</p>
                  </div>
                  <Badge variant={p.status === 'Completed' ? 'default' : 'secondary'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentDashboard;
