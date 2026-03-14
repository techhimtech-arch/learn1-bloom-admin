import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { showApiError } from '@/lib/api-toast';
import { toast } from '@/hooks/use-toast';

const Register = () => {
  const [form, setForm] = useState({
    schoolName: '',
    schoolEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast({ title: 'Success', description: 'Your school has been registered successfully.' });
      navigate('/');
    } catch (err: any) {
      showApiError(err, 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Register Your School</h1>
          <p className="text-sm text-muted-foreground">Set up your school management system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">School Registration</CardTitle>
            <CardDescription>Fill in the details to create your school account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input id="schoolName" name="schoolName" placeholder="Delhi Public School" value={form.schoolName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email</Label>
                  <Input id="schoolEmail" name="schoolEmail" type="email" placeholder="contact@school.edu" value={form.schoolEmail} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input id="adminName" name="adminName" placeholder="John Doe" value={form.adminName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@school.edu" value={form.adminEmail} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input id="adminPassword" name="adminPassword" type="password" placeholder="••••••••" value={form.adminPassword} onChange={handleChange} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Register School'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
