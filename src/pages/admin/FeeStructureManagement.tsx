import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { FeeStructureForm } from '@/components/fee/FeeStructureForm';
import { feeApi, classApi } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface FeeStructure {
  id: string;
  _id?: string;
  academicYearId: string;
  classId: string;
  feeType: string;
  feeName: string;
  amount: number;
  dueDate: string;
  applicableTo: 'all' | 'specific';
  description?: string;
  lateFee?: number;
  concessionPercentage?: number;
  academicYear?: { name: string };
  class?: { name: string };
}

interface FeeFilters {
  search: string;
  feeType: string;
  classId: string;
}

export default function FeeStructureManagement() {
  const [filters, setFilters] = useState<FeeFilters>({
    search: '',
    feeType: '',
    classId: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null);

  const queryClient = useQueryClient();

  const {
    data: feeStructureData,
    isLoading: feesLoading,
    refetch,
  } = useQuery({
    queryKey: ['fee-structure', filters],
    queryFn: async () => {
      const response = await feeApi.getStructure();
      return response.data;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feeApi.deleteStructure(id),
    onSuccess: () => {
      toast.success('Fee structure deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['fee-structure'] });
      setDeletingFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee structure');
    },
  });

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleDelete = (fee: FeeStructure) => {
    setDeletingFee(fee);
  };

  const confirmDelete = () => {
    if (deletingFee) {
      deleteMutation.mutate(deletingFee.id);
    }
  };

  const feeStructures = feeStructureData?.data || [];
  const classes = classesData?.data || [];

  const getFeeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'tuition': 'bg-blue-100 text-blue-800',
      'transport': 'bg-green-100 text-green-800',
      'admission': 'bg-purple-100 text-purple-800',
      'exam': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structure</h1>
          <p className="text-muted-foreground">
            Manage fee types, classes, and academic years
          </p>
        </div>
        <PermissionGuard permission="manage_fee_structure">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Fee Structure
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search fee names..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />

            <Select value={filters.feeType} onValueChange={(value) => setFilters(prev => ({ ...prev, feeType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Fee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tuition">Tuition</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="admission">Admission</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Structures ({feeStructures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No fee structures found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.feeType || filters.classId
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first fee structure'}
              </p>
              <PermissionGuard permission="manage_fee_structure">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Fee Structure
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee: FeeStructure) => (
                    <TableRow key={fee._id || fee.id}>
                      <TableCell>
                        <div className="font-medium">{fee.feeName}</div>
                        <div className="text-xs text-muted-foreground">{fee.description || 'No description'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFeeTypeColor(fee.feeType)}>
                          {fee.feeType.charAt(0).toUpperCase() + fee.feeType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.class?.name || 'All'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{fee.amount.toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        {fee.dueDate ? format(new Date(fee.dueDate), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="edit_fee_structure">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(fee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>

                          <PermissionGuard permission="delete_fee_structure">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(fee)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{fee.feeName}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PermissionGuard>
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

      {showForm && (
        <FeeStructureForm
          fee={editingFee}
          onClose={() => {
            setShowForm(false);
            setEditingFee(null);
          }}
          onSuccess={() => {
            refetch();
            setShowForm(false);
            setEditingFee(null);
          }}
        />
      )}
    </div>
  );
}
