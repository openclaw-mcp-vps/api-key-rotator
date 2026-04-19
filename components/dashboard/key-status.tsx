import { formatDistanceToNowStrict } from "date-fns";
import type { ApiKeyRecord } from "@/lib/db/schema";

interface KeyStatusProps {
  keyRecord: ApiKeyRecord;
  projectName?: string;
}

const statusStyles: Record<ApiKeyRecord["status"], string> = {
  healthy: "bg-emerald-500/20 text-emerald-300",
  stale: "bg-amber-500/20 text-amber-300",
  error: "bg-rose-500/20 text-rose-300"
};

export function KeyStatus({ keyRecord, projectName }: KeyStatusProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-100">{keyRecord.keyName}</p>
          {projectName ? <p className="text-xs text-slate-400">{projectName}</p> : null}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[keyRecord.status]}`}
        >
          {keyRecord.status}
        </span>
      </div>
      <p className="text-sm text-slate-300">{keyRecord.maskedValue}</p>
      <p className="mt-2 text-xs text-slate-500">
        Rotated {formatDistanceToNowStrict(new Date(keyRecord.lastRotatedAt))} ago
      </p>
      {keyRecord.notes ? (
        <p className="mt-1 text-xs text-slate-500">{keyRecord.notes}</p>
      ) : null}
    </div>
  );
}
