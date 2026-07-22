"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, BellRing, ExternalLink, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buttonClassName } from "@/components/ui/button";

type LiveNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  actionUrl: string;
  createdAt: string;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function LiveNotificationBell({ notificationsHref }: { notificationsHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const notificationFingerprint = useRef<string | null>(null);
  const [pushState, setPushState] = useState<"hidden" | "available" | "enabled" | "blocked">("hidden");

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(mountTimer);
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/notifications/unread", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { notifications?: LiveNotification[] };
    const nextNotifications = data.notifications ?? [];
    const nextFingerprint = nextNotifications.map((notification) => notification.id).join("|");
    if (notificationFingerprint.current !== null && notificationFingerprint.current !== nextFingerprint) {
      router.refresh();
    }
    notificationFingerprint.current = nextFingerprint;
    setNotifications(nextNotifications);
  }, [router]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 15_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    const permissionCheck = window.setTimeout(() => {
      setPushState(Notification.permission === "granted" ? "enabled" : Notification.permission === "denied" ? "blocked" : "available");
    }, 0);
    return () => window.clearTimeout(permissionCheck);
  }, []);

  const persistentAlert = useMemo(
    () => notifications.find((notification) => notification.type === "task_assigned" && notification.id !== dismissedAlertId)
      ?? notifications.find((notification) => notification.id !== dismissedAlertId)
      ?? null,
    [dismissedAlertId, notifications],
  );

  function openNotification(notification: LiveNotification) {
    const destination = notification.actionUrl.startsWith("/") && !notification.actionUrl.startsWith("//")
      ? notification.actionUrl
      : notificationsHref;
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setOpen(false);
    router.push(destination);
    void fetch(`/api/notifications/${notification.id}/read`, { method: "POST" })
      .catch(() => undefined)
      .finally(() => router.refresh());
  }

  async function enablePush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushState("blocked");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    setPushState(response.ok ? "enabled" : "available");
  }

  return (
    <>
      <div className="relative">
        <button aria-expanded={open} aria-label="Open notifications" className="relative grid h-10 w-10 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted" onClick={() => setOpen((current) => !current)} type="button">
          <Bell aria-hidden="true" className="h-4 w-4" />
          {notifications.length ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{Math.min(notifications.length, 9)}</span> : null}
        </button>
        {open && mounted ? createPortal(
          <div className="fixed inset-x-3 bottom-3 top-20 z-[100] flex min-h-0 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-20 sm:max-h-[min(560px,calc(100dvh-6rem))] sm:w-[min(390px,calc(100vw-2rem))]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-foreground">Unread notifications</p>
              <div className="flex shrink-0 items-center gap-3">
                <a className="text-xs font-semibold text-primary" href={notificationsHref}>View all</a>
                <button aria-label="Close notifications" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setOpen(false)} type="button"><X className="h-4 w-4" /></button>
              </div>
            </div>
            {pushState === "available" ? <button className="flex w-full items-center gap-3 border-b border-border bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-deep" onClick={() => void enablePush()} type="button"><Smartphone className="h-4 w-4" />Enable phone and computer alerts</button> : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {notifications.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">You are all caught up.</p> : notifications.map((notification) => <button className="flex w-full min-w-0 gap-3 rounded-md px-3 py-3 text-left hover:bg-muted" key={notification.id} onClick={() => openNotification(notification)} type="button"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep"><BellRing className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-foreground">{notification.title}</span><span className="mt-1 line-clamp-2 block break-words text-xs leading-5 text-muted-foreground">{notification.description}</span></span></button>)}
            </div>
          </div>,
          document.body,
        ) : null}
      </div>

      {persistentAlert && mounted ? createPortal(
        <aside aria-live="assertive" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90] max-h-[calc(100dvh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-md border border-primary/30 bg-card shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(400px,calc(100vw-2rem))]">
          <div className="flex min-w-0 gap-3 border-l-4 border-l-primary p-3 sm:gap-4 sm:p-4">
            <Image alt="IFTA Consulting logo" className="h-12 w-12 rounded-md border border-border bg-white object-contain" height={48} src="/icons/icon-192.png" width={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><BellRing className="h-4 w-4 shrink-0 text-primary" /><p className="truncate text-xs font-bold uppercase text-primary">New portal alert</p></div><button aria-label="Dismiss portal alert" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setDismissedAlertId(persistentAlert.id)} type="button"><X className="h-4 w-4" /></button></div>
              <h2 className="mt-2 break-words text-sm font-bold text-foreground">{persistentAlert.title}</h2>
              <p className="mt-1 line-clamp-4 break-words text-sm leading-5 text-muted-foreground">{persistentAlert.description}</p>
              <button className={buttonClassName({ className: "mt-3 w-full justify-center sm:w-auto", size: "sm" })} onClick={() => openNotification(persistentAlert)} type="button">{persistentAlert.type === "task_assigned" ? "Open request" : "Open update"}<ExternalLink className="h-4 w-4" /></button>
            </div>
          </div>
        </aside>,
        document.body,
      ) : null}
    </>
  );
}
