import Link from "next/link";
import { AlertTriangle, ArrowRightLeft, ClipboardCheck, Layers3 } from "lucide-react";

import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";

export default function HomePage() {
  return (
    <main>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border)] bg-[rgba(13,17,23,0.85)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
          <Link className="font-display text-lg font-bold text-white" href="/">
            API Key Rotator
          </Link>
          <Link className="text-sm font-semibold text-[var(--muted)] hover:text-white" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </header>

      <Hero />

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[#111b2a] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Problem</p>
            <h2 className="font-display text-2xl font-semibold text-white">Manual rotations break under startup pressure</h2>
            <ul className="mt-5 space-y-3 text-sm text-[var(--muted)]">
              <li className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--warning)]" />Secrets live in multiple cloud accounts and deployment tools.</li>
              <li className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--warning)]" />Rotations get delayed and keys drift past policy windows.</li>
              <li className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--warning)]" />Audit prep becomes manual screenshot collection before every review.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[#111b2a] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Solution</p>
            <h2 className="font-display text-2xl font-semibold text-white">One control plane for rotation, tracking, and proof</h2>
            <ul className="mt-5 space-y-3 text-sm text-[var(--muted)]">
              <li className="flex gap-3"><ArrowRightLeft className="mt-0.5 h-4 w-4 text-[var(--brand)]" />Rotate individual keys or stale batches in a single action.</li>
              <li className="flex gap-3"><Layers3 className="mt-0.5 h-4 w-4 text-[var(--brand)]" />Sync new values into Vercel or Netlify project environment variables.</li>
              <li className="flex gap-3"><ClipboardCheck className="mt-0.5 h-4 w-4 text-[var(--brand)]" />Preserve a timestamped audit log for SOC2 evidence collection.</li>
            </ul>
          </div>
        </div>
      </section>

      <Pricing />
    </main>
  );
}
