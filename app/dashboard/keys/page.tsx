import { formatDistanceToNowStrict } from "date-fns";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { listKeys, listProjects } from "@/lib/db/store";
import { rotateKeys } from "@/lib/rotation";

const statusColor = {
  healthy: "text-emerald-300",
  stale: "text-amber-300",
  error: "text-rose-300"
} as const;

export default async function KeysPage() {
  const [keys, projects] = await Promise.all([listKeys(), listProjects()]);
  const projectLookup = new Map(projects.map((project) => [project.id, project]));

  async function rotateAllAction(): Promise<void> {
    "use server";

    await rotateKeys({ actor: "dashboard_user" });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keys");
    revalidatePath("/dashboard/audit");
  }

  async function rotateProjectAction(formData: FormData): Promise<void> {
    "use server";

    const projectId = formData.get("projectId");
    if (typeof projectId !== "string" || !projectId) {
      return;
    }

    await rotateKeys({
      actor: "dashboard_user",
      projectIds: [projectId]
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/keys");
    revalidatePath("/dashboard/audit");
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Key Rotation Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Run cross-provider rotations in one action or target a single project before a release.
            </p>
          </div>
          <form action={rotateAllAction}>
            <Button type="submit">Rotate Every Key</Button>
          </form>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Provider</TableHeaderCell>
              <TableHeaderCell>Variable</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last Rotated</TableHeaderCell>
              <TableHeaderCell>Current Value</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {keys.map((key) => {
              const project = projectLookup.get(key.projectId);
              return (
                <TableRow key={key.id}>
                  <TableCell>
                    <p className="font-medium text-slate-100">{project?.name ?? "Unknown project"}</p>
                    <p className="text-xs text-slate-500">{project?.platform ?? "n/a"}</p>
                  </TableCell>
                  <TableCell className="uppercase text-slate-300">{key.provider}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">{key.keyName}</TableCell>
                  <TableCell className={statusColor[key.status]}>{key.status}</TableCell>
                  <TableCell className="text-slate-300">
                    {formatDistanceToNowStrict(new Date(key.lastRotatedAt))} ago
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{key.maskedValue}</TableCell>
                  <TableCell className="text-right">
                    {project ? (
                      <form action={rotateProjectAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <Button size="sm" variant="secondary" type="submit">
                          Rotate Project
                        </Button>
                      </form>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
