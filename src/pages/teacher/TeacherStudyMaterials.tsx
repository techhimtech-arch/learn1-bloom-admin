import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  BookOpen,
  Loader2,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { studyMaterialApi, classApi, subjectApi } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileUpload } from '@/components/shared/FileUpload';
import { Skeleton } from '@/components/ui/skeleton';

interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  subjectId: { _id: string; name: string };
  classId: { _id: string; name: string };
  fileUrl: string;
  type: string;
  createdAt: string;
}

export default function TeacherStudyMaterials() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    fileUrl: '',
    type: 'pdf'
  });

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['study-materials-teacher'],
    queryFn: async () => {
      const response = await studyMaterialApi.getAll();
      return response.data.data;
    }
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classApi.getAll();
      return response.data.data;
    }
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectApi.getAll();
      return response.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => studyMaterialApi.create(data),
    onSuccess: () => {
      toast.success('Study material added successfully');
      queryClient.invalidateQueries({ queryKey: ['study-materials-teacher'] });
      handleClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studyMaterialApi.update(id, data),
    onSuccess: () => {
      toast.success('Study material updated successfully');
      queryClient.invalidateQueries({ queryKey: ['study-materials-teacher'] });
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyMaterialApi.delete(id),
    onSuccess: () => {
      toast.success('Study material deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['study-materials-teacher'] });
    }
  });

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      subjectId: material.subjectId._id || material.subjectId,
      classId: material.classId._id || material.classId,
      fileUrl: material.fileUrl,
      type: material.type
    });
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingMaterial(null);
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      classId: '',
      fileUrl: '',
      type: 'pdf'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) {
      toast.error('Please upload a file');
      return;
    }
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const materials = materialsData || [];
  const classes = classesData || [];
  const subjects = subjectsData || [];

  const filteredMaterials = materials.filter((m: any) => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || (m.classId._id || m.classId) === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="text-muted-foreground">Manage notes, syllabus, and resources for your students</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material: any) => (
                  <TableRow key={material._id}>
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>{material.classId?.name || '-'}</TableCell>
                    <TableCell>{material.subjectId?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">{material.type}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(material.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={material.fileUrl} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(material._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMaterials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No study materials found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Study Material'}</DialogTitle>
            <DialogDescription>
              Upload educational resources for your students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select 
                  value={formData.classId} 
                  onValueChange={(val) => setFormData({ ...formData, classId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select 
                  value={formData.subjectId} 
                  onValueChange={(val) => setFormData({ ...formData, subjectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub: any) => (
                      <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Resource File *
              </Label>
              <FileUpload 
                label="Upload PDF, Notes, etc."
                onUploadSuccess={(url) => setFormData({ ...formData, fileUrl: url })}
                previewUrl={formData.fileUrl}
                uploadType="study_material"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                maxSize={20}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingMaterial ? 'Update' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
