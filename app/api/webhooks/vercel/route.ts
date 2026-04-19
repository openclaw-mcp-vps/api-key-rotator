import { NextResponse } from "next/server";
import { addAuditLog } from "@/lib/db/store";
import { verifyVercelWebhook } from "@/lib/providers/vercel";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-vercel-signature");

  if (process.env.VERCEL_WEBHOOK_SECRET && !verifyVercelWebhook(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    type?: string;
    project?: { name?: string; id?: string };
    deployment?: { url?: string; state?: string };
  };

  await addAuditLog({
    action: "vercel_webhook",
    actor: "vercel",
    status: payload.deployment?.state === "READY" ? "success" : "info",
    details: `Event ${payload.type ?? "unknown"} for ${payload.project?.name ?? payload.project?.id ?? "project"} (${payload.deployment?.url ?? "no url"}).`
  });

  return NextResponse.json({ ok: true });
}
