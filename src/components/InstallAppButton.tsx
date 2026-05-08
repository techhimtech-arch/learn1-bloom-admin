import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true);

interface Props {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

const InstallAppButton = ({ className, variant = 'outline' }: Props) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted') {
          toast({ title: 'Installing', description: 'App is being installed.' });
        }
        setDeferred(null);
      } catch {
        toast({ title: 'Install failed', description: 'Please try again.', variant: 'destructive' });
      }
      return;
    }

    if (isIOS()) {
      toast({
        title: 'Install on iPhone/iPad',
        description: 'Tap the Share icon in Safari, then "Add to Home Screen".',
      });
      return;
    }

    toast({
      title: 'Install not available',
      description:
        'Open this site in Chrome/Edge on the published URL. Use the address bar install icon or browser menu → "Install app".',
    });
  };

  if (installed) {
    return (
      <Button variant="ghost" className={className} disabled>
        <Check className="mr-2 h-4 w-4" /> App Installed
      </Button>
    );
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={handleClick}>
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
};

export default InstallAppButton;
