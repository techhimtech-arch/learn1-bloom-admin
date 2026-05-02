import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataTable, { Column } from '@/components/shared/DataTable';
import { showApiError } from '@/lib/api-toast';
import { admissionApi, studentApi } from '@/pages/services/api';
import { UserPlus, Users, ClipboardList, Eye, CheckCircle, Edit, Loader2 } from 'lucide-react';

import { PartialAdmissionForm } from '@/components/admission/PartialAdmissionForm';
import { FullAdmissionForm } from '@/components/admission/FullAdmissionForm';
import { EditStudentDialog } from '@/components/admission/EditStudentDialog';
import { CompletePartialDialog } from '@/components/admission/CompletePartialDialog';

const getStudentIdFromRecord = (record: any) =>
  record?.studentId?._id || record?.studentId || record?._id || '';

export default function StudentAdmission() {
  const [activeTab, setActiveTab] = useState('partial');

  // Dialog States
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; partialData: any | null }>({ open: false, partialData: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; studentId: string | null; initialData: any | null }>({ open: false, studentId: null, initialData: null });
  
  // Detached Detail View State
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  // Queries
  const { data: partialData, isLoading: partialLoading, refetch: refetchPartial } = useQuery({
    queryKey: ['partial-admissions'],
    queryFn: async () => {
      const res = await admissionApi.getPartial({ limit: 100 });
      return res.data?.data || [];
    },
    enabled: activeTab === 'partial-list',
  });

  const { data: admittedData, isLoading: admittedLoading, refetch: refetchAdmitted } = useQuery({
    queryKey: ['admitted-students'],
    queryFn: async () => {
      const res = await admissionApi.getAll({ limit: 100 });
      return res.data?.data || [];
    },
    enabled: activeTab === 'admitted',
  });

  const partialList = Array.isArray(partialData) ? partialData : [];
  const admittedList = Array.isArray(admittedData) ? admittedData : [];

  // Handlers
  const viewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await admissionApi.getById(id);
      setStudentDetail(res.data?.data?.studentProfile || res.data?.data);
      setDetailDialog(true);
    } catch (err: any) {
      showApiError(err, 'Failed to load student details');
    }
    setDetailLoading(false);
  };

  const openEditStudent = async (row: any) => {
    const studentId = getStudentIdFromRecord(row);
    if (!studentId) {
      showApiError({ response: { data: { message: 'Student ID not found' } } }, '');
      return;
    }
    setEditDialog({ open: true, studentId, initialData: row });
  };

  const partialColumns: Column<any>[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dateOfBirth', label: 'DOB', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'email', label: 'Email', render: (v: string) => v || '-' },
    { key: 'status', label: 'Status', render: (v: string) => <Badge variant="secondary">{v || 'partial'}</Badge> },
  ];

  const admittedColumns: Column<any>[] = [
    { key: 'firstName', label: 'Name', render: (_: any, row: any) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
    { key: 'admissionNumber', label: 'Adm No.', render: (_: any, row: any) => row.admissionNumber || '-' },
    { key: 'email', label: 'Email', render: (_: any, row: any) => row.userId?.email || row.email || '-' },
    { key: 'phone', label: 'Phone', render: (_: any, row: any) => row.phone || '-' },
    { key: 'gender', label: 'Gender' },
    { key: 'bloodGroup', label: 'Blood Group', render: (_: any, row: any) => row.bloodGroup || '-' },
    { key: 'currentEnrollment', label: 'Class', render: (_: any, row: any) => row.currentEnrollment?.classId?.name || '-' },
    { key: 'currentEnrollmentSection', label: 'Section', render: (_: any, row: any) => row.currentEnrollment?.sectionId?.name || '-' },
    { key: 'currentEnrollmentRoll', label: 'Roll No.', render: (_: any, row: any) => row.currentEnrollment?.rollNumber || '-' },
    { key: 'status', label: 'Status', render: (v: string) => (
      <Badge variant={v === 'completed' ? 'default' : 'secondary'}>{v || 'completed'}</Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Admission</h1>
        <p className="text-sm text-muted-foreground">Manage partial and full student admissions using centralized decoupled robust forms.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="partial" className="gap-1.5"><ClipboardList className="h-4 w-4" />Partial Admission</TabsTrigger>
          <TabsTrigger value="full" className="gap-1.5"><UserPlus className="h-4 w-4" />Full Admission</TabsTrigger>
          <TabsTrigger value="partial-list" className="gap-1.5"><ClipboardList className="h-4 w-4" />Partial List</TabsTrigger>
          <TabsTrigger value="admitted" className="gap-1.5"><Users className="h-4 w-4" />Admitted Students</TabsTrigger>
        </TabsList>

        <TabsContent value="partial" className="mt-4">
          <PartialAdmissionForm onSuccess={() => setActiveTab('partial-list')} />
        </TabsContent>

        <TabsContent value="full" className="mt-4">
          <FullAdmissionForm onSuccess={() => setActiveTab('admitted')} />
        </TabsContent>

        <TabsContent value="partial-list" className="mt-4">
          <DataTable
            columns={partialColumns}
            data={partialList}
            loading={partialLoading}
            searchPlaceholder="Search partial admissions..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setCompleteDialog({ open: true, partialData: row })}>
                  <CheckCircle className="h-4 w-4 text-success mr-1" /> Complete
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="admitted" className="mt-4">
          <DataTable
            columns={admittedColumns}
            data={admittedList}
            loading={admittedLoading}
            searchPlaceholder="Search admitted students..."
            actions={(row) => (
              <div className="flex gap-1 items-center">
                <Button size="sm" variant="ghost" onClick={() => openEditStudent(row)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => viewDetail(getStudentIdFromRecord(row))} disabled={detailLoading}>
                  {detailLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
                  View
                </Button>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Decoupled Dialogs */}
      <CompletePartialDialog
        open={completeDialog.open}
        onOpenChange={(v) => setCompleteDialog({ ...completeDialog, open: v })}
        partialStudent={completeDialog.partialData}
        onSuccess={() => { refetchPartial(); refetchAdmitted(); }}
      />

      <EditStudentDialog
        open={editDialog.open}
        onOpenChange={(v) => setEditDialog({ ...editDialog, open: v })}
        studentId={editDialog.studentId}
        initialData={editDialog.initialData}
        onSuccess={() => refetchAdmitted()}
      />

      {/* STUDENT DETAIL DIALOG */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {studentDetail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> {studentDetail.firstName} {studentDetail.lastName}</div>
                <div><span className="text-muted-foreground">Gender:</span> {studentDetail.gender}</div>
                <div><span className="text-muted-foreground">DOB:</span> {studentDetail.dateOfBirth ? new Date(studentDetail.dateOfBirth).toLocaleDateString() : '-'}</div>
                <div><span className="text-muted-foreground">Blood Group:</span> {studentDetail.bloodGroup || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {studentDetail.email || '-'}</div>
                <div><span className="text-muted-foreground">Phone:</span> {studentDetail.phone || '-'}</div>
                <div><span className="text-muted-foreground">Admission No:</span> {studentDetail.admissionNumber || '-'}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={studentDetail.status === 'completed' ? 'default' : 'secondary'}>{studentDetail.status}</Badge></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {studentDetail.address || '-'}</div>
                {studentDetail.currentEnrollment && (
                  <>
                    <div><span className="text-muted-foreground">Class:</span> {studentDetail.currentEnrollment.classId?.name || '-'}</div>
                    <div><span className="text-muted-foreground">Section:</span> {studentDetail.currentEnrollment.sectionId?.name || '-'}</div>
                    <div><span className="text-muted-foreground">Roll No:</span> {studentDetail.currentEnrollment.rollNumber || '-'}</div>
                  </>
                )}
                {studentDetail.parentUserId && (
                  <div className="col-span-2"><span className="text-muted-foreground">Parent:</span> {studentDetail.parentUserId.name || studentDetail.parentUserId.email || '-'}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
