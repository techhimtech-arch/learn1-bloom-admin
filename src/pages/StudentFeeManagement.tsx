import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
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
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  class?: {
    name: string;
  };
  section?: {
    name: string;
  };
}

interface FeeFilters {
  status: string;
  feeType: string;
  search: string;
}

export default function StudentFeeManagement() {
  const [filters, setFilters] = useState<FeeFilters>({
    status: '',
    feeType: '',
    search: '',
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  const queryClient = useQueryClient();

  const {
    data: feeData,
    isLoading: feeLoading,
  } = useQuery({
    queryKey: ['student-fees', filters],
    queryFn: async () => {
      const response = await studentPortalApi.getFees();
      // New API returns { fees: [...], summary: {...} }
      return response.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: (data: any) => feeApi.pay(data),
    onSuccess: () => {
      toast.success('Payment processed successfully');
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-payments', studentId] });
      setShowPaymentForm(false);
      setSelectedFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  useEffect(() => {
    if (!studentId) {
      navigate('/fees');
    }
  }, [studentId, navigate]);

  const student = studentData?.data?.student as Student;
  const fees = studentData?.data?.fees || [];
  const payments = paymentsData?.data || [];

  const handlePayFee = (fee: StudentFee) => {
    setSelectedFee(fee);
    setShowPaymentForm(true);
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const response = await feeApi.getReceipt(paymentId);
      setViewingReceipt(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch receipt');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'unpaid': 'bg-gray-100 text-gray-800',
      'overdue': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        return <DollarSign className="h-4 w-4" />;
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

  if (!studentId || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
          <p className="text-muted-foreground">The requested student could not be found.</p>
        </div>
      </div>
    );
  }

  if (studentLoading) {
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
          <p className="text-muted-foreground">
            {student.name} - {student.class?.name} {student.section?.name}
          </p>
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
                {fees.map((fee: StudentFee) => (
                  <TableRow key={fee.id} className={fee.status === 'overdue' ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fee.feeHead}</div>
                        <div className="text-sm text-muted-foreground">{fee.frequency}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">₹{fee.amount.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">₹{fee.paidAmount.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${fee.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{fee.dueAmount.toLocaleString('en-IN')}
                      </div>
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
                      <div className="flex items-center justify-end gap-2">
                        {fee.dueAmount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayFee(fee)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
          {paymentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground">
                No payment history available for this student.
              </p>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.receiptNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{payment.amount.toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentModeIcon(payment.paymentMode)}
                          <span>{payment.paymentMode.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{payment.transactionId || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(payment.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
      {showPaymentForm && selectedFee && (
        <FeePaymentForm
          fee={selectedFee}
          student={student}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedFee(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['student', studentId] });
            setShowPaymentForm(false);
            setSelectedFee(null);
          }}
        />
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment Receipt
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingReceipt(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Receipt Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold">Payment Receipt</h2>
                  <p className="text-muted-foreground">Receipt #{viewingReceipt.receiptNumber}</p>
                </div>

                {/* Student Details */}
                <div>
                  <h3 className="font-semibold mb-2">Student Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{viewingReceipt.student?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Roll Number: </span>
                      <span className="font-medium">{viewingReceipt.student?.rollNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class: </span>
                      <span className="font-medium">{viewingReceipt.student?.class?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Section: </span>
                      <span className="font-medium">{viewingReceipt.student?.section?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold mb-2">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount Paid: </span>
                      <span className="font-bold text-lg">₹{viewingReceipt.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Mode: </span>
                      <span className="font-medium">{viewingReceipt.paymentMode?.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Transaction ID: </span>
                      <span className="font-mono">{viewingReceipt.transactionId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Date: </span>
                      <span className="font-medium">
                        {format(new Date(viewingReceipt.paymentDate), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewingReceipt(null)}>
                    Close
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
