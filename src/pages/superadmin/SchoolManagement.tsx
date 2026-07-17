import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School as SchoolIcon, Users, Building, Activity, LayoutDashboard, SearchIcon } from 'lucide-react';
import apiClient from '@/services/api';

interface School {
  _id: string;
  name: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  totalUsers?: number;
}

interface Analytics {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const SchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [schoolsRes, analyticsRes] = await Promise.all([
        apiClient.get('/superadmin/schools'),
        apiClient.get('/superadmin/analytics')
      ]);
      
      if (schoolsRes.data.success) {
        setSchools(schoolsRes.data.data);
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const updatePlan = async (schoolId: string, newPlan: string) => {
    try {
      await apiClient.patch(`/superadmin/schools/${schoolId}`, { plan: newPlan });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update plan', error);
    }
  };

  const viewDetails = async (schoolId: string) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    setSelectedSchoolDetails(null);
    try {
      const response = await apiClient.get(`/superadmin/schools/${schoolId}`);
      if (response.data.success) {
        setSelectedSchoolDetails(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch school details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    school.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      className="space-y-8 p-6 pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Tenants Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor and manage your enterprise school network.
          </p>
        </div>
        <Button className="shadow-lg hover:shadow-xl transition-all duration-300">
          <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Global Reports
        </Button>
      </motion.div>

      {/* Analytics Cards with Glassmorphism */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Schools", value: analytics?.totalSchools || 0, icon: Building, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Active Tenants", value: analytics?.activeSchools || 0, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Total Users", value: analytics?.totalUsers || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Total Students", value: analytics?.totalStudents || 0, icon: SchoolIcon, color: "text-orange-500", bg: "bg-orange-500/10" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold tracking-tight mt-1">{stat.value}</h3>
              </div>
            </div>
            {/* Decorative background element */}
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${stat.bg} blur-2xl opacity-50`} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">Registered Schools</CardTitle>
                <CardDescription>Manage subscriptions, status, and tenant details.</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tenants..." 
                  className="pl-9 bg-background/50 backdrop-blur-sm border-border/50 focus:ring-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold py-4">School Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Total Users</TableHead>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span>Loading tenants...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredSchools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          No tenants found matching "{searchTerm}"
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSchools.map((school) => (
                        <motion.tr
                          key={school._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="group border-b hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="font-medium py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {school.name.charAt(0).toUpperCase()}
                              </div>
                              {school.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{school.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-background">
                              <Users className="mr-1 h-3 w-3" />
                              {school.totalUsers || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={school.plan} 
                              onValueChange={(val) => updatePlan(school._id, val)}
                            >
                              <SelectTrigger className="w-[130px] h-9 bg-background/50 border-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free Plan</SelectItem>
                                <SelectItem value="premium">Premium Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className={school.isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"}>
                              {school.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => viewDetails(school._id)}
                            >
                              View Insights
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-xl backdrop-blur-xl bg-background/90 border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              Tenant Insights
            </DialogTitle>
            <DialogDescription>
              Comprehensive overview of the tenant's resource utilization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {loadingDetails ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : selectedSchoolDetails ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Tenant Name</h4>
                    <p className="text-lg font-semibold">{selectedSchoolDetails.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Email</h4>
                    <p className="text-lg font-semibold">{selectedSchoolDetails.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Resource Distribution</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Admins", val: selectedSchoolDetails.stats.admins },
                      { label: "Teachers", val: selectedSchoolDetails.stats.teachers },
                      { label: "Students", val: selectedSchoolDetails.stats.students },
                      { label: "Parents", val: selectedSchoolDetails.stats.parents },
                      { label: "Accountants", val: selectedSchoolDetails.stats.accountants }
                    ].map((stat, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/30 bg-background/50 hover:bg-muted/20 transition-colors">
                        <span className="text-2xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                          {stat.val || 0}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8 text-destructive">Failed to load tenant insights.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SchoolManagement;
