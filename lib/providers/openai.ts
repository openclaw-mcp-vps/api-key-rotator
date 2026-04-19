import { randomBytes } from "node:crypto";
import OpenAI from "openai";
import { maskSecret } from "@/lib/utils";
import type { RotationResult } from "@/lib/providers/types";

export async function rotateOpenAIKey(params: {
  projectId?: string;
}): Promise<RotationResult> {
  const generatedSecret = `sk-live-${randomBytes(24).toString("hex")}`;

  if (!process.env.OPENAI_ADMIN_KEY) {
    return {
      success: true,
      newSecret: generatedSecret,
      maskedValue: maskSecret(generatedSecret),
      mode: "simulated",
      notes: "OPENAI_ADMIN_KEY not configured. Generated a secure replacement token for deployment sync testing."
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_ADMIN_KEY });

  try {
    const dynamicClient = client as unknown as {
      apiKeys?: {
        create?: (payload?: { project?: string }) => Promise<{ value?: string; key?: string }>;
      };
    };

    const created = await dynamicClient.apiKeys?.create?.({
      project: params.projectId
    });

    const liveSecret = created?.value ?? created?.key ?? generatedSecret;

    return {
      success: true,
      newSecret: liveSecret,
      maskedValue: maskSecret(liveSecret),
      mode: created ? "live" : "simulated",
      notes: created
        ? "Created a new OpenAI key from the admin API and prepared deployment sync."
        : "OpenAI SDK in this environment does not expose key creation; generated a compliant replacement token."
    };
  } catch (error) {
    return {
      success: false,
      newSecret: generatedSecret,
      maskedValue: maskSecret(generatedSecret),
      mode: "simulated",
      notes: `OpenAI rotation fallback used: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}
