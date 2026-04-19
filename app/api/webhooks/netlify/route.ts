import { NextResponse } from "next/server";
import { addAuditLog } from "@/lib/db/store";
import { verifyNetlifyWebhook } from "@/lib/providers/netlify";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-netlify-signature");

  if (process.env.NETLIFY_WEBHOOK_SECRET && !verifyNetlifyWebhook(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    name?: string;
    id?: string;
    state?: string;
    url?: string;
  };

  await addAuditLog({
    action: "netlify_webhook",
    actor: "netlify",
    status: payload.state === "ready" ? "success" : "info",
    details: `Deploy ${payload.name ?? payload.id ?? "unknown"} in state ${payload.state ?? "unknown"} (${payload.url ?? "no url"}).`
  });

  return NextResponse.json({ ok: true });
}
