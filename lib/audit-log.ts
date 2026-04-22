import { appendAudit, listAudit } from "@/lib/db";

export async function writeAuditLog(input: {
  action: string;
  actor: string;
  projectId?: string | null;
  keyId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await appendAudit({
    action: input.action,
    actor: input.actor,
    projectId: input.projectId ?? null,
    keyId: input.keyId ?? null,
    details: input.details ?? {}
  });
}

export async function getRecentAuditLogs(limit = 200) {
  return listAudit(limit);
}
