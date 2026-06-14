"use client";

import { useEffect } from "react";

export function CodeBlockCopy() {
  useEffect(() => {
    const pres = document.querySelectorAll(".mdx-prose pre");
    pres.forEach((pre) => {
      if (pre.querySelector("[data-copy-btn]")) return;
      pre.classList.add("group/code", "relative");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-copy-btn", "true");
      btn.className =
        "absolute right-2 top-2 rounded-md border border-zinc-600/50 bg-zinc-800/90 px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover/code:opacity-100";
      btn.textContent = "Copy";

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 1500);
      });

      pre.appendChild(btn);
    });
  }, []);

  return null;
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
    >
      Save as PDF
    </button>
  );
}
