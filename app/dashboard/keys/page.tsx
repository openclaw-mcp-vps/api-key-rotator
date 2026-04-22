import Link from "next/link";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { KeyStatus } from "@/components/dashboard/key-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAccessClaimsFromCookies } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { createKey, listKeys, listProjects, type Provider } from "@/lib/db";
import { encryptSecret } from "@/lib/encryption";
import { getKeyAgeInDays } from "@/lib/key-health";
import { rotateKeyById, rotateKeys } from "@/lib/rotation";

const keySchema = z.object({
  projectId: z.string().uuid(),
  provider: z.enum(["aws", "openai", "stripe"]),
  label: z.string().min(2).max(80),
  envVarName: z.string().min(2).max(80),
  secretValue: z.string().min(10),
  rotationIntervalDays: z.coerce.number().int().min(7).max(365)
});

async function createKeyAction(formData: FormData) {
  "use server";

  const access = await getAccessClaimsFromCookies();
  if (!access) {
    throw new Error("Missing paid access");
  }

  const parsed = keySchema.parse({
    projectId: formData.get("projectId"),
    provider: formData.get("provider"),
    label: formData.get("label"),
    envVarName: formData.get("envVarName"),
    secretValue: formData.get("secretValue"),
    rotationIntervalDays: formData.get("rotationIntervalDays")
  });

  const key = await createKey({
    projectId: parsed.projectId,
    provider: parsed.provider as Provider,
    label: parsed.label,
    envVarName: parsed.envVarName,
    encryptedValue: encryptSecret(parsed.secretValue),
    lastRotatedAt: new Date().toISOString(),
    rotationIntervalDays: parsed.rotationIntervalDays,
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/keys");
}

async function rotateSingleAction(formData: FormData) {
  "use server";

  const access = await getAccessClaimsFromCookies();
  if (!access) {
    throw new Error("Missing paid access");
  }

  const keyId = formData.get("keyId");
  if (typeof keyId !== "string") {
    throw new Error("Key ID is required");
  }

  await rotateKeyById({ keyId, actor: access.email });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/keys");
  revalidatePath("/dashboard/audit");
}

async function rotateAllStaleAction(formData: FormData) {
  "use server";

  const access = await getAccessClaimsFromCookies();
  if (!access) {
    throw new Error("Missing paid access");
  }

  const projectIdValue = formData.get("projectId");
  const projectId = typeof projectIdValue === "string" && projectIdValue.length > 0 ? projectIdValue : undefined;

  await rotateKeys({
    actor: access.email,
    projectId,
    onlyStale: true
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/keys");
  revalidatePath("/dashboard/audit");
}

interface KeysPageProps {
  searchParams?: Promise<{
    projectId?: string;
  }>;
}

export default async function KeysPage({ searchParams }: KeysPageProps) {
  const params = await searchParams;
  const selectedProjectId = params?.projectId;

  const [projects, keys] = await Promise.all([listProjects(), listKeys(selectedProjectId)]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add key</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createKeyAction} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Project</span>
              <select className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="projectId" required>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Provider</span>
              <select className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="provider" required>
                <option value="aws">AWS</option>
                <option value="openai">OpenAI</option>
                <option value="stripe">Stripe</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Key label</span>
              <input className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="label" required />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Env var name</span>
              <input className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="envVarName" placeholder="OPENAI_API_KEY" required />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Current secret value</span>
              <textarea className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[#0f1724] p-3" name="secretValue" required />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Rotation interval days</span>
              <input className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" defaultValue={90} min={7} name="rotationIntervalDays" required type="number" />
            </label>

            <button className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[#3f8cf5] md:col-span-2" type="submit">
              Save key
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Managed keys</CardTitle>
            <form action={rotateAllStaleAction}>
              <input name="projectId" type="hidden" value={selectedProjectId ?? ""} />
              <button className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] px-3 text-sm font-medium hover:bg-[#152132]" type="submit">
                Rotate all stale keys
              </button>
            </form>
          </div>
          <div className="flex flex-wrap gap-2 pt-3 text-xs text-[var(--muted)]">
            <Link className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#142133]" href="/dashboard/keys">
              All projects
            </Link>
            {projects.map((project) => (
              <Link
                key={project.id}
                className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#142133]"
                href={`/dashboard/keys?projectId=${project.id}`}
              >
                {project.name}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <p className="font-medium text-white">{key.label}</p>
                    <p className="text-xs text-[var(--muted)]">{key.envVarName}</p>
                  </TableCell>
                  <TableCell className="uppercase">{key.provider}</TableCell>
                  <TableCell>{getKeyAgeInDays(key)} days</TableCell>
                  <TableCell>
                    <KeyStatus keyRecord={key} />
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-[var(--muted)]">{key.notes}</TableCell>
                  <TableCell>
                    <form action={rotateSingleAction}>
                      <input name="keyId" type="hidden" value={key.id} />
                      <button className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[#1b2a3d]" type="submit">
                        Rotate
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {keys.length === 0 ? <p className="mt-4 text-sm text-[var(--muted)]">No keys configured yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
