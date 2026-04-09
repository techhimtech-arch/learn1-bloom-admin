import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FeePaymentForm } from '@/components/fee/FeePaymentForm';
import { studentPortalApi } from '@/services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface StudentFee {
  id: string;
  studentId: string;
  feeHead: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  frequency: string;
  isMandatory: boolean;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  payments?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    transactionId?: string;
    receiptNumber: string;
  }>;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class?: { name: string };
  section?: { name: string };
}

export default function StudentFeeManagement() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: feeData, isLoading } = useQuery({
    queryKey: ['student-fees'],
    queryFn: async () => {
      const response = await studentPortalApi.getFees();
      return response.data;
    },
  });

  const fees: StudentFee[] = feeData?.data?.fees || feeData?.fees || [];
  const payments: any[] = feeData?.data?.payments || feeData?.payments || [];
  const student: Student | null = feeData?.data?.student || feeData?.student || null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const calculateTotals = () => {
    const totalFee = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalDue = fees.reduce((sum, fee) => sum + fee.dueAmount, 0);
    const overdueAmount = fees
      .filter(fee => fee.status === 'overdue')
      .reduce((sum, fee) => sum + fee.dueAmount, 0);
    return { totalFee, totalPaid, totalDue, overdueAmount };
  };

  const totals = calculateTotals();

  const handlePayFee = (fee: StudentFee) => {
    setSelectedFee(fee);
    setShowPaymentForm(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Fee Management</h1>
          {student && (
            <p className="text-muted-foreground">
              {student.name} - {student.class?.name} {student.section?.name}
            </p>
          )}
        </div>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.totalFee.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totals.totalPaid.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{totals.totalDue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totals.overdueAmount.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No fees found</h3>
              <p className="text-muted-foreground">No fee records available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Head</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id} className={fee.status === 'overdue' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{fee.feeHead}</div>
                          <div className="text-sm text-muted-foreground">{fee.frequency}</div>
                        </div>
                      </TableCell>
                      <TableCell>₹{fee.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-green-600">₹{fee.paidAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className={fee.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        ₹{fee.dueAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(fee.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fee.dueAmount > 0 && (
                          <Button variant="outline" size="sm" onClick={() => handlePayFee(fee)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground">No payment history available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id || payment._id}>
                      <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                      <TableCell>₹{payment.amount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentModeIcon(payment.paymentMode)}
                          <span>{payment.paymentMode?.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payment.transactionId || '-'}</TableCell>
                      <TableCell>
                        {payment.paymentDate && format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && student && (
        <FeePaymentForm
          fee={selectedFee}
          student={student}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedFee(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['student-fees'] });
            setShowPaymentForm(false);
            setSelectedFee(null);
          }}
        />
      )}
    </div>
  );
}