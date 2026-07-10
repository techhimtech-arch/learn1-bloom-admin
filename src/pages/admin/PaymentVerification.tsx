import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Mock data for payments pending verification
const initialPendingPayments = [
  {
    id: 'pay_001',
    studentName: 'Rahul Sharma',
    admissionNumber: 'ADM-2026-001',
    class: 'Class X',
    amount: 5000,
    feeHead: 'Tuition Fee - March',
    utrNumber: '312345678901',
    submittedAt: new Date().toISOString(),
    status: 'pending'
  },
  {
    id: 'pay_002',
    studentName: 'Priya Patel',
    admissionNumber: 'ADM-2026-002',
    class: 'Class IX',
    amount: 1500,
    feeHead: 'Transport Fee',
    utrNumber: '312345678902',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending'
  }
];

export default function PaymentVerification() {
  const [payments, setPayments] = useState(initialPendingPayments);
  const [searchTerm, setSearchTerm] = useState('');

  const handleVerify = (id: string, utr: string) => {
    // In a real app, this would call an API
    setPayments(payments.filter(p => p.id !== id));
    toast.success(`Payment verified successfully! Receipt generated for UTR: ${utr}`);
  };

  const handleReject = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
    toast.error('Payment rejected. Parent will be notified to retry.');
  };

  const filteredPayments = payments.filter(p => 
    p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.utrNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Verify UPI Payments
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and approve manual UPI payments submitted by parents.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending Verification</CardTitle>
            <CardDescription>
              Check your bank SMS/statement against these UTR numbers.
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search student or UTR..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payments pending verification.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR / Ref Number</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.admissionNumber} • {payment.class}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.feeHead}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono tracking-wider">
                          {payment.utrNumber}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(payment.id)}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerify(payment.id, payment.utrNumber)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Verify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
