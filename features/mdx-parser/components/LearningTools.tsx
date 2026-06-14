"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PageLink } from "../lib/types";

type ChecklistProps = {
  items: string[];
  storageKey: string;
};

export function Checklist({ items, storageKey }: ChecklistProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw) as Record<number, boolean>);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle(index: number) {
    setChecked((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Completion checklist
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => toggle(i)}
              className="mt-1 rounded border-zinc-300"
            />
            <span
              className={
                checked[i]
                  ? "text-zinc-500 line-through dark:text-zinc-500"
                  : "text-zinc-700 dark:text-zinc-300"
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ProgressTrackerProps = {
  collectionKey: string;
  phases: PageLink[];
  currentHref: string;
};

export function ProgressTracker({
  collectionKey,
  phases,
  currentHref,
}: ProgressTrackerProps) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`preplearn:progress:${collectionKey}`);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, [collectionKey]);

  function toggle(href: string) {
    setDone((prev) => {
      const next = { ...prev, [href]: !prev[href] };
      localStorage.setItem(
        `preplearn:progress:${collectionKey}`,
        JSON.stringify(next),
      );
      return next;
    });
  }

  if (phases.length === 0) return null;

  const completed = phases.filter((p) => done[p.href]).length;

  return (
    <details className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Progress · {completed}/{phases.length} phases
      </summary>
      <ul className="space-y-1 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {phases.map((phase) => (
          <li key={phase.href} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!done[phase.href]}
              onChange={() => toggle(phase.href)}
              className="rounded border-zinc-300"
            />
            <Link
              href={phase.href}
              className={
                phase.href === currentHref
                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-600 hover:underline dark:text-zinc-400"
              }
            >
              {phase.title.replace(/^[^\w\s]+\s*/, "").slice(0, 48)}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
