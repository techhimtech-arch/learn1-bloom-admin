import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { accountantApi, studentApi, feeApi } from '@/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantPaymentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all students for selector
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const res = await studentApi.getAll({ limit: 500 });
      return res.data?.data || [];
    },
  });

  const students = studentsData || [];

  // Form Setup
  const form = useForm({
    defaultValues: {
      studentId: '',
      feeId: '',
      amount: '',
      paymentMode: 'cash',
      transactionDate: new Date().toISOString().split('T')[0],
      remarks: '',
      transactionId: '',
    },
  });

  const studentId = form.watch('studentId');
  const feeId = form.watch('feeId');
  const amount = form.watch('amount');
  const paymentMode = form.watch('paymentMode');

  // Fetch student fees when studentId is changed
  const { data: studentFeesData, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees-detail', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const res = await accountantApi.getStudentFees(studentId);
      return res.data?.data;
    },
    enabled: !!studentId,
  });

  const studentFees = studentFeesData as any;
  const dueAmount = studentFees?.summary?.totalBalance || 0;
  const payableFees = studentFees?.fees?.filter((f: any) => f.status === 'pending' || f.status === 'partial' || f.balanceAmount > 0) || [];

  const selectedStudent = students.find((s: any) => s.id === studentId || s._id === studentId);
  const selectedFee = payableFees.find((f: any) => (f._id || f.id) === feeId);
  const feeBalance = selectedFee?.balanceAmount || 0;

  // Sync default values when student's fee dues load
  useEffect(() => {
    if (payableFees.length > 0) {
      const firstPending = payableFees[0];
      form.setValue('feeId', firstPending._id || firstPending.id || '');
      form.setValue('amount', firstPending.balanceAmount.toString());
    } else {
      form.setValue('feeId', '');
      form.setValue('amount', '');
    }
  }, [studentFeesData]);

  // Dynamic Validation Schema defined inside component to access dynamic feeBalance closure variable
  const paymentFormSchema = z.object({
    studentId: z.string().min(1, 'Please select a student'),
    feeId: z.string().min(1, 'Please select a pending fee item to pay'),
    amount: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number({ invalid_type_error: 'Amount must be a valid number' })
       .positive('Amount must be greater than 0')
    ),
    paymentMode: z.string().min(1, 'Please select a payment mode'),
    transactionId: z.string().optional(),
    transactionDate: z.string().min(1, 'Transaction date is required'),
    remarks: z.string().optional(),
  }).superRefine((data, ctx) => {
    // If paymentMode is not cash, transactionId must be provided
    if (data.paymentMode !== 'cash' && (!data.transactionId || !data.transactionId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Transaction reference is required for non-cash modes (UPI, Card, Cheque, Transfer)',
        path: ['transactionId'],
      });
    }
    // Dynamic balance validation (prevents over-paying single fee head)
    if (data.amount > feeBalance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Amount cannot exceed the pending fee item balance of ${formatINR(feeBalance)}`,
        path: ['amount'],
      });
    }
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
      form.reset({
        studentId: '',
        feeId: '',
        amount: '',
        paymentMode: 'cash',
        transactionDate: new Date().toISOString().split('T')[0],
        remarks: '',
        transactionId: '',
      });
      setTimeout(() => navigate('/fees/payments'), 1500);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const onSubmit = (data: any) => {
    // Re-verify the schema manually to inject the closure balance check
    const validationResult = paymentFormSchema.safeParse(data);
    if (!validationResult.success) {
      // Form state will automatically reflect the validation errors
      validationResult.error.issues.forEach(issue => {
        form.setError(issue.path[0] as any, {
          type: 'custom',
          message: issue.message
        });
      });
      return;
    }

    recordPaymentMutation.mutate({
      feeId: data.feeId,
      amount: data.amount,
      paymentMethod: data.paymentMode,
      transactionId: data.transactionId,
      remarks: data.remarks,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fees/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">Add a new fee payment entry with dynamic balances verification</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Select Student *</FormLabel>
                      {studentsLoading ? (
                        <Skeleton className="h-10 w-full mt-2" />
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-64">
                            {students.map((student: any) => (
                              <SelectItem key={student.id || student._id} value={student.id || student._id}>
                                {student.name} ({student.rollNumber}) - {student.class?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fee Item Selection */}
                {studentId && (
                  <FormField
                    control={form.control}
                    name="feeId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Select Pending Fee Item *</FormLabel>
                        {feesLoading ? (
                          <Skeleton className="h-10 w-full mt-2" />
                        ) : payableFees.length === 0 ? (
                          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg mt-2">
                            ✓ No pending fee items for this student.
                          </div>
                        ) : (
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              const f = payableFees.find((x: any) => (x._id || x.id) === val);
                              if (f) {
                                form.setValue('amount', f.balanceAmount.toString());
                                form.clearErrors('amount');
                              }
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a pending fee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {payableFees.map((fee: any) => (
                                <SelectItem key={fee._id || fee.id} value={fee._id || fee.id}>
                                  {fee.feeName} - Pending: {formatINR(fee.balanceAmount)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Student Details Card */}
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

                {/* Outstanding Dues Dashboard Card */}
                {feesLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  studentId && (
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
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        {feeId && field.value && !form.formState.errors.amount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(() => {
                              const amt = parseFloat(field.value) || 0;
                              return amt > feeBalance
                                ? `Over-payment of ${formatINR(amt - feeBalance)}`
                                : `Remaining for this item: ${formatINR(feeBalance - amt)}`;
                            })()}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Payment Mode *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {paymentMode !== 'cash' && (
                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Transaction ID / Cheque Reference *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter transaction ref number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Transaction Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Remarks / Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any remarks or notes (optional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
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
                    {formatINR(amount ? parseFloat(amount) : 0)}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground mb-1">Outstanding Due</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatINR(dueAmount)}
                  </div>
                </div>

                {amount && dueAmount > 0 && (
                  <div className="border-t pt-4">
                    <div className="text-xs text-muted-foreground mb-1">After Payment</div>
                    <div className={`text-lg font-bold ${
                      parseFloat(amount) >= dueAmount ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {formatINR(Math.max(0, dueAmount - parseFloat(amount)))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground mb-1">Mode</div>
                  <div className="capitalize font-medium text-sm">
                    {paymentMode.replace('_', ' ')}
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
      </Form>
    </div>
  );
}
