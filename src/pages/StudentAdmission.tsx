import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DataTable, { Column } from '@/components/shared/DataTable';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { admissionApi } from '@/services/api';
import { UserPlus, Check, X } from 'lucide-react';

interface PendingAdmission {
  id: string;
  firstName: string;
  lastName: string;
  class: string;
  fatherName: string;
  status: string;
  appliedDate: string;
}

const mockPending: PendingAdmission[] = [
  { id: '1', firstName: 'Aarav', lastName: 'Patel', class: 'Class 10-A', fatherName: 'Rajesh Patel', status: 'pending', appliedDate: '2024-03-10' },
  { id: '2', firstName: 'Ananya', lastName: 'Singh', class: 'Class 8-B', fatherName: 'Vikram Singh', status: 'pending', appliedDate: '2024-03-09' },
  { id: '3', firstName: 'Rohan', lastName: 'Kumar', class: 'Class 6-C', fatherName: 'Suresh Kumar', status: 'pending', appliedDate: '2024-03-08' },
];

const StudentAdmission = () => {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAdmission[]>(mockPending);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '',
    fatherName: '', fatherPhone: '', motherName: '', motherPhone: '',
    classId: '', previousSchool: '',
    street: '', city: '', state: '', pinCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await admissionApi.create(form as any);
      showApiSuccess(res, 'Student admission submitted successfully.');
      setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', classId: '', previousSchool: '', street: '', city: '', state: '', pinCode: '' });
    } catch (err: any) {
      showApiError(err, 'Failed to submit admission');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (row: PendingAdmission) => {
    try {
      const res = await admissionApi.approve(row.id);
      showApiSuccess(res, `${row.firstName} ${row.lastName} has been approved.`);
      setPending(pending.filter(p => p.id !== row.id));
    } catch (err: any) {
      showApiError(err, 'Failed to approve admission');
    }
  };

  const pendingColumns: Column<PendingAdmission>[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'class', label: 'Class' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'appliedDate', label: 'Applied Date' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <Badge variant={val === 'pending' ? 'secondary' : 'default'}>{val}</Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Admission</h1>
          <p className="text-sm text-muted-foreground">Manage student admissions and enrollment</p>
        </div>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">New Admission</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                Admission Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Personal Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>First Name <span className="text-destructive">*</span></Label>
                      <Input name="firstName" value={form.firstName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name <span className="text-destructive">*</span></Label>
                      <Input name="lastName" value={form.lastName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth <span className="text-destructive">*</span></Label>
                      <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select name="gender" value={form.gender} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Blood Group</Label>
                      <Input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} placeholder="e.g. O+" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Parent / Guardian Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Father's Name <span className="text-destructive">*</span></Label>
                      <Input name="fatherName" value={form.fatherName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Father's Phone</Label>
                      <Input name="fatherPhone" type="tel" value={form.fatherPhone} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Name</Label>
                      <Input name="motherName" value={form.motherName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Phone</Label>
                      <Input name="motherPhone" type="tel" value={form.motherPhone} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Academic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Class <span className="text-destructive">*</span></Label>
                      <select name="classId" value={form.classId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="">Select Class</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={`class-${i + 1}`}>Class {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Previous School</Label>
                      <Input name="previousSchool" value={form.previousSchool} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Address</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Street Address</Label>
                      <Input name="street" value={form.street} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input name="city" value={form.city} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input name="pinCode" value={form.pinCode} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Admission'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', classId: '', previousSchool: '', street: '', city: '', state: '', pinCode: '' })}>
                    Clear Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <DataTable
            columns={pendingColumns}
            data={pending}
            searchPlaceholder="Search pending admissions..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-success" onClick={() => handleApprove(row)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                  setPending(pending.filter(p => p.id !== row.id));
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentAdmission;
