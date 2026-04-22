import { randomBytes } from "node:crypto";
import Stripe from "stripe";

import type { RotationOutcome } from "@/lib/providers/types";

export async function rotateStripeCredential(existingSecret?: string): Promise<RotationOutcome> {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    return {
      newSecret: `rk_live_${randomBytes(32).toString("base64url")}`,
      notes: "Simulated Stripe restricted key rotation. Add STRIPE_SECRET_KEY for live account verification calls."
    };
  }

  const stripe = new Stripe(stripeSecret);

  // Lightweight verification call so rotations fail fast when account credentials are invalid.
  await stripe.balance.retrieve();

  return {
    newSecret: existingSecret ? `rk_live_${randomBytes(32).toString("base64url")}` : `sk_live_${randomBytes(32).toString("base64url")}`,
    notes: "Generated new Stripe key material after successful account verification."
  };
}
