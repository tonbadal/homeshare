"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed previously in this session
    if (sessionStorage.getItem("install-prompt-dismissed")) {
      setDismissed(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    // Listen for the native install prompt (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("install-prompt-dismissed", "true");
  };

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) return null;

  // Don't show if not iOS and no native prompt available
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border bg-white p-4 shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {isIOS ? (
        <div className="space-y-2 pr-6">
          <p className="text-sm font-medium">Add Flow Your Home to your Home Screen</p>
          <p className="text-xs text-muted-foreground">
            Tap the <Share className="inline h-3.5 w-3.5" /> share button in
            Safari, then select <strong>&quot;Add to Home Screen&quot;</strong>.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 pr-6">
          <div className="flex-1">
            <p className="text-sm font-medium">Install Flow Your Home</p>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for quick access
            </p>
          </div>
          <Button size="sm" onClick={handleInstall}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Install
          </Button>
        </div>
      )}
    </div>
  );
}
