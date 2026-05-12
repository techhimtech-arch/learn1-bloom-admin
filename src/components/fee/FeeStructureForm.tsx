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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { feeApi, classApi, academicYearApi } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useConfig } from '@/contexts/ConfigContext';

const feeStructureSchema = z.object({
  academicYearId: z.string().min(1, 'Academic Year is required'),
  classId: z.string().min(1, 'Class is required'),
  feeType: z.enum(['tuition', 'transport', 'admission', 'exam', 'library', 'laboratory', 'sports', 'other']),
  feeName: z.string().min(1, 'Fee name is required'),
  amount: z.number().min(0, 'Amount must be at least 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  applicableTo: z.enum(['all', 'specific']).default('all'),
  description: z.string().optional(),
  lateFee: z.number().min(0).optional().default(0),
  concessionPercentage: z.number().min(0).max(100).optional().default(0),
});

type FeeStructureFormData = z.infer<typeof feeStructureSchema>;

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
}

interface FeeStructureFormProps {
  fee?: FeeStructure | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeeStructureForm({ fee, onClose, onSuccess }: FeeStructureFormProps) {
  const [open, setOpen] = useState(true);
  const { selectedYearId } = useConfig();

  const form = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      academicYearId: '',
      classId: '',
      feeType: 'tuition',
      feeName: '',
      amount: 0,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      applicableTo: 'all',
      description: '',
      lateFee: 0,
      concessionPercentage: 0,
    },
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll();
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
    mutationFn: (data: FeeStructureFormData) => feeApi.updateStructure({ ...data, id: fee!.id || (fee as any)._id }),
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
        academicYearId: fee.academicYearId,
        classId: fee.classId,
        feeType: fee.feeType as any,
        feeName: fee.feeName,
        amount: fee.amount,
        dueDate: fee.dueDate ? format(new Date(fee.dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        applicableTo: fee.applicableTo,
        description: fee.description || '',
        lateFee: fee.lateFee || 0,
        concessionPercentage: fee.concessionPercentage || 0,
      });
    } else if (selectedYearId) {
      form.setValue('academicYearId', selectedYearId);
    }
  }, [fee, form, selectedYearId]);

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

  const academicYears = (academicYearsData?.data || []).filter((y: any) => y.isActive);
  const classes = classesData?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fee ? 'Edit Fee Structure' : 'New Fee Structure'}
          </DialogTitle>
          <DialogDescription>
            {fee 
              ? 'Update fee structure details below.'
              : 'Create a new fee structure for a class and academic year.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year._id || year.id} value={year._id || year.id}>
                            {year.name} {year.isCurrent && '(Current)'}
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
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="feeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="library">Library</SelectItem>
                        <SelectItem value="laboratory">Laboratory</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Monthly Tuition Fee"
                        {...field}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="applicableTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Application" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="specific">Specific Students</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lateFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late Fee (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="concessionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concession Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {fee ? 'Update Fee Structure' : 'Create Fee Structure'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
