import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck, Users, Calendar, ArrowRight, Activity } from 'lucide-react';
import { showApiSuccess, showApiError } from '@/lib/api-toast';
import { billingApi, schoolApi, studentApi } from '@/services/api';
import { toast } from 'sonner';

// Define the plans locally to match the backend config
const PLANS = {
  free_trial: { id: 'free_trial', name: 'Free Trial', price: 0, studentLimit: 50, features: ['Core features access', 'Daily attendance logs', 'Class & Subject management', 'Up to 50 active students'] },
  starter: { id: 'starter', name: 'Starter', price: 2999, studentLimit: 200, features: ['Everything in Free Trial', 'Standard Email Support', 'Automated Fee Management', 'Up to 200 active students'] },
  professional: { id: 'professional', name: 'Professional', price: 7999, studentLimit: 1000, features: ['Everything in Starter', 'Priority Support', 'Rich Exams & Rankings', 'Beautiful PDF Certificates', 'Up to 1,000 active students'] },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 14999, studentLimit: 999999, features: ['Full Academic Platform Suite', '24/7 Dedicated Support', 'Printable Report Cards PDF', 'SMS / WhatsApp Alerts Support', 'Unlimited student capacity'] }
};

const BillingDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('starter');
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState<any>(null);

  // Dynamic injection of Razorpay SDK script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch school details
  const { data: schoolRes, isLoading: isSchoolLoading } = useQuery({
    queryKey: ['my-school-billing'],
    queryFn: () => schoolApi.getById(JSON.parse(localStorage.getItem('user') || '{}').schoolId)
  });

  // Fetch current student enrollment count
  const { data: studentsRes, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['billing-students-count'],
    queryFn: () => studentApi.getAll({ limit: 1 })
  });

  const school = schoolRes?.data?.data;
  const totalStudents = studentsRes?.data?.pagination?.total || 0;

  const currentPlanId = school?.subscriptionStatus || 'free_trial';
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free_trial;
  const currentExpiry = school?.subscriptionExpiry ? new Date(school.subscriptionExpiry) : null;
  const isExpired = currentExpiry ? new Date() > currentExpiry : false;

  // Student capacity progress bar calculation
  const limitValue = currentPlan.studentLimit;
  const studentPercentage = Math.min(Math.round((totalStudents / limitValue) * 100), 100);

  // Create payment order mutation
  const createOrderMutation = useMutation({
    mutationFn: (planId: string) => billingApi.createOrder(planId),
    onSuccess: (res) => {
      const order = res.data;
      if (order.mode === 'mock') {
        setMockOrderDetails(order);
        setShowMockModal(true);
      } else {
        // Launch live Razorpay Checkout
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'TechHim SMS',
          description: `Subscription: ${order.plan.name} Plan`,
          order_id: order.orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await billingApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: order.plan.id
              });
              showApiSuccess(verifyRes, 'Subscription updated successfully!');
              queryClient.invalidateQueries({ queryKey: ['my-school-billing'] });
            } catch (err) {
              showApiError(err);
            }
          },
          prefill: {
            name: school?.name || '',
            email: school?.email || ''
          },
          theme: {
            color: '#3b82f6'
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    },
    onError: (err) => showApiError(err)
  });

  // Handle Mock Payment Success
  const handleConfirmMockPayment = async () => {
    if (!mockOrderDetails) return;
    
    try {
      const verifyRes = await billingApi.verifyPayment({
        razorpay_order_id: mockOrderDetails.orderId,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
        razorpay_signature: 'mock_signature_approved',
        planId: mockOrderDetails.plan.id
      });
      
      showApiSuccess(verifyRes, `Successfully upgraded to ${mockOrderDetails.plan.name} Plan!`);
      setShowMockModal(false);
      setMockOrderDetails(null);
      queryClient.invalidateQueries({ queryKey: ['my-school-billing'] });
    } catch (err) {
      showApiError(err);
    }
  };

  const handleCheckout = (planId: string) => {
    createOrderMutation.mutate(planId);
  };

  if (isSchoolLoading || isStudentsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-muted-foreground">Loading subscription billing details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Billing & Subscription
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your school subscription tiers, pricing plans, and usage limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isExpired ? 'destructive' : 'default'} className="px-3 py-1 text-sm font-semibold rounded-full flex gap-1 items-center">
            {isExpired ? (
              <>
                <AlertTriangle className="h-4 w-4" /> Subscription Expired
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Active Tenant Mode
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Subscription Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Card 1: Active Subscription */}
        <Card className="shadow-lg border-t-4 border-t-blue-600 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Plan</CardTitle>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">{currentPlan.name}</span>
              <Badge variant="secondary" className="font-semibold text-blue-700 bg-blue-50">
                {currentPlan.price === 0 ? 'Free' : `₹${currentPlan.price}/mo`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2 text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span>
                {currentExpiry ? (
                  <>
                    Expires on: <strong className="text-foreground">{currentExpiry.toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong>
                  </>
                ) : (
                  'No expiration set'
                )}
              </span>
            </div>
            {isExpired && (
              <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2 rounded-md border border-rose-100 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Write access is disabled. Please renew now.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Student Enrollment Meter */}
        <Card className="shadow-lg border-t-4 border-t-indigo-600 bg-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Student Capacity Limit</CardTitle>
            <div className="flex justify-between items-baseline mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-foreground">{totalStudents}</span>
                <span className="text-sm text-muted-foreground">/ {currentPlan.studentLimit === 999999 ? 'Unlimited' : `${currentPlan.studentLimit} students`}</span>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{studentPercentage}% capacity used</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <Progress value={studentPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span>
                {currentPlan.studentLimit === 999999 
                  ? 'Your Enterprise plan allows unlimited student enrollments.' 
                  : `You can enroll ${currentPlan.studentLimit - totalStudents} more students before reaching your plan limit.`}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Grid */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">Upgrade or Renew Your Plan</h3>
          <p className="text-sm text-muted-foreground">Select the best tier for your school. Scalable, secure, and no contract required.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(PLANS).map(([id, plan]) => {
            if (id === 'free_trial') return null; // Don't allow manual purchase of free trial
            const isSelected = selectedPlanId === id;
            const isCurrent = currentPlanId === id;

            return (
              <Card 
                key={id} 
                className={`shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isCurrent ? 'ring-2 ring-blue-600 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Current Plan
                  </div>
                )}

                <CardHeader>
                  <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">₹{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ month</span>
                  </div>
                  <CardDescription className="pt-2 text-xs font-medium">
                    Supports up to {plan.studentLimit === 999999 ? 'unlimited' : `${plan.studentLimit}`} enrolled students
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="h-px bg-border" />
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button 
                    className="w-full font-semibold"
                    variant={isCurrent ? 'outline' : 'default'}
                    onClick={() => handleCheckout(id)}
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending && selectedPlanId === id ? (
                      'Processing...'
                    ) : isCurrent ? (
                      'Renew Subscription'
                    ) : (
                      <>
                        Upgrade to {plan.name} <ArrowRight className="h-4 w-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sandbox Test payment simulation modal */}
      <Dialog open={showMockModal} onOpenChange={setShowMockModal}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center text-xl font-extrabold text-foreground">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              Razorpay Sandbox Simulation
            </DialogTitle>
            <DialogDescription className="text-sm mt-2 text-muted-foreground">
              We detected that live Razorpay API credentials are not yet configured on this instance. To let you test the upgrade cycle safely, we launched the mock sandbox checkout!
            </DialogDescription>
          </DialogHeader>

          {mockOrderDetails && (
            <div className="bg-muted/50 p-4 rounded-lg border space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">School:</span>
                <span className="font-semibold text-foreground">{school?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan Selected:</span>
                <span className="font-semibold text-blue-600 uppercase">{mockOrderDetails.plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction Amount:</span>
                <span className="font-extrabold text-foreground">₹{mockOrderDetails.amount / 100}.00</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                <span>Order ID:</span>
                <span className="font-mono">{mockOrderDetails.orderId}</span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setShowMockModal(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex gap-1.5" onClick={handleConfirmMockPayment}>
              Simulate Successful Payment <CheckCircle className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingDashboard;
