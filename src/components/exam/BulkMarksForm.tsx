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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { examApi } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';

const bulkMarksSchema = z.object({
  marks: z.array(z.object({
    markId: z.string().optional(),
    studentId: z.string(),
    marksObtained: z.number().min(0),
    remarks: z.string().optional(),
  })).min(1, 'At least one mark entry is required'),
});

type BulkMarksFormData = z.infer<typeof bulkMarksSchema>;

interface MarkEntry {
  id: string;
  examId: string;
  studentId: string;
  subjectPaperId: string;
  marksObtained: number;
  remarks?: string;
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  subjectPaper?: {
    id: string;
    subject: {
      name: string;
      code: string;
    };
    maxMarks: number;
    passingMarks: number;
  };
}

interface Exam {
  id: string;
  name: string;
  examType: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: string;
  isMarksLocked: boolean;
}

interface BulkMarksFormProps {
  exam: Exam;
  marks: MarkEntry[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkMarksForm({ exam, marks, onClose, onSuccess }: BulkMarksFormProps) {
  const [open, setOpen] = useState(true);
  const [csvData, setCsvData] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<BulkMarksFormData>({
    resolver: zodResolver(bulkMarksSchema),
    defaultValues: {
      marks: [],
    },
  });

  useEffect(() => {
    // Pre-populate form with existing marks
    const existingMarks = marks.map(mark => ({
      markId: mark.id,
      studentId: mark.studentId,
      marksObtained: mark.marksObtained,
      remarks: mark.remarks || '',
    }));
    form.setValue('marks', existingMarks);
  }, [marks, form]);

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkMarksFormData) => examApi.createMarks(exam.id, data),
    onSuccess: () => {
      toast.success('Marks updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update marks';
      if (error.response?.data?.validation) {
        setValidationErrors(error.response.data.errors || [message]);
      } else {
        toast.error(message);
      }
    },
  });

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string) => {
    try {
      const lines = text.trim().split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
      
      const parsedMarks = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const markData: any = {};
        
        headers.forEach((header, headerIndex) => {
          markData[header] = values[headerIndex] || '';
        });

        // Find the corresponding student
        const student = marks.find(m => 
          m.student?.rollNumber === markData['roll number'] || 
          m.student?.name.toLowerCase() === markData['student name']?.toLowerCase()
        );

        if (student) {
          return {
            markId: student.id,
            studentId: student.studentId,
            marksObtained: parseInt(markData['marks obtained']) || 0,
            remarks: markData['remarks'] || '',
          };
        }
        
        return null;
      }).filter(Boolean);

      form.setValue('marks', parsedMarks);
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors(['Invalid CSV format. Please check your file.']);
    }
  };

  const handleManualEntry = () => {
    const currentMarks = form.getValues('marks');
    const validMarks = currentMarks.filter(mark => {
      const student = marks.find(m => m.studentId === mark.studentId);
      return student && mark.marksObtained >= 0;
    });

    if (validMarks.length === 0) {
      setValidationErrors(['Please enter at least one valid mark entry.']);
      return;
    }

    setValidationErrors([]);
    bulkUpdateMutation.mutate({ marks: validMarks });
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Roll Number,Student Name,Marks Obtained,Remarks',
      ...marks.map(mark => 
        `${mark.student?.rollNumber || ''},${mark.student?.name || ''},,`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-template-${exam.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLoading = bulkUpdateMutation.isPending;

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Marks Entry</DialogTitle>
          <DialogDescription>
            Upload a CSV file or enter marks manually for multiple students at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Validation Errors</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSV Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Upload CSV File</h3>
              <Button variant="outline" onClick={downloadTemplate}>
                <Upload className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              Upload a CSV file with columns: Roll Number, Student Name, Marks Obtained, Remarks
            </div>
            
            <textarea
              className="w-full h-32 p-3 border rounded-md font-mono text-sm"
              placeholder="Paste CSV data here or upload a file..."
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                if (e.target.value) {
                  parseCsvData(e.target.value);
                }
              }}
            />
            
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="mt-2"
            />
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Manual Entry</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Or enter marks manually below. Current entries: {form.watch('marks')?.length || 0}
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-sm font-medium">Student</th>
                    <th className="p-2 text-left text-sm font-medium">Roll No</th>
                    <th className="p-2 text-left text-sm font-medium">Marks</th>
                    <th className="p-2 text-left text-sm font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {form.watch('marks')?.map((mark, index) => {
                    const student = marks.find(m => m.studentId === mark.studentId);
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{student?.student?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{student?.student?.rollNumber || '-'}</div>
                        </td>
                        <td className="p-2 text-sm">{student?.student?.rollNumber || '-'}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={mark.marksObtained}
                            onChange={(e) => {
                              const newMarks = [...form.getValues('marks')];
                              newMarks[index] = { ...mark, marksObtained: parseInt(e.target.value) || 0 };
                              form.setValue('marks', newMarks);
                            }}
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            value={mark.remarks || ''}
                            onChange={(e) => {
                              const newMarks = [...form.getValues('marks')];
                              newMarks[index] = { ...mark, remarks: e.target.value };
                              form.setValue('marks', newMarks);
                            }}
                            placeholder="Optional remarks..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleManualEntry} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update All Marks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
