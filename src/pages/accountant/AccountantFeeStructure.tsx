import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Filter, ArrowLeft, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { accountantApi, academicYearApi, classApi } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FeeStructureForm } from '@/components/fee/FeeStructureForm';

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AccountantFeeStructure() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    classId: 'all',
    academicYearId: 'all',
    search: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);

  // Fetch academic years
  const { data: yearData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await academicYearApi.getAll({ isActive: true });
      return res.data?.data || [];
    },
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classApi.getAll();
      return res.data?.data || [];
    },
  });

  // Fetch fee structures
  const { data: feeStructureData, isLoading } = useQuery({
    queryKey: ['fee-structures', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.classId && filters.classId !== 'all') params.classId = filters.classId;
      if (filters.academicYearId && filters.academicYearId !== 'all') params.academicYearId = filters.academicYearId;
      const res = await accountantApi.getFeeStructure(params);
      return res.data?.data || [];
    },
  });

  const structures = Array.isArray(feeStructureData) ? feeStructureData : [];
  const filteredStructures = filters.search
    ? structures.filter((s: any) =>
        (s.feeHead || '').toLowerCase().includes(filters.search.toLowerCase())
      )
    : structures;

  // Group by class
  const groupedByClass = filteredStructures.reduce((acc: Record<string, any[]>, s: any) => {
    const className = s.className || 'Unassigned';
    if (!acc[className]) acc[className] = [];
    acc[className].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/fees/payments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fee Structure Management</h1>
            <p className="text-muted-foreground">Configure and view fee structures for classes</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Academic Year</label>
              <Select value={filters.academicYearId} onValueChange={(v) => setFilters({ ...filters, academicYearId: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {(yearData || []).map((year: any) => (
                    <SelectItem key={year.id || year._id} value={year.id || year._id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Class</label>
              <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(classesData || []).map((cls: any) => (
                    <SelectItem key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Search</label>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fee type..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ classId: 'all', academicYearId: 'all', search: '' })}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structures */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredStructures.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No fee structures found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(groupedByClass)[0]} className="space-y-4">
          <TabsList>
            {Object.keys(groupedByClass).map((className) => (
              <TabsTrigger key={className} value={className}>
                {className}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedByClass).map(([className, classStructures]) => (
            <TabsContent key={className} value={className}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{className} - Fee Heads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Fee Name</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Late Fee</TableHead>
                          <TableHead className="text-right">Concession %</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(classStructures as any[]).map((structure) => (
                          <TableRow key={structure.id || structure._id}>
                            <TableCell>
                              <Badge variant="outline">
                                {(structure.frequency || '').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {structure.feeHead}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatINR(structure.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatINR(structure.lateFee || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {structure.concessionPercentage || 0}%
                            </TableCell>
                            <TableCell>
                              <Badge variant={structure.isMandatory ? 'default' : 'secondary'}>
                                {structure.isMandatory ? 'Mandatory' : 'Optional'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingFee({
                                    id: structure.id || structure._id,
                                    feeHead: structure.feeHead,
                                    amount: structure.amount,
                                    frequency: structure.frequency,
                                    isMandatory: structure.isMandatory,
                                    applicableTo: structure.applicableTo || 'all'
                                  });
                                  setShowForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Summary */}
      {filteredStructures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Total Fee Heads</div>
              <div className="text-2xl font-bold mt-2">{filteredStructures.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Annual Fees</div>
              <div className="text-2xl font-bold mt-2">
                {formatINR(
                  (filteredStructures as any[]).reduce((sum, s) => sum + (s.amount || 0), 0)
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Classes Covered</div>
              <div className="text-2xl font-bold mt-2">
                {Object.keys(groupedByClass).length}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <FeeStructureForm
          fee={editingFee}
          onClose={() => {
            setShowForm(false);
            setEditingFee(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingFee(null);
            // Can add refetch here if needed, or query invalidation
          }}
        />
      )}
    </div>
  );
}
