import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Receipt, Search, Eye, Undo2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { accountantApi } from '@/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantPayments() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ startDate: '', endDate: '', search: '' });
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [refundFor, setRefundFor] = useState<any | null>(null);
  const [refundForm, setRefundForm] = useState({ refundAmount: 0, reason: '', remarks: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['accountant-payments', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await accountantApi.getPayments(params);
      return res.data;
    },
  });

  const payments = (data?.data || []) as any[];
  const summary = data?.summary || {};

  const filteredPayments = filters.search
    ? payments.filter((p) => {
        const q = filters.search.toLowerCase();
        return (
          (p.studentName || '').toLowerCase().includes(q) ||
          (p.receiptNumber || '').toLowerCase().includes(q)
        );
      })
    : payments;

  const { data: receiptData, isLoading: receiptLoading } = useQuery({
    queryKey: ['fee-receipt', receiptId],
    queryFn: async () => {
      if (!receiptId) return null;
      const res = await accountantApi.getReceipt(receiptId);
      return res.data?.data;
    },
    enabled: !!receiptId,
  });

  const refundMutation = useMutation({
    mutationFn: (payload: { paymentId: string; data: Record<string, unknown> }) =>
      accountantApi.refund(payload.paymentId, payload.data),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['accountant-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-recent-payments'] });
      setRefundFor(null);
      setRefundForm({ refundAmount: 0, reason: '', remarks: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    },
  });

  const submitRefund = () => {
    if (!refundFor) return;
    if (!refundForm.refundAmount || refundForm.refundAmount <= 0) {
      toast.error('Enter a valid refund amount');
      return;
    }
    if (!refundForm.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    refundMutation.mutate({
      paymentId: refundFor.paymentId || refundFor.id,
      data: refundForm,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments &amp; Receipts</h1>
        <p className="text-sm text-muted-foreground">
          View all fee payments, print receipts, and process refunds.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-primary">
            {formatINR(summary.totalPayments || 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{summary.count || payments.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg. Payment</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatINR(summary.averagePayment || 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Start Date</Label>
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">End Date</Label>
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Student or receipt #"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" /> Payments ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p: any) => (
                    <TableRow key={p.paymentId || p.id}>
                      <TableCell className="font-mono text-xs">{p.receiptNumber || '-'}</TableCell>
                      <TableCell className="font-medium">{p.studentName}</TableCell>
                      <TableCell>{p.class || p.className || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{(p.paymentMode || 'cash').toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{formatINR(p.amount)}</TableCell>
                      <TableCell className="text-sm">
                        {p.date ? format(new Date(p.date), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setReceiptId(p.paymentId || p.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRefundFor(p);
                              setRefundForm({ refundAmount: p.amount, reason: '', remarks: '' });
                            }}
                          >
                            <Undo2 className="h-4 w-4" />
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

      {/* Receipt Dialog */}
      <Dialog open={!!receiptId} onOpenChange={(o) => !o && setReceiptId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Official record of fee payment.</DialogDescription>
          </DialogHeader>
          {receiptLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : receiptData ? (
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt #</span><span className="font-mono">{receiptData.receiptNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{receiptData.studentName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{receiptData.date ? format(new Date(receiptData.date), 'MMM dd, yyyy') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{receiptData.paymentMode}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Amount Paid</span><span className="text-primary">{formatINR(receiptData.amount)}</span></div>
              {receiptData.remainingBalance !== undefined && (
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining Balance</span><span>{formatINR(receiptData.remainingBalance)}</span></div>
              )}
              {receiptData.signature && (
                <div className="pt-4 text-right text-xs text-muted-foreground">— {receiptData.signature}</div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Receipt unavailable.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button onClick={() => setReceiptId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!refundFor} onOpenChange={(o) => !o && setRefundFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund for {refundFor?.studentName} (receipt {refundFor?.receiptNumber}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Refund Amount (₹) *</Label>
              <Input
                type="number"
                min={1}
                max={refundFor?.amount}
                value={refundForm.refundAmount || ''}
                onChange={(e) => setRefundForm({ ...refundForm, refundAmount: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Original: {formatINR(refundFor?.amount || 0)}</p>
            </div>
            <div>
              <Label>Reason *</Label>
              <Input
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                placeholder="e.g. Over-payment correction"
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                rows={2}
                value={refundForm.remarks}
                onChange={(e) => setRefundForm({ ...refundForm, remarks: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundFor(null)}>Cancel</Button>
            <Button onClick={submitRefund} disabled={refundMutation.isPending}>
              {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
