"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, BellRing, ExternalLink, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [pushState, setPushState] = useState<"hidden" | "available" | "enabled" | "blocked">("hidden");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/notifications/unread", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { notifications?: LiveNotification[] };
    setNotifications(data.notifications ?? []);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    setPushState(Notification.permission === "granted" ? "enabled" : Notification.permission === "denied" ? "blocked" : "available");
  }, []);

  const persistentAlert = useMemo(
    () => notifications.find((notification) => notification.type === "task_assigned") ?? notifications[0] ?? null,
    [notifications],
  );

  async function openNotification(notification: LiveNotification) {
    await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setOpen(false);
    router.push(notification.actionUrl);
    router.refresh();
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
        {open ? (
          <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-md border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-bold text-foreground">Unread notifications</p><a className="text-xs font-semibold text-primary" href={notificationsHref}>View all</a></div>
            {pushState === "available" ? <button className="flex w-full items-center gap-3 border-b border-border bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-deep" onClick={() => void enablePush()} type="button"><Smartphone className="h-4 w-4" />Enable phone and computer alerts</button> : null}
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">You are all caught up.</p> : notifications.map((notification) => <button className="flex w-full gap-3 rounded-md px-3 py-3 text-left hover:bg-muted" key={notification.id} onClick={() => void openNotification(notification)} type="button"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep"><BellRing className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{notification.title}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{notification.description}</span></span></button>)}
            </div>
          </div>
        ) : null}
      </div>

      {persistentAlert ? (
        <aside aria-live="assertive" className="fixed bottom-4 right-4 z-[70] w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-md border border-primary/30 bg-card shadow-2xl">
          <div className="flex gap-4 border-l-4 border-l-primary p-4">
            <Image alt="IFTA Consulting logo" className="h-12 w-12 rounded-md border border-border bg-white object-contain" height={48} src="/icons/icon-192.png" width={48} />
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /><p className="text-xs font-bold uppercase text-primary">New portal alert</p></div><h2 className="mt-2 text-sm font-bold text-foreground">{persistentAlert.title}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{persistentAlert.description}</p><button className={buttonClassName({ className: "mt-3", size: "sm" })} onClick={() => void openNotification(persistentAlert)} type="button">{persistentAlert.type === "task_assigned" ? "Open request" : "Open update"}<ExternalLink className="h-4 w-4" /></button></div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
