"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "ifta-theme";
const THEME_CHANGE_EVENT = "ifta-theme-change";

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    function handleStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY || !isThemeMode(event.newValue)) {
        return;
      }

      setTheme(event.newValue);
      applyTheme(event.newValue);
    }

    function handleThemeChange(event: Event) {
      const nextTheme = (event as CustomEvent<ThemeMode>).detail;

      if (!isThemeMode(nextTheme)) {
        return;
      }

      setTheme(nextTheme);
      applyTheme(nextTheme);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme }));
      return nextTheme;
    });
  }

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      aria-pressed={theme === "dark"}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-2 text-xs font-semibold text-secondary-foreground",
        className,
      )}
      onClick={toggleTheme}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid h-5 w-5 place-items-center rounded-sm text-[10px] font-bold",
          theme === "dark"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground",
        )}
      >
        {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
