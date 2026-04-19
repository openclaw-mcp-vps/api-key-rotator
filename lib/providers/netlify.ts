import { createHmac, timingSafeEqual } from "node:crypto";
import type { DeploymentSyncResult } from "@/lib/providers/types";

export async function syncNetlifyEnvironmentVariable(params: {
  siteId: string;
  keyName: string;
  keyValue: string;
}): Promise<DeploymentSyncResult> {
  const token = process.env.NETLIFY_TOKEN;

  if (!token) {
    return {
      synced: false,
      message: "NETLIFY_TOKEN not set; skipped Netlify env update."
    };
  }

  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${params.siteId}/env`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: params.keyName,
          values: [{ value: params.keyValue, context: "all" }]
        })
      }
    );

    if (!response.ok) {
      const message = await response.text();
      return {
        synced: false,
        message: `Netlify API rejected env update: ${message}`
      };
    }

    return {
      synced: true,
      message: `Updated ${params.keyName} in Netlify site ${params.siteId}.`
    };
  } catch (error) {
    return {
      synced: false,
      message: `Netlify sync error: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}

export function verifyNetlifyWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.NETLIFY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(
    signatureHeader.replace("sha256=", "").trim(),
    "hex"
  );

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
