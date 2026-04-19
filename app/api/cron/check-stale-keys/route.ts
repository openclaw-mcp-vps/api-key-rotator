import * as cronParser from "cron-parser";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { addAuditLog, getStaleKeys, refreshStaleKeyStatuses } from "@/lib/db/store";

function getNextRunIso(cronExpression: string): string | null {
  try {
    const module = cronParser as unknown as {
      parseExpression?: (expression: string) => { next: () => Date };
    };

    if (!module.parseExpression) {
      return null;
    }

    return module.parseExpression(cronExpression).next().toISOString();
  } catch {
    return null;
  }
}

async function sendStaleKeyAlert(staleCount: number): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_FROM_EMAIL || !process.env.ALERT_TO_EMAIL) {
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL,
    to: process.env.ALERT_TO_EMAIL,
    subject: `[API Key Rotator] ${staleCount} stale key${staleCount === 1 ? "" : "s"} detected`,
    html: `<p>${staleCount} key${staleCount === 1 ? " is" : "s are"} outside your configured rotation window.</p><p>Open the dashboard and run a rotation batch to restore compliance.</p>`
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const staleCount = await refreshStaleKeyStatuses();
  const staleKeys = await getStaleKeys();

  if (staleCount > 0) {
    await sendStaleKeyAlert(staleCount);
  }

  const cronExpression = process.env.STALE_KEY_CRON ?? "0 9 * * 1";
  const nextRun = getNextRunIso(cronExpression);

  await addAuditLog({
    action: "stale_key_check",
    actor: "cron",
    status: staleCount > 0 ? "warning" : "success",
    details: `Detected ${staleCount} stale keys. Next schedule: ${nextRun ?? "unknown"}.`
  });

  return NextResponse.json({
    staleCount,
    staleKeys: staleKeys.map((key) => ({
      keyId: key.id,
      projectId: key.projectId,
      keyName: key.keyName,
      provider: key.provider,
      lastRotatedAt: key.lastRotatedAt
    })),
    nextRun
  });
}
