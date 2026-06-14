"use client";

import { AnimateIn } from "@/features/ui/components/AnimateIn";

const steps = [
  {
    number: "01",
    title: "Choose a phase",
    description:
      "Start with foundations or jump to the phase that matches your current level.",
  },
  {
    number: "02",
    title: "Read & build",
    description:
      "Each page covers topics, projects, and real-world patterns used in production systems.",
  },
  {
    number: "03",
    title: "Track progress",
    description:
      "Work through days in order — each phase builds on the last until you're interview-ready.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <AnimateIn>
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            A structured path, not random tutorials
          </h2>
        </AnimateIn>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <AnimateIn key={step.number} delay={index * 100}>
              <div className="relative">
                <span className="font-mono text-4xl font-bold text-zinc-200 dark:text-zinc-800">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
