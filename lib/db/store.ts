import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { differenceInDays } from "date-fns";
import {
  DEFAULT_ROTATION_INTERVAL_DAYS
} from "@/lib/constants";
import {
  type ApiKeyRecord,
  type AppDatabase,
  type AuditLogRecord,
  type DashboardOverview,
  type PlatformName,
  type Project,
  type ProviderName,
  providerNames
} from "@/lib/db/schema";

const DB_FILE =
  process.env.DATA_FILE_PATH ??
  path.join(process.cwd(), ".data", "api-key-rotator.json");

let mutationQueue: Promise<void> = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

function buildSeedDatabase(): AppDatabase {
  const createdAt = nowIso();
  const daysAgo = (days: number): string =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const projects: Project[] = [
    {
      id: randomUUID(),
      name: "Customer Portal",
      description: "Public-facing app deployed on Vercel with OpenAI-powered support answers.",
      platform: "vercel",
      platformProjectId: "customer-portal-prod",
      createdAt,
      updatedAt: createdAt
    },
    {
      id: randomUUID(),
      name: "Billing API",
      description: "Internal billing service deployed on Netlify functions.",
      platform: "netlify",
      platformProjectId: "billing-api-prod",
      createdAt,
      updatedAt: createdAt
    }
  ];

  const keys: ApiKeyRecord[] = projects.flatMap((project, index) => [
    {
      id: randomUUID(),
      projectId: project.id,
      provider: "aws",
      keyName: "AWS_ACCESS_KEY_ID",
      maskedValue: "AKIA••••••••9A7P",
      status: index === 0 ? "stale" : "healthy",
      rotationIntervalDays: DEFAULT_ROTATION_INTERVAL_DAYS,
      lastRotatedAt: index === 0 ? daysAgo(119) : daysAgo(35),
      notes: "IAM user scoped to deployment automation only.",
      createdAt,
      updatedAt: createdAt
    },
    {
      id: randomUUID(),
      projectId: project.id,
      provider: "openai",
      keyName: "OPENAI_API_KEY",
      maskedValue: "sk-l••••••••q8uQ",
      status: index === 0 ? "stale" : "healthy",
      rotationIntervalDays: DEFAULT_ROTATION_INTERVAL_DAYS,
      lastRotatedAt: index === 0 ? daysAgo(104) : daysAgo(16),
      notes: "Used for support chatbot completions.",
      createdAt,
      updatedAt: createdAt
    },
    {
      id: randomUUID(),
      projectId: project.id,
      provider: "stripe",
      keyName: "STRIPE_SECRET_KEY",
      maskedValue: "sk_l••••••••9N5X",
      status: "healthy",
      rotationIntervalDays: DEFAULT_ROTATION_INTERVAL_DAYS,
      lastRotatedAt: index === 0 ? daysAgo(22) : daysAgo(44),
      notes: "Restricted to payment-intent and webhook verification scopes.",
      createdAt,
      updatedAt: createdAt
    }
  ]);

  const auditLogs: AuditLogRecord[] = [
    {
      id: randomUUID(),
      action: "initial_seed",
      actor: "system",
      status: "info",
      details: "Seeded demo workspace with two production-style projects.",
      timestamp: createdAt
    }
  ];

  return {
    version: 1,
    projects,
    keys,
    auditLogs,
    purchases: []
  };
}

async function ensureDatabaseFile(): Promise<void> {
  const directory = path.dirname(DB_FILE);
  await mkdir(directory, { recursive: true });

  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    const seed = buildSeedDatabase();
    await writeFile(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<AppDatabase> {
  await ensureDatabaseFile();
  const contents = await readFile(DB_FILE, "utf8");
  return JSON.parse(contents) as AppDatabase;
}

async function writeDatabase(database: AppDatabase): Promise<void> {
  await writeFile(DB_FILE, JSON.stringify(database, null, 2), "utf8");
}

export async function mutateDatabase<T>(
  mutation: (database: AppDatabase) => Promise<T> | T
): Promise<T> {
  let result!: T;

  mutationQueue = mutationQueue.then(async () => {
    const database = await readDatabase();
    result = await mutation(database);
    await writeDatabase(database);
  });

  await mutationQueue;
  return result;
}

export async function listProjects(): Promise<Project[]> {
  const db = await readDatabase();
  return [...db.projects].sort((a, b) => a.name.localeCompare(b.name));
}

export interface CreateProjectInput {
  name: string;
  description: string;
  platform: PlatformName;
  platformProjectId: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return mutateDatabase((db) => {
    const timestamp = nowIso();
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      platform: input.platform,
      platformProjectId: input.platformProjectId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.projects.push(project);

    for (const provider of providerNames) {
      db.keys.push({
        id: randomUUID(),
        projectId: project.id,
        provider,
        keyName:
          provider === "aws"
            ? "AWS_ACCESS_KEY_ID"
            : provider === "openai"
              ? "OPENAI_API_KEY"
              : "STRIPE_SECRET_KEY",
        maskedValue: "not_rotated_yet",
        status: "stale",
        rotationIntervalDays: DEFAULT_ROTATION_INTERVAL_DAYS,
        lastRotatedAt: new Date(0).toISOString(),
        notes:
          provider === "aws"
            ? "IAM automation key"
            : provider === "openai"
              ? "Application API usage key"
              : "Payments service key",
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    db.auditLogs.unshift({
      id: randomUUID(),
      action: "project_created",
      actor: "dashboard_user",
      status: "success",
      details: `Created ${project.name} with ${project.platform} deployment sync.`,
      timestamp,
      projectId: project.id
    });

    return project;
  });
}

export interface KeyFilters {
  projectId?: string;
  provider?: ProviderName;
}

function deriveStatus(key: ApiKeyRecord): ApiKeyRecord["status"] {
  const keyAgeDays = differenceInDays(new Date(), new Date(key.lastRotatedAt));
  return keyAgeDays > key.rotationIntervalDays ? "stale" : key.status === "error" ? "error" : "healthy";
}

export async function listKeys(filters?: KeyFilters): Promise<ApiKeyRecord[]> {
  const db = await readDatabase();
  return db.keys
    .filter((key) => (filters?.projectId ? key.projectId === filters.projectId : true))
    .filter((key) => (filters?.provider ? key.provider === filters.provider : true))
    .map((key) => ({
      ...key,
      status: deriveStatus(key)
    }))
    .sort((a, b) => a.keyName.localeCompare(b.keyName));
}

export interface UpdateKeyRotationInput {
  keyId: string;
  maskedValue: string;
  status: ApiKeyRecord["status"];
  notes?: string;
}

export async function updateKeyRotation(input: UpdateKeyRotationInput): Promise<ApiKeyRecord | null> {
  return mutateDatabase((db) => {
    const key = db.keys.find((entry) => entry.id === input.keyId);
    if (!key) {
      return null;
    }

    key.maskedValue = input.maskedValue;
    key.lastRotatedAt = nowIso();
    key.status = input.status;
    key.notes = input.notes ?? key.notes;
    key.updatedAt = nowIso();

    return { ...key };
  });
}

export interface AuditLogInput {
  action: string;
  actor: string;
  status: AuditLogRecord["status"];
  details: string;
  projectId?: string;
  provider?: ProviderName;
}

export async function addAuditLog(input: AuditLogInput): Promise<AuditLogRecord> {
  return mutateDatabase((db) => {
    const record: AuditLogRecord = {
      id: randomUUID(),
      action: input.action,
      actor: input.actor,
      status: input.status,
      details: input.details,
      timestamp: nowIso(),
      projectId: input.projectId,
      provider: input.provider
    };

    db.auditLogs.unshift(record);
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }

    return record;
  });
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
  const db = await readDatabase();
  return db.auditLogs.slice(0, limit);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [projects, keys] = await Promise.all([listProjects(), listKeys()]);
  const staleKeys = keys.filter((key) => key.status === "stale");
  const lastRotation =
    keys.length > 0
      ? [...keys]
          .sort(
            (a, b) =>
              new Date(b.lastRotatedAt).getTime() -
              new Date(a.lastRotatedAt).getTime()
          )[0]?.lastRotatedAt ?? null
      : null;

  return {
    projectCount: projects.length,
    managedKeyCount: keys.length,
    staleKeyCount: staleKeys.length,
    lastRotationAt: lastRotation
  };
}

export async function findProjectById(projectId: string): Promise<Project | null> {
  const db = await readDatabase();
  return db.projects.find((project) => project.id === projectId) ?? null;
}

export async function listProjectKeys(projectId: string): Promise<ApiKeyRecord[]> {
  return listKeys({ projectId });
}

export async function getStaleKeys(): Promise<ApiKeyRecord[]> {
  const keys = await listKeys();
  return keys.filter((key) => key.status === "stale");
}

export async function refreshStaleKeyStatuses(): Promise<number> {
  return mutateDatabase((db) => {
    let staleCount = 0;

    db.keys = db.keys.map((key) => {
      const status = deriveStatus(key);
      if (status === "stale") {
        staleCount += 1;
      }

      if (key.status !== status) {
        return {
          ...key,
          status,
          updatedAt: nowIso()
        };
      }

      return key;
    });

    return staleCount;
  });
}

export async function recordPurchase(input: {
  email: string;
  orderId: string;
  productId: string;
  status: "paid" | "refunded" | "pending";
}): Promise<void> {
  await mutateDatabase((db) => {
    const existing = db.purchases.find(
      (purchase) =>
        purchase.orderId === input.orderId ||
        purchase.email.toLowerCase() === input.email.toLowerCase()
    );

    if (existing) {
      existing.status = input.status;
      existing.productId = input.productId;
      return;
    }

    db.purchases.push({
      id: randomUUID(),
      email: input.email.toLowerCase(),
      orderId: input.orderId,
      productId: input.productId,
      status: input.status,
      createdAt: nowIso()
    });
  });
}

export async function hasActivePurchase(email: string): Promise<boolean> {
  const db = await readDatabase();
  return db.purchases.some(
    (purchase) =>
      purchase.email.toLowerCase() === email.toLowerCase() && purchase.status === "paid"
  );
}
