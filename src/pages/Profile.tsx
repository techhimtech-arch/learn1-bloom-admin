import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Lock, Camera, Loader2, Save, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { userApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { toast } from '@/hooks/use-toast';
import { ROLE_LABELS, canTakeTour, getTourLocalStorageKey } from '@/lib/role-config';

interface ProfileData {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name: string } | string;
  updatedBy?: { name: string } | string;
}

interface ProfileProps {
  setRunTour?: (run: boolean) => void;
}

const Profile = ({ setRunTour }: ProfileProps) => {
  const { user: authUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit form
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await userApi.getMe();
      const p = data.data;
      setProfile(p);
      setEditForm({
        firstName: p.firstName || p.name?.split(' ')[0] || '',
        lastName: p.lastName || p.name?.split(' ').slice(1).join(' ') || '',
        phone: p.phone || '',
      });
    } catch (err) {
      showApiError(err, 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editForm.firstName.trim() || editForm.firstName.trim().length < 2)
      errs.firstName = 'First name must be at least 2 characters';
    if (!editForm.lastName.trim() || editForm.lastName.trim().length < 2)
      errs.lastName = 'Last name must be at least 2 characters';
    if (editForm.phone && !/^\+?[\d\s-]{7,15}$/.test(editForm.phone))
      errs.phone = 'Invalid phone number';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    try {
      const name = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`;
      const res = await userApi.updateMe({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        name,
        phone: editForm.phone.trim() || undefined,
      });
      showApiSuccess(res, 'Profile updated successfully');
      fetchProfile();
    } catch (err) {
      showApiError(err, 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    const errs: Record<string, string> = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6)
      errs.newPassword = 'Password must be at least 6 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwForm.newPassword))
      errs.newPassword = 'Must contain uppercase, lowercase, and number';
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setPwSaving(true);
    try {
      const res = await userApi.changePassword(pwForm);
      showApiSuccess(res, 'Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showApiError(err, 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Image must be under 5MB' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an image file' });
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const res = await userApi.uploadProfileImage(file);
      showApiSuccess(res, 'Profile image updated');
      fetchProfile();
    } catch (err) {
      showApiError(err, 'Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (!profile) return 'U';
    return profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const getAuditName = (field?: { name: string } | string) => {
    if (!field) return null;
    return typeof field === 'string' ? field : field.name;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6"><div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /></div>
        </div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">View and manage your account information</p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarImage src={previewUrl || profile?.profileImage} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="mt-1 text-xs capitalize text-primary font-medium">
                {ROLE_LABELS[profile?.role || ''] || profile?.role}
              </p>
              {profile?.phone && <p className="mt-1 text-sm text-muted-foreground">{profile.phone}</p>}
            </div>
          </div>
          {/* Audit info */}
          {(profile?.createdBy || profile?.updatedBy) && (
            <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground">
              {profile.createdBy && <span>Created by: {getAuditName(profile.createdBy)}</span>}
              {profile.updatedBy && <span>Last updated by: {getAuditName(profile.updatedBy)}</span>}
              {profile.createdAt && <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit" className="gap-1.5"><User className="h-4 w-4" /> Edit Profile</TabsTrigger>
          <TabsTrigger value="password" className="gap-1.5"><Lock className="h-4 w-4" /> Change Password</TabsTrigger>
          {canTakeTour(authUser?.role || '') && (
            <TabsTrigger value="tour" className="gap-1.5"><PlayCircle className="h-4 w-4" /> Tour Settings</TabsTrigger>
          )}
        </TabsList>

        {/* Edit Profile Tab */}
        <TabsContent value="edit">
          <Card>
            <CardHeader><CardTitle className="text-lg">Edit Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} maxLength={50} />
                  {editErrors.firstName && <p className="text-xs text-destructive">{editErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} maxLength={50} />
                  {editErrors.lastName && <p className="text-xs text-destructive">{editErrors.lastName}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+91 98765 43210" maxLength={15} />
                {editErrors.phone && <p className="text-xs text-destructive">{editErrors.phone}</p>}
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle className="text-lg">Change Password</CardTitle></CardHeader>
            <CardContent className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label>Current Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={showCurrentPw ? 'text' : 'password'} value={pwForm.currentPassword}
                    onChange={e => { setPwForm({ ...pwForm, currentPassword: e.target.value }); setPwErrors({}); }} maxLength={128} />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pwErrors.currentPassword && <p className="text-xs text-destructive">{pwErrors.currentPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label>New Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={showNewPw ? 'text' : 'password'} value={pwForm.newPassword}
                    onChange={e => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwErrors({}); }}
                    placeholder="Min 6 chars, upper+lower+number" maxLength={128} />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pwErrors.newPassword && <p className="text-xs text-destructive">{pwErrors.newPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label>Confirm Password <span className="text-destructive">*</span></Label>
                <Input type="password" value={pwForm.confirmPassword}
                  onChange={e => { setPwForm({ ...pwForm, confirmPassword: e.target.value }); setPwErrors({}); }} maxLength={128} />
                {pwErrors.confirmPassword && <p className="text-xs text-destructive">{pwErrors.confirmPassword}</p>}
              </div>
              <Button onClick={handleChangePassword} disabled={pwSaving}>
                {pwSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                {pwSaving ? 'Changing…' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tour Settings Tab */}
        {canTakeTour(authUser?.role || '') && (
          <TabsContent value="tour">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Tour Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Take a guided tour of your {ROLE_LABELS[authUser?.role || 'User'] || 'User'} portal to learn about all the features and modules available to you.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => {
                        const tourKey = getTourLocalStorageKey(authUser?.role || '');
                        localStorage.removeItem(tourKey);
                        setRunTour?.(true);
                      }}
                      className="gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Restart Tour
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const tourKey = getTourLocalStorageKey(authUser?.role || '');
                        localStorage.setItem(tourKey, 'true');
                        toast({
                          title: 'Tour Disabled',
                          description: 'The tour will not show automatically on login.',
                        });
                      }}
                    >
                      Disable Auto-Tour
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> You can always restart the tour from this page or by clicking "Take a Tour" in the sidebar menu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Profile;
