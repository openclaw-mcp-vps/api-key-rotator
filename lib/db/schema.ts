export const providerNames = ["aws", "openai", "stripe"] as const;
export type ProviderName = (typeof providerNames)[number];

export const platformNames = ["vercel", "netlify"] as const;
export type PlatformName = (typeof platformNames)[number];

export type KeyStatus = "healthy" | "stale" | "error";
export type AuditStatus = "success" | "warning" | "error" | "info";

export interface Project {
  id: string;
  name: string;
  description: string;
  platform: PlatformName;
  platformProjectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  projectId: string;
  provider: ProviderName;
  keyName: string;
  maskedValue: string;
  status: KeyStatus;
  rotationIntervalDays: number;
  lastRotatedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actor: string;
  status: AuditStatus;
  details: string;
  timestamp: string;
  projectId?: string;
  provider?: ProviderName;
}

export interface PurchaseRecord {
  id: string;
  email: string;
  orderId: string;
  productId: string;
  status: "paid" | "refunded" | "pending";
  createdAt: string;
}

export interface AppDatabase {
  version: number;
  projects: Project[];
  keys: ApiKeyRecord[];
  auditLogs: AuditLogRecord[];
  purchases: PurchaseRecord[];
}

export interface DashboardOverview {
  projectCount: number;
  managedKeyCount: number;
  staleKeyCount: number;
  lastRotationAt: string | null;
}
