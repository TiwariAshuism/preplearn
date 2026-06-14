import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} PrepLearn. Built with Next.js.
        </p>
        <div className="flex gap-6">
          <Link
            href="/templates"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Templates
          </Link>
          <Link
            href="/templates/welcome"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Welcome
          </Link>
        </div>
      </div>
    </footer>
  );
}
