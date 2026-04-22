"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck, TimerReset, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export function Hero() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function unlockAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/paywall/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Could not unlock access for that email.");
        return;
      }

      setMessage(payload.message ?? "Access unlocked. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-24 md:px-10 md:pt-28">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[#141f2d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            security-ops for startup teams
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            API Key Rotator: one dashboard to rotate AWS, OpenAI, and Stripe keys across every project.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            SOC2 asks for quarterly key rotation. Doing it manually in 10 projects burns two hours each cycle. API Key Rotator executes the workflow in minutes, records every action, and flags stale credentials before audits do.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={paymentLink}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#3f8cf5]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Buy on Stripe
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-md border border-[var(--border)] px-5 text-sm font-semibold hover:bg-[#152132]">
              Open dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[#111b2a] p-4">
              <TimerReset className="h-5 w-5 text-[var(--brand)]" />
              <p className="mt-2 text-sm font-medium">Rotate in one click</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[#111b2a] p-4">
              <ShieldCheck className="h-5 w-5 text-[var(--success)]" />
              <p className="mt-2 text-sm font-medium">SOC2-ready audit history</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[#111b2a] p-4">
              <Zap className="h-5 w-5 text-[var(--warning)]" />
              <p className="mt-2 text-sm font-medium">Stale key alerts</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unlock dashboard after checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Use the same purchase email from Stripe. We verify active subscription entitlement and set your secure access cookie.
            </p>
            <form className="space-y-3" onSubmit={unlockAccess}>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Purchase email</span>
                <input
                  className="h-11 w-full rounded-md border border-[var(--border)] bg-[#0b1522] px-3 text-sm outline-none ring-[var(--brand)] placeholder:text-[#607389] focus:ring-2"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? "Checking purchase..." : "Unlock My Access"}
              </Button>
              {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
