import { differenceInDays, parseISO } from "date-fns";

import { ProjectCard } from "@/components/dashboard/project-card";
import { RotationHistory } from "@/components/dashboard/rotation-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjects, listKeys } from "@/lib/db";
import { summarizeKeyHealth } from "@/lib/rotation";
import { getRecentAuditLogs } from "@/lib/audit-log";

export default async function DashboardPage() {
  const [projects, keys, health, audit] = await Promise.all([
    listProjects(),
    listKeys(),
    summarizeKeyHealth(),
    getRecentAuditLogs(10)
  ]);

  const perProject = projects.map((project) => {
    const projectKeys = keys.filter((key) => key.projectId === project.id);
    const stale = projectKeys.filter((key) => differenceInDays(new Date(), parseISO(key.lastRotatedAt)) >= key.rotationIntervalDays).length;

    return {
      ...project,
      totalKeys: projectKeys.length,
      staleKeys: stale
    };
  });

  const projectedHoursSaved = Number(((health.total * 12) / 60).toFixed(1));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tracked keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{health.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stale keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{health.stale}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estimated hours saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{projectedHoursSaved}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-white">Projects</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {perProject.map((project) => (
            <ProjectCard
              key={project.id}
              description={project.description}
              id={project.id}
              name={project.name}
              platform={project.platform}
              staleKeys={project.staleKeys}
              totalKeys={project.totalKeys}
            />
          ))}
          {perProject.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-[var(--muted)]">
                Add your first project in the Projects tab to start tracking rotation and stale key risk.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent audit activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RotationHistory entries={audit} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
