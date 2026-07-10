import React from 'react';
import { SetupWizard } from '@/components/admin/SetupWizard';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const SetupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <SetupWizard onComplete={() => navigate('/')} />
    </div>
  );
};

export default SetupPage;
