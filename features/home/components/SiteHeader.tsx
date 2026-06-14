import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            P
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
            PrepLearn
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-6">
          <Link
            href="/templates"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Roadmaps
          </Link>
          <Link
            href="/templates"
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:px-4 sm:py-2 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start learning</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
