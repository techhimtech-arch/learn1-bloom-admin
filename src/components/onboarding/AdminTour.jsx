import React, { useState, useCallback, useEffect } from 'react';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { adminTourSteps, getStepRoute } from './adminTourSteps';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminTour = ({ runTour, setRunTour }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('?? Tour Component State:', {
      runTour,
      stepIndex,
      currentPath: location.pathname,
      totalSteps: adminTourSteps.length
    });
    
    // When tour starts, navigate to dashboard for first real step
    if (runTour && stepIndex === 0) {
      console.log('? Tour Started - Navigating to dashboard');
      navigate('/');
    }
  }, [runTour, stepIndex, location.pathname]);

  const handleTourCallback = useCallback((data) => {
    console.log('!!! SIMPLE CALLBACK:', data);
    const { status, index, type, action } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log('?? Tour Finished/Skipped:', status);
      setRunTour(false);
      setStepIndex(0);
      localStorage.setItem('adminTourCompleted', 'true');
      return;
    }

    // Simple step progression
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TOUR_START) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      console.log('?? Moving to step:', nextIndex);
      
      if (nextIndex >= 0 && nextIndex < adminTourSteps.length) {
        const nextStep = adminTourSteps[nextIndex];
        const nextRoute = getStepRoute(nextStep?.id);
        
        console.log('?? Next step info:', {
          stepId: nextStep?.id,
          target: nextStep?.target,
          route: nextRoute
        });
        
        // Navigate if needed
        if (nextRoute && location.pathname !== nextRoute) {
          console.log('?? Navigating to:', nextRoute);
          navigate(nextRoute);
          setTimeout(() => setStepIndex(nextIndex), 300);
        } else {
          setStepIndex(nextIndex);
        }
      } else if (nextIndex >= adminTourSteps.length) {
        console.log('?? Tour Complete!');
        setRunTour(false);
        setStepIndex(0);
        localStorage.setItem('adminTourCompleted', 'true');
      }
    }
  }, [navigate, location.pathname, setRunTour]);

  const handleNextStep = () => {
    console.log('?? Manual Next Step Clicked');
    const nextIndex = stepIndex + 1;
    
    if (nextIndex < adminTourSteps.length) {
      const nextStep = adminTourSteps[nextIndex];
      const nextRoute = getStepRoute(nextStep?.id);
      
      console.log('?? Manual Next Step:', {
        stepId: nextStep?.id,
        target: nextStep?.target,
        route: nextRoute
      });
      
      // Navigate if needed
      if (nextRoute && location.pathname !== nextRoute) {
        console.log('?? Navigating to:', nextRoute);
        navigate(nextRoute);
        setTimeout(() => setStepIndex(nextIndex), 300);
      } else {
        setStepIndex(nextIndex);
      }
    } else {
      console.log('?? Tour Complete!');
      setRunTour(false);
      setStepIndex(0);
      localStorage.setItem('adminTourCompleted', 'true');
    }
  };

  const handlePrevStep = () => {
    console.log('?? Manual Previous Step Clicked');
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleSkipTour = () => {
    console.log('?? Manual Skip Tour');
    setRunTour(false);
    setStepIndex(0);
    localStorage.setItem('adminTourCompleted', 'true');
  };

  return (
    <Joyride
      steps={adminTourSteps}
      run={runTour}
      stepIndex={stepIndex}
      callback={(data) => {
        console.log('!!! SIMPLE CALLBACK:', data);
        handleTourCallback(data);
      }}
      continuous={false}
      showProgress={false}
      showSkipButton={false}
      disableScrolling={false}
      debug={true}
      scrollToFirstStep={true}
      disableOverlay={false}
      disableCloseOnEsc={false}
      floaterProps={{
        disableAnimation: false,
      }}
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
          ':hover': {
            backgroundColor: '#4f46e5',
          },
        },
        buttonBack: {
          color: '#64748b',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          marginRight: '8px',
          transition: 'all 0.2s ease',
          ':hover': {
            backgroundColor: '#f1f5f9',
          },
        },
        buttonClose: {
          color: '#94a3b8',
          borderRadius: '8px',
          padding: '4px',
          transition: 'all 0.2s ease',
          ':hover': {
            color: '#64748b',
          },
        },
        buttonSkip: {
          color: '#94a3b8',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          ':hover': {
            color: '#64748b',
          },
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
      ariaLabels={{
        tooltip: 'Tour tooltip',
        close: 'Close tour',
        next: 'Next step',
        prev: 'Previous step',
        skip: 'Skip tour',
      }}
      getHelpers={(helpers) => {
        console.log('?? Tour Helpers:', helpers);
        window.tourHelpers = helpers;
        return helpers;
      }}
    />
  );

  // Add custom tour controls overlay
  if (runTour && stepIndex >= 0) {
    return (
      <>
        <Joyride
          steps={adminTourSteps}
          run={runTour}
          stepIndex={stepIndex}
          callback={(data) => {
            console.log('!!! SIMPLE CALLBACK:', data);
            handleTourCallback(data);
          }}
          continuous={false}
          showProgress={false}
          showSkipButton={false}
          disableScrolling={false}
          debug={true}
          scrollToFirstStep={true}
          disableOverlay={false}
          disableCloseOnEsc={false}
          floaterProps={{
            disableAnimation: false,
          }}
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
              ':hover': {
                backgroundColor: '#4f46e5',
              },
            },
            buttonBack: {
              color: '#64748b',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              marginRight: '8px',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#f1f5f9',
              },
            },
            buttonClose: {
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '4px',
              transition: 'all 0.2s ease',
              ':hover': {
                color: '#64748b',
              },
            },
            buttonSkip: {
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              ':hover': {
                color: '#64748b',
              },
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
          ariaLabels={{
            tooltip: 'Tour tooltip',
            close: 'Close tour',
            next: 'Next step',
            prev: 'Previous step',
            skip: 'Skip tour',
          }}
        />
        
        {/* Custom Tour Controls */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10001,
          display: 'flex',
          gap: '8px',
          background: '#fff',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <button 
            onClick={handlePrevStep}
            disabled={stepIndex === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: stepIndex === 0 ? '#f8fafc' : '#fff',
              color: stepIndex === 0 ? '#94a3b8' : '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: stepIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <button 
            onClick={handleNextStep}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {stepIndex === adminTourSteps.length - 1 ? 'Finish' : 'Next'}
          </button>
          
          <button 
            onClick={handleSkipTour}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
        </div>
      </>
    );
  }

  return null;
};

export default AdminTour;
