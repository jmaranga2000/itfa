"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import type { AdminSearchResult } from "@/features/admin/global-search-service";

export function AdminGlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(value)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search unavailable");
        const payload = (await response.json()) as { results?: AdminSearchResult[] };
        setResults(payload.results ?? []);
        setActiveIndex(0);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function openResult(result: AdminSearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="Search all admin records"
        autoComplete="off"
        className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            setResults([]);
            setLoading(false);
          }
          setOpen(true);
        }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" && results.length) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
          }
          if (event.key === "ArrowUp" && results.length) {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
          }
          if (event.key === "Enter" && results[activeIndex]) {
            event.preventDefault();
            openResult(results[activeIndex]);
          }
        }}
        placeholder="Search clients, IDs, requests, engagements..."
        type="search"
        value={query}
      />
      {loading ? (
        <LoaderCircle aria-hidden="true" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : query ? (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[min(65vh,520px)] overflow-y-auto rounded-md border border-border bg-card p-2 shadow-2xl">
          {loading && results.length === 0 ? (
            <p className="px-3 py-5 text-center text-sm text-muted-foreground">Searching records...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-5 text-center text-sm text-muted-foreground">No matching admin records found.</p>
          ) : (
            <ul aria-label="Admin search results" className="grid gap-1" role="listbox">
              {results.map((result, index) => (
                <li key={`${result.category}-${result.id}`}>
                  <button
                    aria-selected={index === activeIndex}
                    className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left ${index === activeIndex ? "bg-muted" : "hover:bg-muted/70"}`}
                    onClick={() => openResult(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span className="mt-0.5 shrink-0 rounded-sm bg-brand-mist px-2 py-1 text-[10px] font-bold uppercase text-brand-deep">
                      {result.category}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{result.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
