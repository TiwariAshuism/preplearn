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
      <div className="mb-4 hidden md:block">
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
        className="overflow-y-auto md:max-h-[calc(100dvh-8rem)]"
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
    <div className="flex min-h-dvh flex-col md:flex-row">
      <div className="safe-top sticky top-0 z-40 flex items-center gap-2.5 border-b border-zinc-200 bg-zinc-50/95 px-[max(var(--page-gutter),var(--safe-left))] py-3 backdrop-blur-sm min-[390px]:gap-3 min-[390px]:py-3.5 md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-doc-nav"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition-transform duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
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
          className="flex min-w-0 flex-1 items-center gap-2.5 truncate"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white min-[390px]:h-9 min-[390px]:w-9">
            P
          </span>
          <span className="truncate text-sm font-semibold text-zinc-900 min-[390px]:text-base dark:text-zinc-50">
            PrepLearn
          </span>
        </Link>

        <SearchTrigger compact />
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in motion-reduce:animate-none md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="mobile-doc-nav"
        className={`safe-top fixed inset-y-0 left-0 z-50 flex w-[min(92vw,20rem)] flex-col border-r border-zinc-200 bg-zinc-50 px-4 py-6 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none min-[390px]:w-[min(88vw,22rem)] min-[428px]:px-5 dark:border-zinc-800 dark:bg-zinc-950 md:static md:z-auto md:block md:w-64 md:shrink-0 md:translate-x-0 md:border-r md:border-zinc-200 md:bg-zinc-50 md:px-4 md:py-6 md:shadow-none lg:w-72 xl:w-80 xl:px-5 2xl:w-[21rem] 2xl:px-6 dark:md:border-zinc-800 dark:md:bg-zinc-950 ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none md:pointer-events-auto"
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto md:pt-0">
          <SidebarPanel
            navTree={navTree}
            syncLabel={syncLabel}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>

      <main
        key={pathname}
        className="page-gutter-x min-w-0 flex-1 overflow-x-hidden py-6 animate-on-load min-[390px]:py-7 min-[428px]:py-8 md:px-8 lg:px-10 xl:px-12 2xl:px-16"
      >
        <div className="doc-reading-shell">
          {children}
        </div>
      </main>
    </div>
  );
}
