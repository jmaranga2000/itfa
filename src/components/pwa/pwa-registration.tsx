"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaRegistration() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerWorker = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.error("Unable to register the IFTA service worker.", error);
      });
    };

    if (document.readyState === "complete") registerWorker();
    else window.addEventListener("load", registerWorker, { once: true });

    return () => window.removeEventListener("load", registerWorker);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (!installPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-w-xl items-center gap-3 border border-border bg-card p-3 text-card-foreground shadow-xl sm:inset-x-auto sm:right-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
        <Download aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Install IFTA Consulting</p>
        <p className="truncate text-xs text-muted-foreground">Open the portal from your home screen.</p>
      </div>
      <Button onClick={install} size="sm">
        Install
      </Button>
      <Button aria-label="Dismiss install prompt" onClick={() => setInstallPrompt(null)} size="icon" variant="ghost">
        <X aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}
