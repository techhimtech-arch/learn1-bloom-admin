import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { certificateApi } from '@/pages/services/api';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

const certificateSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  certificateType: z.string().min(1, 'Certificate type is required'),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface CertificateFormProps {
  students: Student[];
  onClose: () => void;
  onSuccess: () => void;
}

const certificateTypes = [
  { value: 'bonafide', label: 'Bonafide Certificate' },
  { value: 'transfer', label: 'Transfer Certificate' },
  { value: 'character', label: 'Character Certificate' },
  { value: 'conduct', label: 'Conduct Certificate' },
  { value: 'completion', label: 'Course Completion Certificate' },
  { value: 'achievement', label: 'Achievement Certificate' },
  { value: 'participation', label: 'Participation Certificate' },
];

const certificatePurposes: Record<string, string[]> = {
  bonafide: [
    'For Bank Account Opening',
    'For Scholarship Application',
    'For Visa Processing',
    'For Address Proof',
    'Other',
  ],
  transfer: [
    'School Transfer',
    'Relocation',
    'Academic Reasons',
    'Other',
  ],
  character: [
    'For Employment',
    'For Higher Studies',
    'For Immigration',
    'Other',
  ],
  conduct: [
    'For Academic Records',
    'For Personal Records',
    'Other',
  ],
  completion: [
    'Course Completion',
    'Academic Records',
    'Other',
  ],
  achievement: [
    'Sports Achievement',
    'Academic Excellence',
    'Cultural Activities',
    'Other',
  ],
  participation: [
    'Sports Event',
    'Competition',
    'Cultural Program',
    'Other',
  ],
};

export function CertificateForm({ students, onClose, onSuccess }: CertificateFormProps) {
  const [open, setOpen] = useState(true);

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      studentId: '',
      certificateType: '',
      purpose: '',
      remarks: '',
    },
  });

  const selectedCertificateType = form.watch('certificateType');

  const generateMutation = useMutation({
    mutationFn: (data: CertificateFormData) => certificateApi.generate(data),
    onSuccess: () => {
      toast.success('Certificate generated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate certificate');
    },
  });

  const onSubmit = (data: CertificateFormData) => {
    generateMutation.mutate(data);
  };

  const isLoading = generateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const handleCertificateTypeChange = (value: string) => {
    form.setValue('certificateType', value);
    form.setValue('purpose', ''); // Reset purpose when certificate type changes
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Certificate
            </div>
          </DialogTitle>
          <DialogDescription>
            Select a student and certificate type to generate a new certificate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{student.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {student.rollNumber} - {student.class?.name}
                            </span>
                          </div>
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
              name="certificateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Type *</FormLabel>
                  <Select onValueChange={handleCertificateTypeChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {certificateTypes.map((type) => (
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

            {selectedCertificateType && certificatePurposes[selectedCertificateType] && (
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {certificatePurposes[selectedCertificateType].map((purpose) => (
                          <SelectItem key={purpose} value={purpose}>
                            {purpose}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional remarks or special instructions (optional)"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certificate Preview Info */}
            {selectedCertificateType && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Certificate Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-medium">
                      {certificateTypes.find(t => t.value === selectedCertificateType)?.label}
                    </span>
                  </div>
                  {form.watch('studentId') && (
                    <div>
                      <span className="text-muted-foreground">Student: </span>
                      <span className="font-medium">
                        {students.find(s => s.id === form.watch('studentId'))?.name}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Certificate Number: </span>
                    <span className="font-mono text-xs">Will be generated automatically</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Certificate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
