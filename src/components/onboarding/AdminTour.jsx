import React, { useState, useCallback, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { adminTourSteps, getStepRoute } from './adminTourSteps';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminTour = ({ runTour, setRunTour }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTourCallback = useCallback((data) => {
    const { status, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem('adminTourCompleted', 'true');
    } else if (type === 'step:before') {
      const currentStep = adminTourSteps[index];
      const nextRoute = getStepRoute(currentStep?.id);
      
      if (nextRoute && location.pathname !== nextRoute) {
        navigate(nextRoute);
      }
    }
  }, [navigate, location.pathname, setRunTour]);

  const resetTour = useCallback(() => {
    setStepIndex(0);
    setRunTour(true);
    localStorage.removeItem('adminTourCompleted');
  }, [setRunTour]);

  useEffect(() => {
    if (runTour) {
      const currentStep = adminTourSteps[stepIndex];
      const requiredRoute = getStepRoute(currentStep?.id);
      
      if (requiredRoute && location.pathname !== requiredRoute) {
        navigate(requiredRoute);
      }
    }
  }, [runTour, stepIndex, location.pathname, navigate]);

  return (
    <>
      <Joyride
        steps={adminTourSteps}
        run={runTour}
        stepIndex={stepIndex}
        callback={handleTourCallback}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: '#fff',
            backgroundColor: '#fff',
            primaryColor: '#6366f1',
            textColor: '#334155',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
          },
          tooltip: {
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '320px',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1e293b',
          },
          tooltipContent: {
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#64748b',
          },
          buttonNext: {
            backgroundColor: '#6366f1',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          },
          buttonBack: {
            color: '#64748b',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            marginRight: '8px',
          },
          buttonClose: {
            color: '#94a3b8',
            borderRadius: '8px',
            padding: '4px',
          },
          buttonSkip: {
            color: '#94a3b8',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          spotlight: {
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          },
        }}
        locale={{
          back: 'Previous',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
    </>
  );
};

export default AdminTour;
