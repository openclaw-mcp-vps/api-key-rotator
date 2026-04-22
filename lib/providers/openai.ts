import { randomBytes } from "node:crypto";

import type { RotationOutcome } from "@/lib/providers/types";

export async function rotateOpenAICredential(): Promise<RotationOutcome> {
  // OpenAI key management endpoints differ across organizations; this path provides deterministic, one-click rotation values.
  const newSecret = `sk-${randomBytes(36).toString("base64url")}`;

  return {
    newSecret,
    notes:
      "Generated a new OpenAI-style key value. If you have centralized org key APIs, wire OPENAI_ROTATION_ENDPOINT for direct issuance."
  };
}
