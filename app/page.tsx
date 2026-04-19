import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimAccessForm } from "@/components/claim-access-form";
import { getCheckoutUrl, hasPaidSessionCookie } from "@/lib/payments";

const faqs = [
  {
    question: "How does one-click rotation work across multiple projects?",
    answer:
      "You define each project once, including where its environment variables live. During a rotation run, the app generates fresh key material per provider, writes updated secrets into Vercel or Netlify, and records a signed audit event." 
  },
  {
    question: "Can I prove SOC2 rotation cadence to auditors?",
    answer:
      "Yes. Every rotation attempt is logged with timestamp, actor, target project, provider, and result. You can show stale-key checks and batch rotation history directly from the audit page."
  },
  {
    question: "Do you support teams with mixed deployment stacks?",
    answer:
      "Yes. A single dashboard can track projects deployed on both Vercel and Netlify while rotating AWS, OpenAI, and Stripe credentials under a unified policy."
  },
  {
    question: "What happens if a provider API call fails mid-rotation?",
    answer:
      "The run continues for remaining keys, marks failures explicitly, and writes detailed remediation notes to the audit trail so your team can resolve only what failed."
  }
];

export default async function LandingPage() {
  const [checkoutUrl, hasAccess] = await Promise.all([
    getCheckoutUrl(),
    hasPaidSessionCookie()
  ]);

  return (
    <main className="pattern-grid">
      <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 md:px-10">
        <header className="mb-16 flex items-center justify-between">
          <p className="text-lg font-semibold tracking-tight text-cyan-300">API Key Rotator</p>
          {hasAccess ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <a href="#pricing" className="text-sm font-semibold text-slate-300 hover:text-cyan-300">
              Pricing
            </a>
          )}
        </header>

        <section className="grid gap-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-12">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Security Ops for Lean Teams
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
              Rotate AWS, OpenAI, and Stripe keys across every project in minutes.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              SOC2 asks for quarterly key rotation. This dashboard turns a two-hour chore into one tracked run with deployment sync, stale-key alerts, and an audit log your compliance reviewer can trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={checkoutUrl}
                className="lemonsqueezy-button"
                data-ls-modal="true"
                data-ls-overlay="true"
              >
                <Button size="lg" className="gap-2">
                  Start Secure Rotation <ArrowRight size={16} />
                </Button>
              </a>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  View Product Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No migration project. Connect Vercel/Netlify + AWS and run your first rotation today.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
            <h2 className="text-base font-semibold text-slate-100">What this replaces</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-300">
              <li className="flex gap-3">
                <Clock3 className="mt-0.5 text-rose-300" size={18} />
                Manual key rotation across 10 projects every quarter.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 text-amber-300" size={18} />
                Spreadsheet-based evidence collection for auditors.
              </li>
              <li className="flex gap-3">
                <Zap className="mt-0.5 text-cyan-300" size={18} />
                Risky copy/paste secret changes under deadline pressure.
              </li>
            </ul>

            {!hasAccess ? (
              <div className="mt-6 border-t border-slate-800 pt-6">
                <p className="text-sm text-slate-300">
                  Already completed checkout? Claim dashboard access instantly.
                </p>
                <ClaimAccessForm />
              </div>
            ) : (
              <div className="mt-6 border-t border-slate-800 pt-6">
                <p className="text-sm text-emerald-300">Access active for this browser.</p>
                <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                  Open dashboard
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold text-slate-100">The SOC2 rotation workflow, simplified</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">1. Connect</p>
              <p className="mt-3 text-sm text-slate-300">
                Add project deployment IDs for Vercel or Netlify and define your AWS/OpenAI/Stripe key inventory.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">2. Rotate</p>
              <p className="mt-3 text-sm text-slate-300">
                Run a single rotation batch. The platform updates key records, syncs deployment environment values, and flags any failures.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">3. Prove</p>
              <p className="mt-3 text-sm text-slate-300">
                Export-ready audit history plus stale-key alerts show that quarterly controls are active and continuously monitored.
              </p>
            </article>
          </div>
        </section>

        <section id="pricing" className="mt-20 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7">
            <h3 className="text-xl font-semibold text-slate-100">Starter</h3>
            <p className="mt-2 text-sm text-slate-400">For solo founders pursuing SOC2 quickly.</p>
            <p className="mt-4 text-3xl font-semibold text-slate-100">$19<span className="text-base text-slate-400">/mo</span></p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-300" />Up to 5 projects</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-300" />Quarterly stale-key reminders</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-300" />Audit log with provider-level detail</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-cyan-400/50 bg-cyan-400/10 p-7">
            <h3 className="text-xl font-semibold text-slate-100">Scale</h3>
            <p className="mt-2 text-sm text-slate-300">For CTOs operating multiple product surfaces.</p>
            <p className="mt-4 text-3xl font-semibold text-slate-100">$59<span className="text-base text-slate-400">/mo</span></p>
            <ul className="mt-5 space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-300" />Unlimited projects</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-300" />Batch rotation across all environments</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-300" />Priority support for compliance deadlines</li>
            </ul>
            <a
              href={checkoutUrl}
              className="lemonsqueezy-button mt-6 inline-flex"
              data-ls-modal="true"
              data-ls-overlay="true"
            >
              <Button className="w-full">Choose Scale Plan</Button>
            </a>
          </article>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold text-slate-100">FAQ</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="text-base font-semibold text-slate-100">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
