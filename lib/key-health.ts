import { differenceInDays, parseISO } from "date-fns";

import type { KeyRecord } from "@/lib/db";

export function getKeyAgeInDays(key: KeyRecord): number {
  return differenceInDays(new Date(), parseISO(key.lastRotatedAt));
}

export function isKeyStale(key: KeyRecord): boolean {
  return key.status !== "error" && getKeyAgeInDays(key) >= key.rotationIntervalDays;
}

export function getDerivedStatus(key: KeyRecord): "healthy" | "stale" | "error" {
  if (key.status === "error") {
    return "error";
  }

  return isKeyStale(key) ? "stale" : "healthy";
}
