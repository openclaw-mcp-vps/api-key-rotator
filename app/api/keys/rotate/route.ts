import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessClaimsFromRequest } from "@/lib/auth";
import { rotateKeys } from "@/lib/rotation";

const rotateSchema = z.object({
  keyIds: z.array(z.string().uuid()).optional(),
  projectId: z.string().uuid().optional(),
  onlyStale: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  const access = getAccessClaimsFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = rotateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const results = await rotateKeys({
    actor: access.email,
    keyIds: parsed.data.keyIds,
    projectId: parsed.data.projectId,
    onlyStale: parsed.data.onlyStale
  });

  return NextResponse.json({
    rotated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results
  });
}
