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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { rollNumberApi, sectionApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';
import { Loader2, Users, Hash } from 'lucide-react';

const bulkRollNumberSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  prefix: z.string().optional(),
  startingNumber: z.number().min(1),
  preserveExisting: z.boolean().default(true),
});

type BulkRollNumberFormData = z.infer<typeof bulkRollNumberSchema>;

interface Class {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

interface BulkRollNumberFormProps {
  classes: Class[];
  academicYears: AcademicYear[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkRollNumberForm({ 
  classes, 
  academicYears, 
  onClose, 
  onSuccess 
}: BulkRollNumberFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<BulkRollNumberFormData>({
    resolver: zodResolver(bulkRollNumberSchema),
    defaultValues: {
      academicYearId: '',
      classId: '',
      sectionId: '',
      prefix: '',
      startingNumber: 1,
      preserveExisting: true,
    },
  });

  const selectedClassId = form.watch('classId');

  const { data: sectionsData } = useQuery({
    queryKey: ['sections', 'class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return { data: [] };
      const response = await sectionApi.getByClass(selectedClassId);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    // Set default academic year
    const currentYear = academicYears.find(year => year.isActive);
    if (currentYear) {
      form.setValue('academicYearId', currentYear.id);
    }
  }, [academicYears, form]);

  const bulkAssignMutation = useMutation({
    mutationFn: rollNumberApi.bulkAssign,
    onSuccess: (response) => {
      const assigned = response.data?.assigned || 0;
      const skipped = response.data?.skipped || 0;
      toast.success(`Roll numbers assigned successfully: ${assigned} assigned, ${skipped} skipped`);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign roll numbers';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        toast.error(`${message}: ${errors.length} errors occurred`);
      } else {
        toast.error(message);
      }
    },
  });

  const onSubmit = (data: BulkRollNumberFormData) => {
    bulkAssignMutation.mutate(data);
  };

  const isLoading = bulkAssignMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const filteredSections = sectionsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Roll Number Assignment
          </DialogTitle>
          <DialogDescription>
            Assign roll numbers to multiple students at once. You can specify a prefix and starting number.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name} {year.isActive && '(Current)'}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
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

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSections.map((section: any) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number Prefix</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2024-CLASS10-"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-sm text-muted-foreground">
                      Optional prefix to add before each roll number
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-sm text-muted-foreground">
                      The number to start assigning from
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preserveExisting"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Preserve Existing Roll Numbers</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Skip students who already have roll numbers assigned
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Preview
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Format: {form.watch('prefix') || '[No Prefix]'}[Sequential Number]</div>
                <div>Starting from: {form.watch('prefix') || ''}{form.watch('startingNumber')}</div>
                <div>Example: {form.watch('prefix') || ''}{form.watch('startingNumber')}, {form.watch('prefix') || ''}{form.watch('startingNumber') + 1}, {form.watch('prefix') || ''}{form.watch('startingNumber') + 2}...</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Roll Numbers
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
