import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="page-gutter-x safe-bottom site-container flex flex-col items-center justify-between gap-4 py-10 min-[390px]:py-12 sm:flex-row">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} PrepLearn — structured paths for engineers.
        </p>
        <div className="flex gap-6">
          <Link
            href="/templates"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            All roadmaps
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Home
          </Link>
        </div>
      </div>
    </footer>
  );
}
