import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Layers,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { feeApi, classApi, academicYearApi, feeHeadApi } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface BulkFeeRow {
  feeName: string;
  feeType: string;
  amount: number;
  dueDate: string;
}

export default function BulkFeeStructure() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [fees, setFees] = useState<BulkFeeRow[]>([
    { feeName: '', feeType: 'tuition', amount: 0, dueDate: new Date().toISOString() }
  ]);

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await academicYearApi.getAll({ isActive: true });
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

  const { data: headsData } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: async () => {
      const response = await feeHeadApi.getAll();
      return response.data;
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (data: any) => feeApi.bulkCreateStructure(data),
    onSuccess: () => {
      toast.success('Bulk fee structure created successfully');
      queryClient.invalidateQueries({ queryKey: ['fee-structure'] });
      navigate('/fees/structure');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create bulk fee structure');
    },
  });

  const handleAddRow = () => {
    setFees([...fees, { feeName: '', feeType: 'tuition', amount: 0, dueDate: new Date().toISOString() }]);
  };

  const handleRemoveRow = (index: number) => {
    if (fees.length > 1) {
      setFees(fees.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index: number, field: keyof BulkFeeRow, value: any) => {
    const newFees = [...fees];
    if (field === 'feeName' && headsData?.data) {
      // If feeName is selected from a head, auto-set the feeType
      const head = headsData.data.find((h: any) => h.name === value);
      if (head) {
        newFees[index].feeType = head.feeType;
      }
    }
    newFees[index] = { ...newFees[index], [field]: value };
    setFees(newFees);
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) 
        : [...prev, classId]
    );
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === (classesData?.data?.length || 0)) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classesData?.data?.map((c: any) => c._id || c.id) || []);
    }
  };

  const handleSubmit = () => {
    if (!selectedYearId) {
      toast.error('Please select an academic year');
      return;
    }
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (fees.some(f => !f.feeName || f.amount <= 0)) {
      toast.error('Please fill all fee details correctly');
      return;
    }

    bulkCreateMutation.mutate({
      academicYearId: selectedYearId,
      classIds: selectedClassIds,
      fees: fees
    });
  };

  const years = yearsData?.data || [];
  const classes = classesData?.data || [];
  const heads = headsData?.data || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/fees/structure')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Fee Creation</h1>
            <p className="text-muted-foreground">Define fees for multiple classes at once.</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={bulkCreateMutation.isPending}
          className="gap-2 px-8"
        >
          {bulkCreateMutation.isPending ? 'Processing...' : 'Create Structure'}
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Selection */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">1. Academic Year & Classes</CardTitle>
            <CardDescription>Select target session and classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y: any) => (
                    <SelectItem key={y._id} value={y._id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Target Classes</Label>
                <Button variant="ghost" size="sm" onClick={handleSelectAllClasses} className="text-xs h-7">
                  {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[300px] overflow-y-auto bg-muted/20">
                {classes.map((c: any) => (
                  <div key={c._id || c.id} className="flex items-center space-x-2 p-1">
                    <Checkbox 
                      id={`class-${c._id || c.id}`} 
                      checked={selectedClassIds.includes(c._id || c.id)}
                      onCheckedChange={() => toggleClass(c._id || c.id)}
                    />
                    <label 
                      htmlFor={`class-${c._id || c.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-0"
                    >
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedClassIds.length > 0 && (
                <p className="text-xs text-primary font-medium">
                  {selectedClassIds.length} classes selected.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Fee Definition */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">2. Fee Details</CardTitle>
                <CardDescription>List all fee items to apply to selected classes.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddRow} className="gap-1 border-dashed">
                <Plus className="h-4 w-4" />
                Add Fee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground px-2">
                <div className="col-span-4">FEE NAME / HEAD</div>
                <div className="col-span-3">TYPE</div>
                <div className="col-span-2">AMOUNT</div>
                <div className="col-span-2">DUE DATE</div>
                <div className="col-span-1"></div>
              </div>

              {fees.map((fee, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-muted/10 p-2 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all">
                  <div className="col-span-4">
                    <Select 
                      value={fee.feeName} 
                      onValueChange={(val) => handleRowChange(index, 'feeName', val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Head" />
                      </SelectTrigger>
                      <SelectContent>
                        {heads.map((h: any) => (
                          <SelectItem key={h._id} value={h.name}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={fee.feeType} 
                      disabled 
                      className="h-9 bg-muted/50 capitalize" 
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-muted-foreground text-sm">₹</span>
                      <Input 
                        type="number" 
                        className="pl-5 h-9" 
                        value={fee.amount} 
                        onChange={(e) => handleRowChange(index, 'amount', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal px-2 text-xs",
                            !fee.dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {fee.dueDate ? format(new Date(fee.dueDate), "dd/MM/yy") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(fee.dueDate)}
                          onSelect={(date) => handleRowChange(index, 'dueDate', date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                      onClick={() => handleRemoveRow(index)}
                      disabled={fees.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20 flex gap-4">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-primary">Summary</p>
                <p className="text-muted-foreground">
                  You are about to create <span className="font-bold text-foreground">{fees.length}</span> fee items 
                  for <span className="font-bold text-foreground">{selectedClassIds.length}</span> classes. 
                  Total structures to be generated: <span className="font-bold text-foreground">{fees.length * selectedClassIds.length}</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
