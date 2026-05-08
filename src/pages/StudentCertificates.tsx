import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Download,
  Eye,
  FileText,
  Lock,
  CheckCircle,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { studentPortalApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Certificate {
  _id: string;
  studentId: string;
  certificateType: string;
  title: string;
  issuedDate: string;
  expiryDate?: string;
  certificateNumber: string;
  downloadUrl?: string;
  status: 'issued' | 'pending' | 'expired';
  description?: string;
}

const StudentCertificates = () => {
  const { user } = useAuth();
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

  const {
    data: certificates,
    isLoading,
    error,
  } = useQuery<Certificate[]>({
    queryKey: ['student-certificates'],
    queryFn: async () => {
      try {
        const response = await studentPortalApi.getCertificates();
        return response.data?.data || [];
      } catch (err) {
        console.error('Failed to fetch certificates:', err);
        return [];
      }
    },
  });

  const handleDownload = (certificate: Certificate) => {
    if (certificate.downloadUrl) {
      window.open(certificate.downloadUrl, '_blank');
    } else {
      // Generate mock download
      alert(`Downloading certificate: ${certificate.title}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const issuedCertificates = certificates?.filter(
    (c) => c.status === 'issued'
  ) || [];
  const pendingCertificates = certificates?.filter(
    (c) => c.status === 'pending'
  ) || [];
  const expiredCertificates = certificates?.filter(
    (c) => c.status === 'expired'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download and manage your certificates
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {issuedCertificates.length}
              </span>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-yellow-600">
                {pendingCertificates.length}
              </span>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">
                {expiredCertificates.length}
              </span>
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issued Certificates */}
      {issuedCertificates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Issued Certificates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issuedCertificates.map((cert) => (
              <Card key={cert._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{cert.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cert.certificateType}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        Cert #
                      </span>
                      <span className="text-xs font-mono font-semibold">
                        {cert.certificateNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        Issued
                      </span>
                      <span className="text-xs font-semibold">
                        {format(new Date(cert.issuedDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                    {cert.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Expiry
                        </span>
                        <span className="text-xs font-semibold">
                          {format(new Date(cert.expiryDate), 'dd MMM yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(cert.status)}>
                    {cert.status.charAt(0).toUpperCase() +
                      cert.status.slice(1)}
                  </Badge>
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => setSelectedCertificate(cert)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{cert.title}</DialogTitle>
                          <DialogDescription>
                            Certificate Preview
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-6 text-center space-y-4 min-h-96 flex flex-col items-center justify-center">
                            <Award className="h-12 w-12 text-yellow-600 mx-auto" />
                            <h3 className="text-lg font-bold">{cert.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {cert.description}
                            </p>
                            <div className="text-sm space-y-1 mt-4">
                              <p>
                                <strong>Certificate #:</strong>{' '}
                                {cert.certificateNumber}
                              </p>
                              <p>
                                <strong>Issued Date:</strong>{' '}
                                {format(new Date(cert.issuedDate), 'dd MMM yyyy')}
                              </p>
                              {cert.expiryDate && (
                                <p>
                                  <strong>Expiry Date:</strong>{' '}
                                  {format(
                                    new Date(cert.expiryDate),
                                    'dd MMM yyyy'
                                  )}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                              Issued to: {user?.name}
                            </p>
                          </div>
                          <Button
                            className="w-full gap-2"
                            onClick={() => handleDownload(cert)}
                          >
                            <Download className="h-4 w-4" />
                            Download Certificate
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Certificates */}
      {pendingCertificates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Pending Certificates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingCertificates.map((cert) => (
              <Card
                key={cert._id}
                className="opacity-75 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{cert.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cert.certificateType}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge className={getStatusColor(cert.status)}>
                    Pending
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Your certificate is being processed. You'll be able to
                    download it soon.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert className="border-red-200 bg-red-50">
          <Alert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load certificates. Please try again later.
          </AlertDescription>
        </Alert>
      ) : !certificates || certificates.length === 0 ? (
        <Card className="text-center py-12">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't earned any certificates yet. Continue your studies and
            check back later.
          </p>
        </Card>
      ) : null}
    </div>
  );
};

export default StudentCertificates;
