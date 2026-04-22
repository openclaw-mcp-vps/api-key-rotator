import { encryptSecret, decryptSecret } from "@/lib/encryption";
import { getDerivedStatus, isKeyStale } from "@/lib/key-health";
import { writeAuditLog } from "@/lib/audit-log";
import { getKeyById, getProjectById, listKeys, updateKey } from "@/lib/db";
import { rotateAwsCredential } from "@/lib/providers/aws";
import { syncNetlifyEnvVar } from "@/lib/providers/netlify";
import { rotateOpenAICredential } from "@/lib/providers/openai";
import { rotateStripeCredential } from "@/lib/providers/stripe";
import { syncVercelEnvVar } from "@/lib/providers/vercel";

export interface RotationResult {
  keyId: string;
  provider: "aws" | "openai" | "stripe";
  ok: boolean;
  message: string;
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected rotation failure";
}

async function pushToDeploymentPlatform(input: {
  platform: "vercel" | "netlify";
  platformProjectId: string;
  envVarName: string;
  newSecret: string;
}): Promise<string> {
  if (input.platform === "vercel") {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return "Skipped Vercel sync because VERCEL_TOKEN is not configured.";
    }

    await syncVercelEnvVar({
      token,
      projectId: input.platformProjectId,
      key: input.envVarName,
      value: input.newSecret
    });

    return "Pushed new value to Vercel environments.";
  }

  const token = process.env.NETLIFY_TOKEN;
  if (!token) {
    return "Skipped Netlify sync because NETLIFY_TOKEN is not configured.";
  }

  await syncNetlifyEnvVar({
    token,
    siteId: input.platformProjectId,
    key: input.envVarName,
    value: input.newSecret
  });

  return "Pushed new value to Netlify environments.";
}

async function rotateSecretForProvider(provider: "aws" | "openai" | "stripe", existingSecret: string): Promise<{ newSecret: string; notes: string }> {
  if (provider === "aws") {
    return rotateAwsCredential(existingSecret);
  }

  if (provider === "openai") {
    return rotateOpenAICredential();
  }

  return rotateStripeCredential(existingSecret);
}

export async function rotateKeyById(input: { keyId: string; actor: string }): Promise<RotationResult> {
  const key = await getKeyById(input.keyId);

  if (!key) {
    return {
      keyId: input.keyId,
      provider: "openai",
      ok: false,
      message: "Key not found"
    };
  }

  const project = await getProjectById(key.projectId);

  if (!project) {
    await updateKey(key.id, {
      status: "error",
      notes: "Rotation failed because project reference is missing"
    });

    return {
      keyId: key.id,
      provider: key.provider,
      ok: false,
      message: "Project not found"
    };
  }

  try {
    const existingSecret = decryptSecret(key.encryptedValue);
    const rotated = await rotateSecretForProvider(key.provider, existingSecret);
    const deploySyncNote = await pushToDeploymentPlatform({
      platform: project.platform,
      platformProjectId: project.platformProjectId,
      envVarName: key.envVarName,
      newSecret: rotated.newSecret
    });

    const now = new Date().toISOString();
    await updateKey(key.id, {
      encryptedValue: encryptSecret(rotated.newSecret),
      lastRotatedAt: now,
      status: "healthy",
      notes: `${rotated.notes} ${deploySyncNote}`.trim()
    });

    await writeAuditLog({
      action: "key.rotated",
      actor: input.actor,
      projectId: project.id,
      keyId: key.id,
      details: {
        provider: key.provider,
        envVarName: key.envVarName,
        platform: project.platform,
        platformProjectId: project.platformProjectId
      }
    });

    return {
      keyId: key.id,
      provider: key.provider,
      ok: true,
      message: `${rotated.notes} ${deploySyncNote}`.trim()
    };
  } catch (error) {
    const message = asErrorMessage(error);

    await updateKey(key.id, {
      status: "error",
      notes: message
    });

    await writeAuditLog({
      action: "key.rotation_failed",
      actor: input.actor,
      projectId: key.projectId,
      keyId: key.id,
      details: {
        error: message
      }
    });

    return {
      keyId: key.id,
      provider: key.provider,
      ok: false,
      message
    };
  }
}

export async function rotateKeys(input: {
  actor: string;
  keyIds?: string[];
  projectId?: string;
  onlyStale?: boolean;
}): Promise<RotationResult[]> {
  const allKeys = await listKeys(input.projectId);
  const selected = input.keyIds?.length ? allKeys.filter((key) => input.keyIds?.includes(key.id)) : allKeys;
  const candidates = input.onlyStale ? selected.filter(isKeyStale) : selected;

  const output: RotationResult[] = [];

  for (const key of candidates) {
    output.push(await rotateKeyById({ keyId: key.id, actor: input.actor }));
  }

  return output;
}

export async function summarizeKeyHealth(input?: { projectId?: string }): Promise<{ total: number; stale: number; error: number }> {
  const keys = await listKeys(input?.projectId);

  let stale = 0;
  let error = 0;

  for (const key of keys) {
    const status = getDerivedStatus(key);
    if (status === "stale") {
      stale += 1;
    }
    if (status === "error") {
      error += 1;
    }
  }

  return {
    total: keys.length,
    stale,
    error
  };
}
