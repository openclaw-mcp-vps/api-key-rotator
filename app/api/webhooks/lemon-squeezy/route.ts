import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { writeAuditLog } from "@/lib/audit-log";
import { upsertEntitlement, type Plan } from "@/lib/db";

function inferPlanFromAmount(amountInCents: number): { plan: Plan; projectsLimit: number } {
  if (amountInCents >= 5900) {
    return { plan: "unlimited", projectsLimit: -1 };
  }

  return { plan: "starter", projectsLimit: 5 };
}

async function handleStripeEvent(request: NextRequest, rawBody: string): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe signature or STRIPE_WEBHOOK_SECRET" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Invalid Stripe webhook signature", details: error instanceof Error ? error.message : "" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email;

    if (email) {
      const amount = session.amount_total ?? 1900;
      const planInfo = inferPlanFromAmount(amount);

      await upsertEntitlement({
        email,
        plan: planInfo.plan,
        projectsLimit: planInfo.projectsLimit,
        status: "active",
        purchasedAt: new Date().toISOString()
      });

      await writeAuditLog({
        action: "billing.entitlement_updated",
        actor: email,
        details: {
          source: "stripe",
          eventType: event.type,
          amount,
          plan: planInfo.plan,
          projectsLimit: planInfo.projectsLimit
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleLemonPayload(body: Record<string, unknown>): Promise<NextResponse> {
  const attributes = (body.data as { attributes?: Record<string, unknown> } | undefined)?.attributes;
  const eventName = String(body.meta && typeof body.meta === "object" && "event_name" in body.meta ? (body.meta as { event_name?: string }).event_name : "");

  if (eventName !== "order_created" || !attributes) {
    return NextResponse.json({ received: true });
  }

  const email = String(attributes.user_email ?? attributes.email ?? "").toLowerCase();
  const total = Number(attributes.total ?? attributes.total_usd ?? 1900);

  if (!email) {
    return NextResponse.json({ received: true });
  }

  const planInfo = inferPlanFromAmount(total);

  await upsertEntitlement({
    email,
    plan: planInfo.plan,
    projectsLimit: planInfo.projectsLimit,
    status: "active",
    purchasedAt: new Date().toISOString()
  });

  await writeAuditLog({
    action: "billing.entitlement_updated",
    actor: email,
    details: {
      source: "lemonsqueezy",
      eventType: eventName,
      total,
      plan: planInfo.plan,
      projectsLimit: planInfo.projectsLimit
    }
  });

  return NextResponse.json({ received: true });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (request.headers.get("stripe-signature")) {
    return handleStripeEvent(request, rawBody);
  }

  try {
    const json = JSON.parse(rawBody) as Record<string, unknown>;
    return handleLemonPayload(json);
  } catch {
    return NextResponse.json({ error: "Webhook body must be valid JSON when Stripe signature is not present" }, { status: 400 });
  }
}
