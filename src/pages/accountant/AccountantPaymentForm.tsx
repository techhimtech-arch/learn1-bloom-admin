import { useState, useEffect } from 'react';
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
import { accountantApi, studentApi, feeApi } from '@/services/api';

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
    transactionId: '',
  });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');

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
      return await feeApi.pay({
        feeId: payload.feeId as string,
        amount: payload.amount as number,
        paymentMethod: payload.paymentMethod as string,
        transactionId: payload.transactionId as string,
        remarks: payload.remarks as string,
      });
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
        transactionId: '',
      });
      setSelectedStudent(null);
      setSelectedFeeId('');
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
    if (!selectedFeeId) {
      toast.error('Please select a fee item to pay');
      return;
    }
    if (!formData.amount) {
      toast.error('Please enter amount');
      return;
    }

    recordPaymentMutation.mutate({
      feeId: selectedFeeId,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMode,
      transactionId: formData.transactionId,
      remarks: formData.remarks,
    });
  };

  const students = studentsData || [];
  const studentFees = studentFeesData as any;
  const dueAmount = studentFees?.summary?.totalBalance || 0;
  const payableFees = studentFees?.fees?.filter((f: any) => f.status === 'pending' || f.status === 'partial' || f.balanceAmount > 0) || [];

  useEffect(() => {
    if (payableFees.length > 0) {
      const firstPending = payableFees[0];
      setSelectedFeeId(firstPending._id || firstPending.id || '');
      setFormData(prev => ({ ...prev, amount: firstPending.balanceAmount.toString() }));
    } else {
      setSelectedFeeId('');
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  }, [studentFeesData]);

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

              {/* Fee Item Selection */}
              {formData.studentId && (
                <div>
                  <Label htmlFor="feeItem">Select Pending Fee Item *</Label>
                  {feesLoading ? (
                    <Skeleton className="h-10 w-full mt-2" />
                  ) : payableFees.length === 0 ? (
                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg mt-2">
                      ✓ No pending fee items for this student.
                    </div>
                  ) : (
                    <Select value={selectedFeeId} onValueChange={(value) => {
                      setSelectedFeeId(value);
                      const selectedFee = payableFees.find((f: any) => (f._id || f.id) === value);
                      if (selectedFee) {
                        setFormData(prev => ({ ...prev, amount: selectedFee.balanceAmount.toString() }));
                      }
                    }}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a pending fee" />
                      </SelectTrigger>
                      <SelectContent>
                        {payableFees.map((fee: any) => (
                          <SelectItem key={fee._id || fee.id} value={fee._id || fee.id}>
                            {fee.feeName} - Pending: {formatINR(fee.balanceAmount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

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
                  {selectedFeeId && formData.amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const selectedFee = payableFees.find((f: any) => (f._id || f.id) === selectedFeeId);
                        const feeBalance = selectedFee?.balanceAmount || 0;
                        const amt = parseFloat(formData.amount) || 0;
                        return amt > feeBalance
                          ? `Over-payment of ${formatINR(amt - feeBalance)}`
                          : `Remaining for this item: ${formatINR(feeBalance - amt)}`;
                      })()}
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

              {formData.paymentMode !== 'cash' && (
                <div>
                  <Label htmlFor="transactionId">Transaction ID / Cheque Reference *</Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter transaction ref number"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="mt-2"
                  />
                </div>
              )}

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
