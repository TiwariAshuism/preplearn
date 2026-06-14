"use client";

import { useState, type ReactNode } from "react";
import type { NavNode } from "../lib/types";
import { NavTree } from "./NavTree";
import { SearchTrigger } from "./SearchDialog";

type MobileSidebarProps = {
  navTree: NavNode[];
  syncLabel: string | null;
  children: React.ReactNode;
};

export function MobileSidebar({
  navTree,
  syncLabel,
  children,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col lg:flex-row">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
        >
          {open ? "Close menu" : "Menu"}
        </button>
        <SearchTrigger />
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } w-full shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950 lg:block lg:w-72 lg:border-b-0 lg:border-r`}
      >
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
        <div className="max-h-[50vh] overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
          <NavTree tree={navTree} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">{children}</main>
    </div>
  );
}
