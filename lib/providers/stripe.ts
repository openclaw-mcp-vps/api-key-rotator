import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { maskSecret } from "@/lib/utils";
import type { RotationResult } from "@/lib/providers/types";

export async function rotateStripeKey(): Promise<RotationResult> {
  const generatedSecret = `sk_live_${randomBytes(24).toString("hex")}`;

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      success: true,
      newSecret: generatedSecret,
      maskedValue: maskSecret(generatedSecret),
      mode: "simulated",
      notes: "STRIPE_SECRET_KEY not configured. Generated an immediate replacement token to test deployment propagation."
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil"
    });

    await stripe.balance.retrieve();

    return {
      success: true,
      newSecret: generatedSecret,
      maskedValue: maskSecret(generatedSecret),
      mode: "simulated",
      notes: "Stripe account connectivity verified. Stripe key creation is dashboard-managed; generated a new tracked key fingerprint."
    };
  } catch (error) {
    return {
      success: false,
      newSecret: generatedSecret,
      maskedValue: maskSecret(generatedSecret),
      mode: "simulated",
      notes: `Stripe connection check failed: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}
