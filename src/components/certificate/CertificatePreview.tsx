import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Calendar,
  User,
  Award,
  School,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { certificateApi } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

interface CertificatePreviewProps {
  certificate: Certificate;
  onClose: () => void;
}

export function CertificatePreview({ certificate, onClose }: CertificatePreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const {
    data: certificateDetails,
    isLoading: detailsLoading,
  } = useQuery({
    queryKey: ['certificate', certificate.id],
    queryFn: async () => {
      const response = await certificateApi.getById(certificate.id);
      return response.data;
    },
    enabled: !!certificate.id,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Simulate download - in real implementation, this would download the PDF
      toast.success('Certificate downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download certificate');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Simulate print - in real implementation, this would trigger print dialog
      window.print();
      toast.success('Print dialog opened');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to print certificate');
    } finally {
      setIsPrinting(false);
    }
  };

  const getCertificateTitle = (type: string) => {
    const titles: Record<string, string> = {
      'bonafide': 'Bonafide Certificate',
      'transfer': 'Transfer Certificate',
      'character': 'Character Certificate',
      'conduct': 'Conduct Certificate',
      'completion': 'Course Completion Certificate',
      'achievement': 'Achievement Certificate',
      'participation': 'Participation Certificate',
    };
    return titles[type] || 'Certificate';
  };

  const getCertificateColor = (type: string) => {
    const colors: Record<string, string> = {
      'bonafede': 'border-blue-500 bg-blue-50',
      'transfer': 'border-red-500 bg-red-50',
      'character': 'border-green-500 bg-green-50',
      'conduct': 'border-purple-500 bg-purple-50',
      'completion': 'border-yellow-500 bg-yellow-50',
      'achievement': 'border-orange-500 bg-orange-50',
      'participation': 'border-pink-500 bg-pink-50',
    };
    return colors[type] || 'border-gray-500 bg-gray-50';
  };

  const details = certificateDetails?.data;

  if (detailsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-primary mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-primary mr-2" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Certificate Content */}
          <div className={`border-4 ${getCertificateColor(certificate.certificateType)} rounded-lg p-8 bg-white`}>
            {/* Certificate Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <School className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                {getCertificateTitle(certificate.certificateType)}
              </h1>
              <div className="w-32 h-1 bg-primary mx-auto rounded"></div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-6 mb-8">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  This is to certify that
                </p>
                <h2 className="text-2xl font-bold text-primary mb-2">
                  {certificate.student?.name}
                </h2>
                <p className="text-muted-foreground">
                  Roll Number: {certificate.student?.rollNumber}
                </p>
                <p className="text-muted-foreground">
                  Class: {certificate.student?.class?.name} - Section: {certificate.student?.section?.name}
                </p>
              </div>

              {/* Certificate Content based on type */}
              <div className="bg-muted/30 p-6 rounded-lg">
                {certificate.certificateType === 'bonafide' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      is a bonafide student of this institution for the academic year.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date of Admission:</span>
                        <p>{details?.admissionDate ? format(new Date(details.admissionDate), 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Academic Year:</span>
                        <p>{details?.academicYear || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'transfer' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has studied in this institution and is eligible for transfer.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date of Joining:</span>
                        <p>{details?.joiningDate ? format(new Date(details.joiningDate), 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Date of Attendance:</span>
                        <p>{details?.lastDate ? format(new Date(details.lastDate), 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'character' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has demonstrated good conduct and character during their time at this institution.
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">Behavior:</span>
                      <p>{details?.behavior || 'Excellent'}</p>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'conduct' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has maintained satisfactory conduct throughout their academic career.
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">Conduct Rating:</span>
                      <p>{details?.conductRating || 'Satisfactory'}</p>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'completion' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has successfully completed the required course of study.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Course:</span>
                        <p>{details?.course || 'General Education'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Completion Date:</span>
                        <p>{details?.completionDate ? format(new Date(details.completionDate), 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'achievement' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has shown outstanding achievement in the following area:
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">Achievement:</span>
                      <p>{details?.achievement || 'Academic Excellence'}</p>
                    </div>
                  </div>
                )}

                {certificate.certificateType === 'participation' && (
                  <div className="space-y-4">
                    <p className="text-center">
                      has actively participated in the following event/activity:
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">Event:</span>
                      <p>{details?.event || 'School Event'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Remarks */}
              {details?.remarks && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "{details.remarks}"
                  </p>
                </div>
              )}
            </div>

            {/* Certificate Footer */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="h-px bg-gray-400 mb-2"></div>
                  <p className="text-sm font-medium">Principal Signature</p>
                </div>
                <div>
                  <div className="h-px bg-gray-400 mb-2"></div>
                  <p className="text-sm font-medium">Class Teacher</p>
                </div>
                <div>
                  <div className="h-px bg-gray-400 mb-2"></div>
                  <p className="text-sm font-medium">School Seal</p>
                </div>
              </div>
            </div>

            {/* Certificate Metadata */}
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">Certificate Number:</span> {certificate.certificateNumber}
                </div>
                <div>
                  <span className="font-medium">Issue Date:</span> {format(new Date(certificate.issueDate), 'dd MMM yyyy')}
                </div>
                <div>
                  <span className="font-medium">Generated By:</span> {certificate.generatedBy}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-white mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-l-2 border-primary mr-2" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Certificate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
