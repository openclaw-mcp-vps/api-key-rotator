import { addAuditLog, listKeys, listProjects, updateKeyRotation } from "@/lib/db/store";
import type { ApiKeyRecord, Project } from "@/lib/db/schema";
import { rotateAwsKey } from "@/lib/providers/aws";
import { rotateOpenAIKey } from "@/lib/providers/openai";
import { rotateStripeKey } from "@/lib/providers/stripe";
import { syncNetlifyEnvironmentVariable } from "@/lib/providers/netlify";
import { syncVercelEnvironmentVariable } from "@/lib/providers/vercel";

export interface RotateKeysInput {
  actor: string;
  projectIds?: string[];
}

export interface RotateKeysResult {
  rotated: number;
  failed: number;
  details: Array<{
    keyId: string;
    projectId: string;
    provider: ApiKeyRecord["provider"];
    status: "success" | "error";
    note: string;
  }>;
}

async function syncDeploymentValue(
  project: Project,
  keyName: string,
  keyValue: string
): Promise<string> {
  if (project.platform === "vercel") {
    const result = await syncVercelEnvironmentVariable({
      projectId: project.platformProjectId,
      keyName,
      keyValue
    });
    return result.message;
  }

  const result = await syncNetlifyEnvironmentVariable({
    siteId: project.platformProjectId,
    keyName,
    keyValue
  });
  return result.message;
}

async function rotateSingleKey(
  key: ApiKeyRecord,
  project: Project
): Promise<{ status: "success" | "error"; note: string; maskedValue?: string }> {
  if (key.provider === "aws") {
    const result = await rotateAwsKey({});
    if (!result.success) {
      return { status: "error", note: result.notes };
    }

    const syncNote = await syncDeploymentValue(project, key.keyName, result.newSecret);
    return { status: "success", note: `${result.notes} ${syncNote}`, maskedValue: result.maskedValue };
  }

  if (key.provider === "openai") {
    const result = await rotateOpenAIKey({});
    if (!result.success) {
      return { status: "error", note: result.notes };
    }

    const syncNote = await syncDeploymentValue(project, key.keyName, result.newSecret);
    return { status: "success", note: `${result.notes} ${syncNote}`, maskedValue: result.maskedValue };
  }

  const result = await rotateStripeKey();
  if (!result.success) {
    return { status: "error", note: result.notes };
  }

  const syncNote = await syncDeploymentValue(project, key.keyName, result.newSecret);
  return { status: "success", note: `${result.notes} ${syncNote}`, maskedValue: result.maskedValue };
}

export async function rotateKeys(input: RotateKeysInput): Promise<RotateKeysResult> {
  const projects = await listProjects();
  const keys = await listKeys();

  const projectLookup = new Map(projects.map((project) => [project.id, project]));
  const projectFilter = input.projectIds?.length ? new Set(input.projectIds) : null;

  const selectedKeys = keys.filter((key) =>
    projectFilter ? projectFilter.has(key.projectId) : true
  );

  const result: RotateKeysResult = {
    rotated: 0,
    failed: 0,
    details: []
  };

  for (const key of selectedKeys) {
    const project = projectLookup.get(key.projectId);
    if (!project) {
      result.failed += 1;
      result.details.push({
        keyId: key.id,
        projectId: key.projectId,
        provider: key.provider,
        status: "error",
        note: "Project missing from database."
      });
      continue;
    }

    const rotation = await rotateSingleKey(key, project);

    if (rotation.status === "success" && rotation.maskedValue) {
      await updateKeyRotation({
        keyId: key.id,
        maskedValue: rotation.maskedValue,
        status: "healthy",
        notes: rotation.note
      });

      result.rotated += 1;

      await addAuditLog({
        action: "key_rotated",
        actor: input.actor,
        status: "success",
        details: `${project.name}: rotated ${key.keyName}. ${rotation.note}`,
        projectId: project.id,
        provider: key.provider
      });
    } else {
      await updateKeyRotation({
        keyId: key.id,
        maskedValue: key.maskedValue,
        status: "error",
        notes: rotation.note
      });

      result.failed += 1;

      await addAuditLog({
        action: "key_rotation_failed",
        actor: input.actor,
        status: "error",
        details: `${project.name}: failed to rotate ${key.keyName}. ${rotation.note}`,
        projectId: project.id,
        provider: key.provider
      });
    }

    result.details.push({
      keyId: key.id,
      projectId: key.projectId,
      provider: key.provider,
      status: rotation.status,
      note: rotation.note
    });
  }

  await addAuditLog({
    action: "rotation_batch_completed",
    actor: input.actor,
    status: result.failed > 0 ? "warning" : "success",
    details: `Batch completed: ${result.rotated} rotated, ${result.failed} failed.`
  });

  return result;
}
