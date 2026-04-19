import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import type { DeploymentSyncResult } from "@/lib/providers/types";

export async function syncVercelEnvironmentVariable(params: {
  projectId: string;
  keyName: string;
  keyValue: string;
}): Promise<DeploymentSyncResult> {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    return {
      synced: false,
      message: "VERCEL_TOKEN not set; skipped Vercel env update."
    };
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${params.projectId}/env`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: params.keyName,
          value: params.keyValue,
          type: "encrypted",
          target: ["production", "preview", "development"]
        })
      }
    );

    if (!response.ok) {
      const message = await response.text();
      return {
        synced: false,
        message: `Vercel API rejected env update: ${message}`
      };
    }

    return {
      synced: true,
      message: `Updated ${params.keyName} in Vercel project ${params.projectId}.`
    };
  } catch (error) {
    return {
      synced: false,
      message: `Vercel sync error: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}

export function verifyVercelWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signatureHeader.trim(), "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export type VercelWebhookRequest = VercelRequest;
