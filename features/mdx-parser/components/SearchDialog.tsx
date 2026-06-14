"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SearchEntry } from "../lib/search";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setIndex(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results =
    query.trim().length < 2
      ? []
      : index
          .filter((e) => {
            const q = query.toLowerCase();
            return (
              e.title.toLowerCase().includes(q) ||
              e.excerpt.toLowerCase().includes(q) ||
              e.collection.toLowerCase().includes(q)
            );
          })
          .slice(0, 12);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-start justify-center bg-black/40 p-3 pt-[10vh] motion-reduce:animate-none sm:p-4 sm:pt-[15vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[min(80vh,32rem)] w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl animate-scale-in motion-reduce:animate-none dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roadmaps… (Ctrl+K)"
          className="w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-zinc-700"
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && query.length >= 2 && (
            <li className="px-4 py-3 text-sm text-zinc-500">No results</li>
          )}
          {results.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                onClick={onClose}
                className="block px-4 py-2 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {r.title}
                </span>
                <span className="block text-xs text-zinc-500">{r.collection}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type SearchTriggerProps = {
  compact?: boolean;
};

export function SearchTrigger({ compact = false }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search roadmaps"
        className={
          compact
            ? "inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white p-2 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
            : "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
        }
      >
        {compact ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        ) : (
          <>
            Search… <kbd className="float-right text-zinc-400">⌘K</kbd>
          </>
        )}
      </button>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
