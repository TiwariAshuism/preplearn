"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavNode } from "../lib/types";
import { NavTree } from "./NavTree";
import { SearchTrigger } from "./SearchDialog";

type MobileSidebarProps = {
  navTree: NavNode[];
  syncLabel: string | null;
  children: React.ReactNode;
};

function SidebarPanel({
  navTree,
  syncLabel,
  onNavigate,
}: {
  navTree: NavNode[];
  syncLabel: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-4 hidden lg:block">
        <SearchTrigger />
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Roadmap
        </p>
        {syncLabel && (
          <p className="mt-1 text-[11px] text-zinc-500">{syncLabel}</p>
        )}
      </div>
      <div
        className="overflow-y-auto lg:max-h-[calc(100vh-8rem)]"
        onClick={onNavigate}
      >
        <NavTree tree={navTree} />
      </div>
    </>
  );
}

export function MobileSidebar({
  navTree,
  syncLabel,
  children,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col lg:flex-row">
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/95 px-3 py-2.5 backdrop-blur-sm lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-doc-nav"
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 p-2 text-zinc-700 transition-transform duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 truncate"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
            P
          </span>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            PrepLearn
          </span>
        </Link>

        <SearchTrigger compact />
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in motion-reduce:animate-none lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="mobile-doc-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw,18rem)] flex-col border-r border-zinc-200 bg-zinc-50 px-4 py-6 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:z-auto lg:block lg:w-72 lg:shrink-0 lg:translate-x-0 lg:border-r lg:border-zinc-200 lg:bg-zinc-50 lg:px-4 lg:py-6 lg:shadow-none dark:lg:border-zinc-800 dark:lg:bg-zinc-950 ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto lg:pt-0">
          <SidebarPanel
            navTree={navTree}
            syncLabel={syncLabel}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>

      <main
        key={pathname}
        className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 animate-on-load sm:px-6 sm:py-8 lg:px-10"
      >
        {children}
      </main>
    </div>
  );
}
