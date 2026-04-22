import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessClaimsFromRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { createKey, listKeys } from "@/lib/db";
import { encryptSecret } from "@/lib/encryption";

const createKeySchema = z.object({
  projectId: z.string().uuid(),
  provider: z.enum(["aws", "openai", "stripe"]),
  label: z.string().min(2).max(80),
  envVarName: z.string().min(2).max(80),
  secretValue: z.string().min(10),
  rotationIntervalDays: z.number().int().min(7).max(365)
});

export async function GET(request: NextRequest) {
  const access = getAccessClaimsFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  const keys = await listKeys(projectId);

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const access = getAccessClaimsFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const key = await createKey({
    projectId: parsed.data.projectId,
    provider: parsed.data.provider,
    label: parsed.data.label,
    envVarName: parsed.data.envVarName,
    encryptedValue: encryptSecret(parsed.data.secretValue),
    lastRotatedAt: new Date().toISOString(),
    rotationIntervalDays: parsed.data.rotationIntervalDays,
    status: "healthy",
    notes: "Initial key captured securely"
  });

  await writeAuditLog({
    action: "key.created",
    actor: access.email,
    projectId: key.projectId,
    keyId: key.id,
    details: {
      provider: key.provider,
      envVarName: key.envVarName,
      rotationIntervalDays: key.rotationIntervalDays
    }
  });

  return NextResponse.json({ key }, { status: 201 });
}
