import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { feeHeadApi } from '@/services/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const feeHeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  feeType: z.string().min(1, 'Fee type is required'),
  description: z.string().optional(),
});

type FeeHeadFormData = z.infer<typeof feeHeadSchema>;

interface FeeHead {
  _id: string;
  name: string;
  feeType: string;
  description?: string;
  isActive: boolean;
}

const feeTypes = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'transport', label: 'Transport' },
  { value: 'admission', label: 'Admission' },
  { value: 'exam', label: 'Exam' },
  { value: 'library', label: 'Library' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'other', label: 'Other' },
];

export default function FeeHeadsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<FeeHead | null>(null);
  
  const queryClient = useQueryClient();

  const { data: headsData, isLoading } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: async () => {
      const response = await feeHeadApi.getAll();
      return response.data;
    },
  });

  const form = useForm<FeeHeadFormData>({
    resolver: zodResolver(feeHeadSchema),
    defaultValues: {
      name: '',
      feeType: 'tuition',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FeeHeadFormData) => feeHeadApi.create(data),
    onSuccess: () => {
      toast.success('Fee head created successfully');
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create fee head');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: FeeHeadFormData }) => feeHeadApi.update(data.id, data.data),
    onSuccess: () => {
      toast.success('Fee head updated successfully');
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      setIsDialogOpen(false);
      setEditingHead(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee head');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feeHeadApi.delete(id),
    onSuccess: () => {
      toast.success('Fee head deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee head');
    },
  });

  const onSubmit = (data: FeeHeadFormData) => {
    if (editingHead) {
      updateMutation.mutate({ id: editingHead._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (head: FeeHead) => {
    setEditingHead(head);
    form.reset({
      name: head.name,
      feeType: head.feeType,
      description: head.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingHead(null);
    form.reset({
      name: '',
      feeType: 'tuition',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const heads = headsData?.data || [];
  const filteredHeads = heads.filter((head: FeeHead) => 
    head.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    head.feeType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFeeTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      tuition: 'bg-blue-100 text-blue-800 border-blue-200',
      transport: 'bg-green-100 text-green-800 border-green-200',
      admission: 'bg-purple-100 text-purple-800 border-purple-200',
      exam: 'bg-orange-100 text-orange-800 border-orange-200',
      hostel: 'bg-pink-100 text-pink-800 border-pink-200',
      library: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return variants[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Heads</h1>
          <p className="text-muted-foreground">
            Define categories for different types of fees.
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Fee Head
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Master Configuration
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fee heads..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredHeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No fee heads found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchTerm ? "No results match your search." : "Get started by defining your first fee category."}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddNew} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Define Fee Head
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Head Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHeads.map((head: FeeHead) => (
                    <TableRow key={head._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{head.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getFeeTypeBadge(head.feeType)}>
                          {head.feeType.charAt(0).toUpperCase() + head.feeType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {head.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={head.isActive ? 'default' : 'secondary'} className="rounded-full px-2.5">
                          {head.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(head)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this fee head?')) {
                                deleteMutation.mutate(head._id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingHead ? 'Edit Fee Head' : 'Add Fee Head'}</DialogTitle>
            <DialogDescription>
              Define a new category for student fees.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Tuition Fee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="What is this fee for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingHead ? 'Update' : 'Create'} Head
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
