import Link from "next/link";
import { Cloud, KeyRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  platform: "vercel" | "netlify";
  totalKeys: number;
  staleKeys: number;
}

export function ProjectCard({ id, name, description, platform, totalKeys, staleKeys }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{name}</CardTitle>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[#111d2a] px-2 py-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          <Cloud className="mr-1 h-3 w-3" />
          {platform}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-[var(--border)] bg-[#101926] p-3">
            <p className="text-[var(--muted)]">Tracked keys</p>
            <p className="mt-1 text-lg font-semibold text-white">{totalKeys}</p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[#101926] p-3">
            <p className="text-[var(--muted)]">Stale keys</p>
            <p className="mt-1 text-lg font-semibold text-white">{staleKeys}</p>
          </div>
        </div>

        <Link
          className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#152131]"
          href={`/dashboard/keys?projectId=${id}`}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Manage keys
        </Link>
      </CardContent>
    </Card>
  );
}
