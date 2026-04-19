import { formatDistanceToNowStrict } from "date-fns";
import type { Project } from "@/lib/db/schema";

interface ProjectCardProps {
  project: Project;
  keyCount: number;
  staleCount: number;
  lastRotatedAt?: string;
}

export function ProjectCard({
  project,
  keyCount,
  staleCount,
  lastRotatedAt
}: ProjectCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{project.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{project.description}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          {project.platform}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Keys</dt>
          <dd className="mt-1 text-base font-semibold text-slate-100">{keyCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Stale</dt>
          <dd className="mt-1 text-base font-semibold text-amber-300">{staleCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Last Rotation</dt>
          <dd className="mt-1 text-base font-semibold text-slate-100">
            {lastRotatedAt
              ? `${formatDistanceToNowStrict(new Date(lastRotatedAt))} ago`
              : "Never"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-slate-500">Platform ID: {project.platformProjectId}</p>
    </article>
  );
}
