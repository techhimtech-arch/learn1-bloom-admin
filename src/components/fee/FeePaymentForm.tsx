import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { feeApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { Loader2, CreditCard, Banknote, Smartphone } from 'lucide-react';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank-transfer']),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.paymentMode !== 'cash' && !data.transactionId) {
    return false;
  }
  return true;
}, {
  message: 'Transaction ID is required for non-cash payments',
  path: ['transactionId'],
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface StudentFee {
  id: string;
  feeHead: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  frequency: string;
  isMandatory: boolean;
  status: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class?: {
    name: string;
  };
  section?: {
    name: string;
  };
}

interface FeePaymentFormProps {
  fee: StudentFee;
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeePaymentForm({ fee, student, onClose, onSuccess }: FeePaymentFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: fee.dueAmount,
      paymentMode: 'cash',
      transactionId: '',
      remarks: '',
    },
  });

  const payMutation = useMutation({
    mutationFn: (data: PaymentFormData) => 
      feeApi.pay({
        studentId: student.id,
        feeId: fee.id,
        ...data
      }),
    onSuccess: () => {
      toast.success('Payment processed successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    payMutation.mutate(data);
  };

  const isLoading = payMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const paymentModes = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: CreditCard },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Record payment for {fee.feeHead} - {student.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Fee Details */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Fee Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fee Head:</span>
                  <span className="font-medium">{fee.feeHead}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">₹{fee.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Already Paid:</span>
                  <span className="font-medium text-green-600">₹{fee.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Due Amount:</span>
                  <span className="text-red-600">₹{fee.dueAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Student Details */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Student Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{student.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Roll Number:</span>
                  <div className="font-medium">{student.rollNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <div className="font-medium">{student.class?.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Section:</span>
                  <div className="font-medium">{student.section?.name}</div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Information</h3>
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={fee.dueAmount}
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            <div className="flex items-center gap-2">
                              {getPaymentModeIcon(mode.value)}
                              <span>{mode.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('paymentMode') !== 'cash' && (
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter transaction ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter payment remarks (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
