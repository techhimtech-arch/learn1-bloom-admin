import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  FileCheck, 
  UsersRound, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Award,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { feeApi, certificateApi, parentApi } from '@/pages/services/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Certificate {
  id: string;
  studentId: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string;
  generatedBy: string;
  status: string;
  student?: {
    id: string;
    name: string;
  };
}

interface FeeSummary {
  totalFees: number;
  totalCollected: number;
  totalDue: number;
  totalOverdue: number;
  collectionRate: number;
}

interface ParentDashboardData {
  students: Array<{
    id: string;
    name: string;
    class?: {
      name: string;
    };
    section?: {
      name: string;
    };
  }>;
  summary: {
    totalStudents: number;
    totalFeesDue: number;
    totalOverdue: number;
    averageAttendance: number;
  };
}

export function AdminDashboardWidgets() {
  const { user } = useAuth();

  const { data: feeSummaryData } = useQuery({
    queryKey: ['fee-summary'],
    queryFn: async () => {
      const response = await feeApi.getReport({});
      return response.data;
    },
  });

  const { data: certificatesData } = useQuery({
    queryKey: ['recent-certificates'],
    queryFn: async () => {
      const response = await certificateApi.getAll({ limit: 5 });
      return response.data;
    },
  });

  const feeSummary = feeSummaryData?.data as FeeSummary;
  const certificates = certificatesData?.data || [];

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Fee Collection Summary */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Collection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Fees</div>
                  <div className="font-bold">₹{feeSummary.totalFees.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Collected</div>
                  <div className="font-bold text-green-600">₹{feeSummary.totalCollected.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Due</div>
                  <div className="font-bold text-yellow-600">₹{feeSummary.totalDue.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                  <div className="font-bold text-red-600">₹{feeSummary.totalOverdue.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Collection Rate</span>
                  <span className={`font-bold ${getCollectionRateColor(feeSummary.collectionRate)}`}>
                    {feeSummary.collectionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${feeSummary.collectionRate}%` }}
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/fees/reports">
                  <Eye className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading fee data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Fees Alert */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Overdue Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeSummary ? (
            <div className="space-y-4">
              {feeSummary.totalOverdue > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-800">Overdue Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{feeSummary.totalOverdue.toLocaleString('en-IN')}
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    Immediate attention required for overdue fee collection
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-green-800">All Clear</span>
                  </div>
                  <p className="text-sm text-green-700">
                    No overdue fees at this time
                  </p>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/fees/reports">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading overdue data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Recent Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-4">
              <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No certificates issued</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.slice(0, 3).map((certificate: Certificate) => (
                <div key={certificate.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {certificate.student?.name || 'Unknown Student'}
                    </h4>
                    <Badge className={getCertificateTypeColor(certificate.certificateType)} variant="outline">
                      {certificate.certificateType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
              {certificates.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/certificates">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ParentDashboardWidgets() {
  const { user } = useAuth();

  const { data: parentDashboardData } = useQuery({
    queryKey: ['parent-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: null };
      const response = await parentApi.getDashboard();
      return response.data;
    },
    enabled: !!user?.id,
  });

  const data = parentDashboardData?.data as ParentDashboardData;

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardContent className="p-6">
            <div className="text-center py-4">
              <UsersRound className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Due Fees */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Due Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Due</div>
                <div className="font-bold text-yellow-600">
                  ₹{data.summary.totalFeesDue.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className="font-bold text-red-600">
                  ₹{data.summary.totalOverdue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            {data.summary.totalOverdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Overdue fees require immediate attention
                  </span>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/parent/dashboard">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Progress */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Student Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Average Attendance</div>
              <div className="font-bold text-blue-600">
                {data.summary.averageAttendance.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${data.summary.averageAttendance}%` }}
                />
              </div>
            </div>
            <div className="text-center py-4">
              <UsersRound className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {data.summary.totalStudents} student{data.summary.totalStudents !== 1 ? 's' : ''} linked
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/parent/dashboard">
                <Eye className="h-4 w-4 mr-2" />
                View Progress
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.students.slice(0, 3).map((student) => (
              <Button
                key={student.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link to={`/parent/student/${student.id}`}>
                  <UsersRound className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className=\"font-medium\">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-muted-foreground">
                      {student.currentEnrollment?.classId?.name} - {student.currentEnrollment?.sectionId?.name}
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
            {data.students.length > 3 && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/parent/dashboard">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Students
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
