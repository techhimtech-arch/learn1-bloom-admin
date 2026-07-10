import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Users, CreditCard, GraduationCap, CheckCircle2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 1, title: 'Academic Year', icon: BookOpen, description: 'Set up the current academic year.' },
  { id: 2, title: 'Classes', icon: Users, description: 'Add classes and sections.' },
  { id: 3, title: 'Fees & Payment', icon: CreditCard, description: 'Set fee structure and UPI QR.' },
  { id: 4, title: 'Students', icon: GraduationCap, description: 'Admit or import students.' }
];

export const SetupWizard = ({ onComplete }: { onComplete?: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Bloom Admin!</h2>
        <p className="text-muted-foreground mt-2">Let's get your school set up in 4 easy steps.</p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-muted z-0"></div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
        
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-background p-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                isActive ? 'border-primary bg-primary text-primary-foreground' : 
                isPast ? 'border-primary bg-primary text-primary-foreground' : 
                'border-muted bg-background text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-medium ${isActive || isPast ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[250px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="year-name">Academic Year Name</Label>
                <Input id="year-name" placeholder="e.g. 2026-2027" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4 flex flex-col items-center justify-center h-full text-center">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Go to the Class Management page to set up classes and sections.</p>
              <Button variant="outline" onClick={() => navigate('/admin/classes')}>Open Class Management</Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid gap-2 border p-4 rounded-lg bg-slate-50">
                <Label className="text-lg font-semibold">Zero-Fee UPI Setup</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload your school's UPI QR Code to receive direct payments from parents.</p>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-xs">Upload QR</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="upi-id">UPI ID (VPA)</Label>
                      <Input id="upi-id" placeholder="e.g. schoolname@sbi" />
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/fees/structure')}>
                Configure Fee Structures
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 flex flex-col items-center justify-center h-full text-center">
              <GraduationCap className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Now you are ready to admit students.</p>
              <Button variant="outline" onClick={() => navigate('/admin/admissions')}>Open Admission Form</Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length ? 'Finish Setup' : 'Next Step'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
