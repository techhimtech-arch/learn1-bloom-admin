import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { feeApi, classApi, sectionApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const feeStructureSchema = z.object({
  feeHead: z.string().min(1, 'Fee head is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time']),
  isMandatory: z.boolean(),
  applicableTo: z.enum(['all', 'class', 'section']),
  applicableIds: z.array(z.string()).optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.applicableTo !== 'all' && (!data.applicableIds || data.applicableIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Please select at least one target',
  path: ['applicableIds'],
});

type FeeStructureFormData = z.infer<typeof feeStructureSchema>;

interface FeeStructure {
  id: string;
  feeHead: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time';
  isMandatory: boolean;
  applicableTo: 'all' | 'class' | 'section';
  applicableIds?: string[];
  description?: string;
}

interface FeeStructureFormProps {
  fee?: FeeStructure | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeeStructureForm({ fee, onClose, onSuccess }: FeeStructureFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      feeHead: '',
      amount: 0,
      frequency: 'monthly',
      isMandatory: true,
      applicableTo: 'all',
      applicableIds: [],
      description: '',
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data;
    },
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await sectionApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FeeStructureFormData) => feeApi.createStructure(data),
    onSuccess: () => {
      toast.success('Fee structure created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create fee structure');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FeeStructureFormData) => feeApi.updateStructure({ ...data, id: fee!.id }),
    onSuccess: () => {
      toast.success('Fee structure updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee structure');
    },
  });

  useEffect(() => {
    if (fee) {
      form.reset({
        feeHead: fee.feeHead,
        amount: fee.amount,
        frequency: fee.frequency,
        isMandatory: fee.isMandatory,
        applicableTo: fee.applicableTo,
        applicableIds: fee.applicableIds || [],
        description: fee.description || '',
      });
    }
  }, [fee, form]);

  const onSubmit = (data: FeeStructureFormData) => {
    if (fee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fee ? 'Edit Fee Head' : 'New Fee Head'}
          </DialogTitle>
          <DialogDescription>
            {fee 
              ? 'Update fee structure details below.'
              : 'Create a new fee head for the school fee structure.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="feeHead"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Head *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter fee head name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicableTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable To *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Clear applicable IDs when applicableTo changes
                      form.setValue('applicableIds', []);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select applicable to" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="class">Specific Classes</SelectItem>
                        <SelectItem value="section">Specific Sections</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isMandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mandatory Fee</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This fee is required for all applicable students
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('applicableTo') !== 'all' && (
              <FormField
                control={form.control}
                name="applicableIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Targets *</FormLabel>
                    <FormControl>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                        {form.watch('applicableTo') === 'class' && classes.map((cls: any) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={field.value?.includes(cls.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, cls.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== cls.id));
                                }
                              }}
                            />
                            <label htmlFor={`class-${cls.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {cls.name}
                            </label>
                          </div>
                        ))}
                        
                        {form.watch('applicableTo') === 'section' && sections.map((section: any) => (
                          <div key={section.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`section-${section.id}`}
                              checked={field.value?.includes(section.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, section.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== section.id));
                                }
                              }}
                            />
                            <label htmlFor={`section-${section.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {section.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter fee description (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {fee ? 'Update Fee Head' : 'Create Fee Head'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
