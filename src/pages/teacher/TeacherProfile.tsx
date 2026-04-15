import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { teacherApi } from '@/pages/services/api';
import { showApiError, showApiSuccess } from '@/lib/api-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
  subjectAssignments: Array<{
    classId: { _id: string; name: string };
    sectionId: { _id: string; name: string };
    subjectId: { _id: string; name: string };
  }>;
  classTeacherAssignment?: {
    classId: { _id: string; name: string };
    sectionId: { _id: string; name: string };
  };
}

const TeacherProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    qualification: '',
    experience: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await teacherApi.getProfile();
      setProfile(data.data);
      setEditForm({
        phone: data.data?.phone || '',
        qualification: data.data?.qualification || '',
        experience: data.data?.experience || ''
      });
    } catch (error) {
      showApiError(error, 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        phone: profile.phone || '',
        qualification: profile.qualification || '',
        experience: profile.experience || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      // Update profile API call (you'll need to add this to teacherApi)
      await teacherApi.updateProfile(editForm);
      showApiSuccess(null, 'Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      showApiError(error, 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">View and manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={profile?.name || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input 
                  value={profile?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <Input 
                    value={profile?.phone || 'Not provided'} 
                    disabled 
                    className="bg-muted"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={editForm.qualification}
                    onChange={(e) => setEditForm(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="Enter your qualification"
                  />
                ) : (
                  <Input 
                    value={profile?.qualification || 'Not provided'} 
                    disabled 
                    className="bg-muted"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Experience</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Textarea
                  value={editForm.experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Describe your teaching experience"
                  rows={3}
                />
              ) : (
                <Textarea 
                  value={profile?.experience || 'Not provided'} 
                  disabled 
                  className="bg-muted"
                  rows={3}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Class Teacher Assignment */}
            {profile?.classTeacherAssignment && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Class Teacher</h4>
                <Badge variant="secondary" className="text-sm">
                  {profile.classTeacherAssignment.classId.name} - {profile.classTeacherAssignment.sectionId.name}
                </Badge>
              </div>
            )}

            {/* Subject Assignments */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Subject Assignments</h4>
              <div className="flex flex-wrap gap-2">
                {profile?.subjectAssignments?.map((assignment, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {assignment.subjectId.name} ({assignment.classId.name} - {assignment.sectionId.name})
                  </Badge>
                ))}
                {(!profile?.subjectAssignments || profile.subjectAssignments.length === 0) && (
                  <p className="text-sm text-muted-foreground">No subject assignments found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfile;
