import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { accountantApi } from '@/pages/services/api';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantDues() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accountant-dues'],
    queryFn: async () => {
      const res = await accountantApi.getDues();
      return res.data;
    },
  });

  const dues = (data?.data || []) as any[];
  const summary = data?.summary || {};

  const filtered = search
    ? dues.filter((d) => {
        const q = search.toLowerCase();
        return (
          (d.studentName || '').toLowerCase().includes(q) ||
          (d.rollNumber || '').toLowerCase().includes(q)
        );
      })
    : dues;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Dues</h1>
        <p className="text-sm text-muted-foreground">Students with outstanding fee balances.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Pending</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">
            {formatINR(summary.totalPendingDues || 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Students</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {summary.studentCount || dues.length}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" /> Outstanding ({filtered.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search student or roll #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No pending dues 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll #</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.studentId || d.id}>
                      <TableCell className="font-medium">{d.studentName}</TableCell>
                      <TableCell>{d.rollNumber || '-'}</TableCell>
                      <TableCell>{d.className || d.class || '-'}</TableCell>
                      <TableCell className="text-sm">{d.dueDate || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatINR(d.totalDue ?? d.dueAmount ?? 0)}
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