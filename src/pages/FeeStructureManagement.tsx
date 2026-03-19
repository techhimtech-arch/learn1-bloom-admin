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
import { feeApi } from '@/services/api';
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

interface FeeStructure {
  id: string;
  feeHead: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time';
  isMandatory: boolean;
  applicableTo: 'all' | 'class' | 'section';
  applicableIds?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeeFilters {
  search: string;
  frequency: string;
  mandatory: string;
  applicableTo: string;
}

export default function FeeStructureManagement() {
  const [filters, setFilters] = useState<FeeFilters>({
    search: '',
    frequency: '',
    mandatory: '',
    applicableTo: '',
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
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.frequency) params.append('frequency', filters.frequency);
      if (filters.mandatory) params.append('mandatory', filters.mandatory);
      if (filters.applicableTo) params.append('applicableTo', filters.applicableTo);

      const response = await feeApi.getStructure();
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

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      'monthly': 'bg-blue-100 text-blue-800',
      'quarterly': 'bg-green-100 text-green-800',
      'half-yearly': 'bg-yellow-100 text-yellow-800',
      'yearly': 'bg-purple-100 text-purple-800',
      'one-time': 'bg-orange-100 text-orange-800',
    };
    return colors[frequency] || 'bg-gray-100 text-gray-800';
  };

  const getMandatoryColor = (isMandatory: boolean) => {
    return isMandatory ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getApplicableToColor = (applicableTo: string) => {
    const colors: Record<string, string> = {
      'all': 'bg-blue-100 text-blue-800',
      'class': 'bg-purple-100 text-purple-800',
      'section': 'bg-orange-100 text-orange-800',
    };
    return colors[applicableTo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structure</h1>
          <p className="text-muted-foreground">
            Manage fee heads, amounts, and payment frequencies
          </p>
        </div>
        <PermissionGuard permission="manage_fee_structure">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Fee Head
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search fee heads..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />

            <Select value={filters.frequency} onValueChange={(value) => setFilters(prev => ({ ...prev, frequency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Frequencies</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="one-time">One-Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.mandatory} onValueChange={(value) => setFilters(prev => ({ ...prev, mandatory: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="true">Mandatory</SelectItem>
                <SelectItem value="false">Optional</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.applicableTo} onValueChange={(value) => setFilters(prev => ({ ...prev, applicableTo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Applicable To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="class">Specific Classes</SelectItem>
                <SelectItem value="section">Specific Sections</SelectItem>
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
            Fee Heads ({feeStructures.length})
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
              <h3 className="text-lg font-semibold">No fee heads found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.frequency || filters.mandatory || filters.applicableTo
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first fee head'}
              </p>
              <PermissionGuard permission="manage_fee_structure">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Fee Head
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Head</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applicable To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee: FeeStructure) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{fee.feeHead}</div>
                          {fee.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {fee.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{fee.amount.toLocaleString('en-IN')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFrequencyColor(fee.frequency)}>
                          {fee.frequency.charAt(0).toUpperCase() + fee.frequency.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMandatoryColor(fee.isMandatory)}>
                          {fee.isMandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getApplicableToColor(fee.applicableTo)}>
                          {fee.applicableTo === 'all' ? 'All Students' : 
                           fee.applicableTo === 'class' ? 'Specific Classes' : 'Specific Sections'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {fee.description || '-'}
                        </div>
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
                                  <AlertDialogTitle>Delete Fee Head</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{fee.feeHead}"? This action cannot be undone.
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
