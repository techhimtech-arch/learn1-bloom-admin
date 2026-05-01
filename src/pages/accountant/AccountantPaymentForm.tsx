import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { accountantApi, studentApi } from '@/pages/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantPaymentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentMode: 'cash',
    transactionDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Fetch all students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const res = await studentApi.getAll({ limit: 500 });
      return res.data?.data || [];
    },
  });

  // Fetch student fees when selected
  const { data: studentFeesData, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees-detail', formData.studentId],
    queryFn: async () => {
      if (!formData.studentId) return null;
      const res = await accountantApi.getStudentFees(formData.studentId);
      return res.data?.data;
    },
    enabled: !!formData.studentId,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return await accountantApi.recordPayment(payload);
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['accountant-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-dues'] });
      setFormData({
        studentId: '',
        amount: '',
        paymentMode: 'cash',
        transactionDate: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setSelectedStudent(null);
      setTimeout(() => navigate('/fees/payments'), 1500);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleStudentChange = (studentId: string) => {
    setFormData({ ...formData, studentId });
    const student = studentsData?.find((s: any) => s.id === studentId || s._id === studentId);
    setSelectedStudent(student);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.amount) {
      toast.error('Please enter amount');
      return;
    }

    recordPaymentMutation.mutate({
      studentId: formData.studentId,
      amount: parseFloat(formData.amount),
      paymentMode: formData.paymentMode,
      transactionDate: formData.transactionDate,
      remarks: formData.remarks,
    });
  };

  const students = studentsData || [];
  const studentFees = studentFeesData as any;
  const dueAmount = studentFees?.dueAmount || studentFees?.totalDue || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fees/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">Add a new fee payment entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                {studentsLoading ? (
                  <Skeleton className="h-10 w-full mt-2" />
                ) : (
                  <Select value={formData.studentId} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {students.map((student: any) => (
                        <SelectItem key={student.id || student._id} value={student.id || student._id}>
                          {student.name} ({student.rollNumber}) - {student.class?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Student Details */}
              {selectedStudent && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedStudent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Roll Number:</span>
                    <span className="font-medium">{selectedStudent.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Class:</span>
                    <span className="font-medium">
                      {selectedStudent.class?.name} {selectedStudent.section?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Outstanding Dues */}
              {feesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                formData.studentId && (
                  <div className={`p-4 border rounded-lg ${dueAmount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Outstanding Due:</span>
                      <span className={`text-lg font-bold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatINR(dueAmount)}
                      </span>
                    </div>
                    {dueAmount === 0 && (
                      <p className="text-xs text-green-600 mt-2">✓ No outstanding dues</p>
                    )}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min="0"
                    step="0.01"
                    className="mt-2"
                  />
                  {dueAmount > 0 && formData.amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {parseFloat(formData.amount) > dueAmount
                        ? `Over-payment of ${formatINR(parseFloat(formData.amount) - dueAmount)}`
                        : `Remaining: ${formatINR(dueAmount - parseFloat(formData.amount))}`}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentMode">Payment Mode *</Label>
                  <Select value={formData.paymentMode} onValueChange={(v) => setFormData({ ...formData, paymentMode: v })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="date">Transaction Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks/Notes</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any remarks or notes (optional)"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          {/* Summary Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Student</div>
                <div className="font-medium text-sm">
                  {selectedStudent?.name || 'Not selected'}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs text-muted-foreground mb-1">Amount to Receive</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatINR(formData.amount ? parseFloat(formData.amount) : 0)}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs text-muted-foreground mb-1">Outstanding Due</div>
                <div className="text-lg font-bold text-orange-600">
                  {formatINR(dueAmount)}
                </div>
              </div>

              {formData.amount && dueAmount > 0 && (
                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground mb-1">After Payment</div>
                  <div className={`text-lg font-bold ${
                    parseFloat(formData.amount) >= dueAmount ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {formatINR(Math.max(0, dueAmount - parseFloat(formData.amount)))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="text-xs text-muted-foreground mb-1">Mode</div>
                <div className="capitalize font-medium text-sm">
                  {formData.paymentMode.replace('_', ' ')}
                </div>
              </div>

              <Button
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="w-full mt-6"
              >
                {recordPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
