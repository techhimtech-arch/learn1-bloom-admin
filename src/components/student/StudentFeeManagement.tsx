import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle, CheckCircle, Clock, Download, CreditCard, FileText } from 'lucide-react';

interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  method: string;
  referenceNo: string;
  receipt: string;
}

interface FeeData {
  studentId: string;
  studentName: string;
  class: string;
  academicYear: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  components: FeeComponent[];
  paymentHistory: PaymentHistory[];
  lastPaymentDate: string;
}

export const StudentFeeManagement = () => {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockData: FeeData = {
        studentId: 'STU001',
        studentName: 'Rajesh Kumar',
        class: '11-A',
        academicYear: '2023-24',
        totalFee: 150000,
        paidAmount: 100000,
        pendingAmount: 50000,
        components: [
          {
            id: 'tuition',
            name: 'Tuition Fee',
            amount: 80000,
            dueDate: '2024-04-01',
            status: 'paid'
          },
          {
            id: 'transport',
            name: 'Transport Fee',
            amount: 30000,
            dueDate: '2024-04-01',
            status: 'pending'
          },
          {
            id: 'exam',
            name: 'Examination Fee',
            amount: 20000,
            dueDate: '2024-04-15',
            status: 'overdue'
          },
          {
            id: 'activity',
            name: 'Activity Fee',
            amount: 10000,
            dueDate: '2024-05-01',
            status: 'pending'
          },
          {
            id: 'development',
            name: 'Development Charge',
            amount: 10000,
            dueDate: '2024-05-01',
            status: 'pending'
          }
        ],
        paymentHistory: [
          {
            id: 'pay001',
            date: '2024-03-15',
            amount: 50000,
            method: 'Online Transfer',
            referenceNo: 'TXN123456789',
            receipt: 'RCP001'
          },
          {
            id: 'pay002',
            date: '2024-02-20',
            amount: 50000,
            method: 'Cheque',
            referenceNo: 'CHQ987654',
            receipt: 'RCP002'
          }
        ],
        lastPaymentDate: '2024-03-15'
      };
      setFeeData(mockData);
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !feeData) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingComponent = feeData.components.filter(c => c.status !== 'paid');
  const paidPercentage = (feeData.paidAmount / feeData.totalFee) * 100;
  const hasOverdue = feeData.components.some(c => c.status === 'overdue');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {hasOverdue && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have overdue fees. Please pay before ₹20,000 to avoid late penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Fee Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{feeData.totalFee.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">2023-24 Academic Year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{feeData.paidAmount.toLocaleString()}</div>
            <div className="mt-2">
              <Progress value={paidPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(paidPercentage)}% paid</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${feeData.pendingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ₹{feeData.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {feeData.pendingAmount > 0 ? 'Amount Due' : 'All Fees Paid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="breakdown">Fee Breakdown</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="print">Receipt & Print</TabsTrigger>
        </TabsList>

        {/* Fee Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Components</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed breakdown of all fee components for {feeData.academicYear}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {feeData.components.map(component => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(component.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{component.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(component.dueDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold">₹{component.amount.toLocaleString()}</p>
                    <Badge className={getStatusColor(component.status)} variant="secondary">
                      {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Fees Summary */}
          {pendingComponent.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  Payment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {pendingComponent.map(comp => (
                    <div key={comp.id} className="flex justify-between text-sm">
                      <span>{comp.name}</span>
                      <span className="font-semibold">₹{comp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Pending</span>
                    <span>₹{feeData.pendingAmount.toLocaleString()}</span>
                  </div>
                </div>

                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Online Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Amount to Pay</p>
                        <p className="text-2xl font-bold text-orange-600">₹{feeData.pendingAmount.toLocaleString()}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Select Payment Method</label>
                        <div className="space-y-2">
                          {['Credit Card', 'Debit Card', 'UPI', 'Net Banking'].map(method => (
                            <label key={method} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                              <input
                                type="radio"
                                name="payment-method"
                                value={method}
                                checked={paymentMethod === method}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              />
                              <span className="text-sm">{method}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full" disabled={!paymentMethod}>
                        Proceed to Payment Gateway
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full">
                  Pay via Bank Transfer
                </Button>
              </CardContent>
            </Card>
          )}

          {feeData.pendingAmount === 0 && (
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <p className="font-semibold text-green-800">All fees paid! Thank you for on-time payment.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last payment: {new Date(feeData.lastPaymentDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {feeData.paymentHistory.length > 0 ? (
                feeData.paymentHistory.map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{payment.method}</p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {payment.referenceNo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(payment.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-green-600">₹{payment.amount.toLocaleString()}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Payment Receipt</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 text-sm">
                            <div className="border-b pb-3">
                              <p className="text-muted-foreground">Receipt No.</p>
                              <p className="font-semibold">{payment.receipt}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-muted-foreground">Transaction Date</p>
                                <p className="font-semibold">{new Date(payment.date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Amount Paid</p>
                                <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payment Method</p>
                              <p className="font-semibold">{payment.method}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Reference No.</p>
                              <p className="font-semibold">{payment.referenceNo}</p>
                            </div>
                            <Button className="w-full" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt (PDF)
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No payment history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt & Print Tab */}
        <TabsContent value="print" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Fee Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Student Name:</span>
                  <span className="font-semibold">{feeData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Student ID:</span>
                  <span className="font-semibold">{feeData.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="font-semibold">{feeData.class}</span>
                </div>
                <div className="flex justify-between">
                  <span>Academic Year:</span>
                  <span className="font-semibold">{feeData.academicYear}</span>
                </div>
              </div>

              <div className="border-top pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fee Component</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-right py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.components.map(comp => (
                      <tr key={comp.id} className="border-b">
                        <td className="py-2">{comp.name}</td>
                        <td className="text-right">₹{comp.amount.toLocaleString()}</td>
                        <td className="text-right">
                          <Badge className={`${getStatusColor(comp.status)} text-xs`} variant="secondary">
                            {comp.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-3">Total</td>
                      <td className="text-right">₹{feeData.totalFee.toLocaleString()}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                <p className="text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-green-600">₹{feeData.paidAmount.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Important Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Fees must be paid by the due date to avoid late fees</p>
          <p>• Late payment will attract 2% additional charges</p>
          <p>• Receipts are issued automatically after online payment</p>
          <p>• For queries, contact accounts department: accounts@school.edu</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeeManagement;
