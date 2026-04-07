import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Download,
  Eye,
  Search,
  Filter,
  FileText,
  Folder,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { assignmentApi } from '@/services/api';
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

interface StudyMaterial {
  _id: string;
  title: string;
  subject: string;
  chapter?: string;
  description: string;
  fileUrl?: string;
  fileSize?: string;
  uploadedDate: string;
  uploadedBy?: string;
  type: 'pdf' | 'doc' | 'video' | 'image' | 'other';
}

const StudentStudyMaterials = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(
    null
  );

  // Fetch study materials (using assignments as materials source)
  const {
    data: materialsData,
    isLoading,
    error,
  } = useQuery<StudyMaterial[]>({
    queryKey: ['study-materials', user?.id],
    queryFn: async () => {
      try {
        // Fetch all assignments which can serve as study materials
        const response = await assignmentApi.getAll({ type: 'material' });
        const materials = response.data?.data || [];
        return materials.map((item: Record<string, unknown>) => ({
          _id: item._id as string,
          title: item.title as string,
          subject: (item.subject as string) || 'General',
          chapter: item.chapter as string | undefined,
          description: item.description as string,
          fileUrl: (item.fileUrl as string) || (item.attachments as Array<{url: string}>)?.[0]?.url,
          fileSize: item.fileSize as string | undefined,
          uploadedDate: (item.createdAt as string) || new Date().toISOString(),
          uploadedBy: (item.uploadedBy as string) || 'School',
          type: 'pdf' as const,
        }));
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        return [];
      }
    },
  });

  const materials = materialsData || [];

  // Filter materials
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects
  const subjects = Array.from(
    new Set(materials.map((m) => m.subject))
  ).sort();

  const handleDownload = (material: StudyMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    } else {
      alert(`Downloading: ${material.title}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download and access all your study materials by subject
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Total Materials
              </p>
              <p className="text-2xl font-bold mt-1">{materials.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Subjects
              </p>
              <p className="text-2xl font-bold mt-1">{subjects.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Downloadable Files
              </p>
              <p className="text-2xl font-bold mt-1">
                {materials.filter((m) => m.fileUrl).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert className="border-red-200 bg-red-50">
          <Alert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load study materials. Please try again later.
          </AlertDescription>
        </Alert>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material._id}
              className="hover:shadow-lg transition-shadow flex flex-col"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {getTypeIcon(material.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {material.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {material.subject}
                      {material.chapter && ` - ${material.chapter}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {material.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 inline mr-1" />
                      Uploaded
                    </span>
                    <span className="font-medium">
                      {format(new Date(material.uploadedDate), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      <User className="h-3.5 w-3.5 inline mr-1" />
                      By
                    </span>
                    <span className="font-medium">{material.uploadedBy}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{material.title}</DialogTitle>
                        <DialogDescription>
                          {material.subject}
                          {material.chapter && ` - ${material.chapter}`}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-6 text-center min-h-96 flex flex-col items-center justify-center">
                          {getTypeIcon(material.type)}
                          <p className="mt-4 text-sm text-muted-foreground">
                            Preview not available for {getTypeLabel(material.type)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Click Download to view the full material
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">{material.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Type
                              </p>
                              <p className="font-medium">
                                {getTypeLabel(material.type)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Subject
                              </p>
                              <p className="font-medium">{material.subject}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleDownload(material)}
                        >
                          <Download className="h-4 w-4" />
                          Download Material
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleDownload(material)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Materials Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm || selectedSubject !== 'all'
              ? 'No materials match your search criteria. Try adjusting your filters.'
              : 'No study materials available yet. Check back soon!'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default StudentStudyMaterials;
