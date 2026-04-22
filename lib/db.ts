import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Platform = "vercel" | "netlify";
export type Provider = "aws" | "openai" | "stripe";
export type Plan = "starter" | "unlimited";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  platform: Platform;
  platformProjectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyRecord {
  id: string;
  projectId: string;
  provider: Provider;
  label: string;
  envVarName: string;
  encryptedValue: string;
  lastRotatedAt: string;
  rotationIntervalDays: number;
  status: "healthy" | "stale" | "error";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRecord {
  id: string;
  action: string;
  actor: string;
  projectId: string | null;
  keyId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface EntitlementRecord {
  email: string;
  plan: Plan;
  projectsLimit: number;
  status: "active" | "canceled";
  purchasedAt: string;
  updatedAt: string;
}

interface Store {
  projects: ProjectRecord[];
  keys: KeyRecord[];
  audit: AuditRecord[];
  entitlements: EntitlementRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const EMPTY_STORE: Store = {
  projects: [],
  keys: [],
  audit: [],
  entitlements: []
};

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureStoreExists(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensureStoreExists();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<Store>;

  return {
    projects: parsed.projects ?? [],
    keys: parsed.keys ?? [],
    audit: parsed.audit ?? [],
    entitlements: parsed.entitlements ?? []
  };
}

async function writeStore(store: Store): Promise<void> {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withWriteLock<T>(operation: (store: Store) => Promise<T> | T): Promise<T> {
  const run = writeQueue.then(async () => {
    const store = await readStore();
    const result = await operation(store);
    await writeStore(store);
    return result;
  });

  writeQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const store = await readStore();
  return [...store.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  const store = await readStore();
  return store.projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">): Promise<ProjectRecord> {
  return withWriteLock((store) => {
    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...input
    };

    store.projects.push(project);
    return project;
  });
}

export async function countProjects(): Promise<number> {
  const store = await readStore();
  return store.projects.length;
}

export async function listKeys(projectId?: string): Promise<KeyRecord[]> {
  const store = await readStore();
  const keys = projectId ? store.keys.filter((key) => key.projectId === projectId) : store.keys;

  return [...keys].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getKeyById(keyId: string): Promise<KeyRecord | null> {
  const store = await readStore();
  return store.keys.find((key) => key.id === keyId) ?? null;
}

export async function createKey(input: Omit<KeyRecord, "id" | "createdAt" | "updatedAt">): Promise<KeyRecord> {
  return withWriteLock((store) => {
    const now = new Date().toISOString();
    const key: KeyRecord = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...input
    };

    store.keys.push(key);
    return key;
  });
}

export async function updateKey(
  keyId: string,
  updates: Partial<Pick<KeyRecord, "encryptedValue" | "lastRotatedAt" | "rotationIntervalDays" | "status" | "notes" | "label" | "envVarName">>
): Promise<KeyRecord | null> {
  return withWriteLock((store) => {
    const key = store.keys.find((entry) => entry.id === keyId);
    if (!key) {
      return null;
    }

    Object.assign(key, updates, { updatedAt: new Date().toISOString() });
    return key;
  });
}

export async function appendAudit(input: Omit<AuditRecord, "id" | "createdAt">): Promise<AuditRecord> {
  return withWriteLock((store) => {
    const audit: AuditRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input
    };

    store.audit.push(audit);
    return audit;
  });
}

export async function listAudit(limit = 200): Promise<AuditRecord[]> {
  const store = await readStore();
  return [...store.audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function upsertEntitlement(input: Omit<EntitlementRecord, "updatedAt">): Promise<EntitlementRecord> {
  return withWriteLock((store) => {
    const existing = store.entitlements.find((entry) => entry.email.toLowerCase() === input.email.toLowerCase());
    const updatedAt = new Date().toISOString();

    if (existing) {
      existing.plan = input.plan;
      existing.projectsLimit = input.projectsLimit;
      existing.status = input.status;
      existing.purchasedAt = input.purchasedAt;
      existing.updatedAt = updatedAt;
      return existing;
    }

    const entitlement: EntitlementRecord = {
      ...input,
      updatedAt
    };

    store.entitlements.push(entitlement);
    return entitlement;
  });
}

export async function getEntitlementByEmail(email: string): Promise<EntitlementRecord | null> {
  const store = await readStore();
  return store.entitlements.find((entry) => entry.email.toLowerCase() === email.toLowerCase()) ?? null;
}
