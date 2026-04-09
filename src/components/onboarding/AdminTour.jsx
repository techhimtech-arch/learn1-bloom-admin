import React, { useState, useCallback, useEffect } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { adminTourSteps, getStepRoute } from './adminTourSteps';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminTour = ({ runTour, setRunTour }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTourCallback = useCallback((data) => {
    const { status, index, type, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      setStepIndex(0);
      localStorage.setItem('adminTourCompleted', 'true');
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;

      if (nextIndex >= 0 && nextIndex < adminTourSteps.length) {
        const nextStep = adminTourSteps[nextIndex];
        const nextRoute = getStepRoute(nextStep?.id);

        if (nextRoute && location.pathname !== nextRoute) {
          navigate(nextRoute);
          // Small delay to let the page render before advancing
          setTimeout(() => setStepIndex(nextIndex), 300);
        } else {
          setStepIndex(nextIndex);
        }
      }
    }
  }, [navigate, location.pathname, setRunTour]);

  return (
    <Joyride
      steps={adminTourSteps}
      run={runTour}
      stepIndex={stepIndex}
      callback={handleTourCallback}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
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
  );
};

export default AdminTour;
