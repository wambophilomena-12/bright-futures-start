import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show dialog automatically after 30 seconds if not dismissed
      const hasShownPrompt = localStorage.getItem('installPromptShown');
      if (!hasShownPrompt) {
        setTimeout(() => {
          setShowInstallDialog(true);
        }, 30000); // 30 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallDialog(false);
      toast({
        title: "App Installed!",
        description: "TripTrac has been installed on your device.",
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS devices, show manual install instructions
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        toast({
          title: "Install on iOS",
          description: "Tap the Share button below, then 'Add to Home Screen'",
          duration: 5000,
        });
      } else {
        toast({
          title: "Installation not available",
          description: "Your browser doesn't support app installation.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('installPromptShown', 'true');
        setShowInstallDialog(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing app:', error);
      toast({
        title: "Installation Error",
        description: "Failed to install the app. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallDialog(false);
    localStorage.setItem('installPromptShown', 'true');
  };

  // Don't show if already installed or not on mobile
  if (isInstalled || !isMobile) {
    return null;
  }

  return (
    <>
      {/* Install button in header/menu */}
      {deferredPrompt && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInstallDialog(true)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Install App
        </Button>
      )}

      {/* Install dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install TripTrac
            </DialogTitle>
            <DialogDescription>
              Install our app for a better experience! Access TripTrac directly from your home screen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                T
              </div>
              <div>
                <p className="font-semibold">TripTrac</p>
                <p className="text-sm text-muted-foreground">Discover amazing travel experiences</p>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Faster loading
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Home screen access
              </li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Not Now
            </Button>
            <Button onClick={handleInstallClick} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
