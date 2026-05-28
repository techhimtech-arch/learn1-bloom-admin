import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { schoolApi } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/shared/FileUpload';
import { Skeleton } from '@/components/ui/skeleton';

const schoolSettingsSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  email: z.string().email('Please enter a valid school email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be a valid 10-digit number'),
  website: z.string().url('Please enter a valid website URL (http/https)').or(z.literal('')),
  address: z.string().min(10, 'Please enter a complete address (min 10 characters)'),
  logo: z.string().optional(),
  signature: z.string().optional(),
});

type SchoolSettingsFormValues = z.infer<typeof schoolSettingsSchema>;

export default function SchoolSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<SchoolSettingsFormValues>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      logo: '',
      signature: '',
    },
  });

  const { isLoading } = useQuery({
    queryKey: ['school-settings', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return null;
      const response = await schoolApi.getById(user.schoolId);
      const data = response.data.data;
      form.reset({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        website: data.website || '',
        logo: data.logo || '',
        signature: data.signature || '',
      });
      return data;
    },
    enabled: !!user?.schoolId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SchoolSettingsFormValues) => schoolApi.updateMe(data),
    onSuccess: () => {
      toast.success('School settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const onSubmit = (data: SchoolSettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Settings</h1>
          <p className="text-muted-foreground">
            Manage your school's identity, branding, and contact information
          </p>
        </div>
        <Button 
          type="submit" 
          form="school-settings-form" 
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Form {...form}>
        <form 
          id="school-settings-form" 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                General Information
              </CardTitle>
              <CardDescription>
                Basic details about your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>School Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Official Email *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="contact@school.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="9876543210" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="https://www.school.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea 
                          className="pl-10" 
                          rows={3} 
                          placeholder="Enter full school address" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Branding & Assets */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  School Logo
                </CardTitle>
                <CardDescription>
                  Used on receipts and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  label="Upload Logo"
                  onUploadSuccess={(url) => form.setValue('logo', url)}
                  previewUrl={form.watch('logo')}
                  uploadType="school_logo"
                  accept="image/*"
                  maxSize={2}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  Principal's Signature
                </CardTitle>
                <CardDescription>
                  For automated documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  label="Upload Signature"
                  onUploadSuccess={(url) => form.setValue('signature', url)}
                  previewUrl={form.watch('signature')}
                  uploadType="school_signature"
                  accept="image/*"
                  maxSize={1}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
