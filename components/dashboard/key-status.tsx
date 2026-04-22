import { differenceInDays, parseISO } from "date-fns";

import type { KeyRecord } from "@/lib/db";

interface KeyStatusProps {
  keyRecord: KeyRecord;
}

export function KeyStatus({ keyRecord }: KeyStatusProps) {
  const ageInDays = differenceInDays(new Date(), parseISO(keyRecord.lastRotatedAt));
  const isStale = ageInDays >= keyRecord.rotationIntervalDays;
  const isError = keyRecord.status === "error";

  if (isError) {
    return <span className="rounded-full bg-[rgba(248,81,73,0.15)] px-2 py-1 text-xs font-medium text-[var(--danger)]">Error</span>;
  }

  if (isStale) {
    return <span className="rounded-full bg-[rgba(245,158,11,0.15)] px-2 py-1 text-xs font-medium text-[var(--warning)]">Stale</span>;
  }

  return <span className="rounded-full bg-[rgba(46,160,67,0.15)] px-2 py-1 text-xs font-medium text-[var(--success)]">Healthy</span>;
}
