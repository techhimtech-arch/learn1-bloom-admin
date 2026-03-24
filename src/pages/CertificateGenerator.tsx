import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  Trash2, 
  Calendar,
  Award,
  GraduationCap,
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
import { CertificateForm } from '@/components/certificate/CertificateForm';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';
import { certificateApi, studentApi, classApi } from '@/services/api';
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
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Certificate {
  id: string;
  studentId: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string;
  generatedBy: string;
  status: 'generated' | 'downloaded' | 'printed';
  student?: {
    id: string;
    name: string;
    rollNumber: string;
    class?: {
      name: string;
    };
    section?: {
      name: string;
    };
  };
}

interface CertificateFilters {
  search: string;
  certificateType: string;
  status: string;
  classId: string;
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

export default function CertificateGenerator() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CertificateFilters>({
    search: '',
    certificateType: '',
    status: '',
    classId: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [deletingCertificate, setDeletingCertificate] = useState<Certificate | null>(null);

  const queryClient = useQueryClient();

  const {
    data: certificatesData,
    isLoading: certificatesLoading,
    refetch,
  } = useQuery({
    queryKey: ['certificates', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.certificateType) params.append('certificateType', filters.certificateType);
      if (filters.status) params.append('status', filters.status);
      if (filters.classId) params.append('classId', filters.classId);

      const response = await certificateApi.getAll(Object.fromEntries(params));
      return response.data;
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await studentApi.getAll();
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificateApi.delete(id),
    onSuccess: () => {
      toast.success('Certificate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setDeletingCertificate(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete certificate');
    },
  });

  const handleView = (certificate: Certificate) => {
    setViewingCertificate(certificate);
  };

  const handleDelete = (certificate: Certificate) => {
    setDeletingCertificate(certificate);
  };

  const confirmDelete = () => {
    if (deletingCertificate) {
      deleteMutation.mutate(deletingCertificate.id);
    }
  };

  const certificates = certificatesData?.data || [];
  const students = studentsData?.data || [];
  const classes = classesData?.data || [];

  const getCertificateTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'bonafide': 'bg-blue-100 text-blue-800',
      'transfer': 'bg-red-100 text-red-800',
      'character': 'bg-green-100 text-green-800',
      'conduct': 'bg-purple-100 text-purple-800',
      'completion': 'bg-yellow-100 text-yellow-800',
      'achievement': 'bg-orange-100 text-orange-800',
      'participation': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'generated': 'bg-blue-100 text-blue-800',
      'downloaded': 'bg-green-100 text-green-800',
      'printed': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Generator</h1>
          <p className="text-muted-foreground">
            Generate and manage student certificates
          </p>
        </div>
        <PermissionGuard permission="generate_certificate">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Generate Certificate
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
              placeholder="Search students..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />

            <Select value={filters.certificateType} onValueChange={(value) => setFilters(prev => ({ ...prev, certificateType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Certificate Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="downloaded">Downloaded</SelectItem>
                <SelectItem value="printed">Printed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={`class-${cls.id || cls._id}`} value={cls.id || cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificates ({certificates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificatesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No certificates found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.certificateType || filters.status || filters.classId
                  ? 'Try adjusting your filters'
                  : 'Get started by generating your first certificate'}
              </p>
              <PermissionGuard permission="generate_certificate">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Certificate
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Certificate Type</TableHead>
                    <TableHead>Certificate Number</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate: Certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{certificate.student?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">
                            {certificate.student?.rollNumber || '-'} - {certificate.student?.class?.name || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCertificateTypeColor(certificate.certificateType)}>
                          {certificateTypes.find(t => t.value === certificate.certificateType)?.label || certificate.certificateType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{certificate.certificateNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{certificate.generatedBy}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(certificate.status)}>
                          {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(certificate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <PermissionGuard permission="delete_certificate">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(certificate)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the certificate for "{certificate.student?.name}"? This action cannot be undone.
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

      {/* Certificate Form Modal */}
      {showForm && (
        <CertificateForm
          students={students}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetch();
            setShowForm(false);
          }}
        />
      )}

      {/* Certificate Preview Modal */}
      {viewingCertificate && (
        <CertificatePreview
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}
    </div>
  );
}
