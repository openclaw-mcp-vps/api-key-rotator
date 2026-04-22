import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export function Pricing() {
  return (
    <section className="px-6 py-16 md:px-10" id="pricing">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Pricing built for SOC2 momentum</h2>
          <p className="mt-3 text-[var(--muted)]">
            Start with founder-level coverage, then scale to unlimited projects when compliance expands across teams.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>$19/month — Starter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--muted)]">For solo founders preparing their first SOC2 cycle.</p>
              <ul className="space-y-2 text-sm text-[var(--text)]">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Up to 5 projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />AWS, OpenAI, Stripe key workflows</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Vercel + Netlify deployment sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Stale key alerts and audit log exports</li>
              </ul>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[#3f8cf5]"
                href={paymentLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                Buy Starter
              </a>
            </CardContent>
          </Card>

          <Card className="border-[var(--brand-soft)]">
            <CardHeader>
              <CardTitle>$59/month — Unlimited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--muted)]">For CTOs standardizing key rotation across multi-product teams.</p>
              <ul className="space-y-2 text-sm text-[var(--text)]">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Unlimited projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Bulk rotate all stale keys</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Compliance-ready audit timeline</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--success)]" />Priority support and onboarding help</li>
              </ul>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-[#0d1117] hover:bg-[#e8edf3]"
                href={paymentLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                Buy Unlimited
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[#111b2a] p-6">
          <h3 className="text-xl font-semibold text-white">FAQ</h3>
          <div className="mt-4 space-y-4 text-sm text-[var(--muted)]">
            <div>
              <p className="font-semibold text-[var(--text)]">How does access unlock after payment?</p>
              <p>Stripe webhook events create your entitlement. Enter the purchase email in the unlock panel and we set your secure dashboard cookie.</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can I run rotation manually before an audit window?</p>
              <p>Yes. Trigger single-key or project-wide rotation anytime. Every run writes to the audit stream with timestamps and outcome details.</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">What if a provider API call fails?</p>
              <p>Failed attempts are logged with error metadata, key status moves to error, and your previous encrypted key value remains intact for rollback.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
