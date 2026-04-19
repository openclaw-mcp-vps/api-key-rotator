"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ClaimAccessForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/payments/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const payload = (await response.json()) as { message?: string; success?: boolean };

    if (response.ok && payload.success) {
      setMessage("Access granted. Redirecting to your dashboard...");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage(
      payload.message ??
        "No paid order found for that email yet. Complete checkout first, then try again."
    );
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <label className="block text-sm text-slate-300" htmlFor="claim-email">
        Purchase email
      </label>
      <input
        id="claim-email"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="founder@startup.com"
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Checking payment..." : "Unlock Dashboard"}
      </Button>
      {message ? <p className="text-sm text-slate-400">{message}</p> : null}
    </form>
  );
}
