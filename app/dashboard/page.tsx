import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { KeyStatus } from "@/components/dashboard/key-status";
import { getDashboardOverview, listKeys, listProjects } from "@/lib/db/store";
import { rotateKeys } from "@/lib/rotation";

export default async function DashboardOverviewPage() {
  const [overview, projects, keys] = await Promise.all([
    getDashboardOverview(),
    listProjects(),
    listKeys()
  ]);

  const projectLookup = new Map(projects.map((project) => [project.id, project.name]));
  const staleKeys = keys.filter((key) => key.status === "stale");

  async function rotateAllAction(): Promise<void> {
    "use server";

    await rotateKeys({ actor: "dashboard_user" });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keys");
    revalidatePath("/dashboard/audit");
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Security Ops Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Keep quarterly key rotation on schedule across every deployment target, with live stale-key visibility and a complete audit trail.
            </p>
          </div>
          <form action={rotateAllAction}>
            <Button type="submit">Rotate All Keys Now</Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Projects</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{overview.projectCount}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Managed Keys</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{overview.managedKeyCount}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Stale Keys</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{overview.staleKeyCount}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Last Rotation</p>
          <p className="mt-2 text-base font-semibold text-slate-100">
            {overview.lastRotationAt
              ? format(new Date(overview.lastRotationAt), "MMM d, yyyy HH:mm")
              : "No rotation yet"}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Immediate Attention</h2>
        {staleKeys.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-300">All tracked keys are within your rotation window.</p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {staleKeys.slice(0, 6).map((key) => (
              <KeyStatus
                key={key.id}
                keyRecord={key}
                projectName={projectLookup.get(key.projectId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
