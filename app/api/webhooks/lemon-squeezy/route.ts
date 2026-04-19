import { NextResponse } from "next/server";
import { addAuditLog } from "@/lib/db/store";
import {
  handleLemonWebhookEvent,
  verifyLemonWebhookSignature
} from "@/lib/payments";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
    data?: { attributes?: { user_email?: string } };
  };

  await handleLemonWebhookEvent(payload);

  await addAuditLog({
    action: "payment_webhook",
    actor: "lemon_squeezy",
    status: "success",
    details: `Processed ${payload.meta?.event_name ?? "unknown_event"} for ${payload.data?.attributes?.user_email ?? "unknown email"}.`
  });

  return NextResponse.json({ ok: true });
}
