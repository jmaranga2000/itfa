"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type MouseEventHandler, type ReactNode } from "react";

type IdleWindow = Window &
  typeof globalThis & {
    cancelIdleCallback?: (handle: number) => void;
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
  };

type AuthNavLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

let authRouteWarmed = false;

export function AuthNavLink({ children, className, href, onClick }: AuthNavLinkProps) {
  const router = useRouter();
  const warmed = useRef(false);

  const warmAuthRoute = useCallback(() => {
    if (warmed.current || authRouteWarmed) {
      return;
    }

    warmed.current = true;
    authRouteWarmed = true;
    router.prefetch(href);
    void fetch(href, {
      credentials: "same-origin",
      headers: { "x-ifta-prefetch": "auth-nav" },
    }).catch(() => {
      warmed.current = false;
      authRouteWarmed = false;
    });
  }, [href, router]);

  useEffect(() => {
    const browserWindow = window as IdleWindow;

    if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(warmAuthRoute, { timeout: 1500 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(warmAuthRoute, 800);
    return () => globalThis.clearTimeout(timeoutId);
  }, [warmAuthRoute]);

  return (
    <Link
      className={className}
      href={href}
      onClick={onClick}
      onFocus={warmAuthRoute}
      onMouseEnter={warmAuthRoute}
      onPointerDown={warmAuthRoute}
      prefetch
    >
      {children}
    </Link>
  );
}
