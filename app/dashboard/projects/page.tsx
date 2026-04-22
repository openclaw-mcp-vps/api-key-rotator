import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countProjects, createProject, listProjects, type Platform } from "@/lib/db";
import { getAccessClaimsFromCookies, isProjectCreationAllowed } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";

const projectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(220),
  platform: z.enum(["vercel", "netlify"]),
  platformProjectId: z.string().min(3).max(120)
});

async function createProjectAction(formData: FormData) {
  "use server";

  const access = await getAccessClaimsFromCookies();
  if (!access) {
    throw new Error("Missing paid access cookie");
  }

  const parsed = projectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    platform: formData.get("platform"),
    platformProjectId: formData.get("platformProjectId")
  });

  const currentCount = await countProjects();
  if (!isProjectCreationAllowed(access, currentCount)) {
    throw new Error("Project limit reached for current plan");
  }

  const project = await createProject({
    name: parsed.name,
    description: parsed.description,
    platform: parsed.platform as Platform,
    platformProjectId: parsed.platformProjectId
  });

  await writeAuditLog({
    action: "project.created",
    actor: access.email,
    projectId: project.id,
    details: {
      platform: project.platform,
      platformProjectId: project.platformProjectId
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add project</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProjectAction} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Project name</span>
              <input className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="name" required />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Platform</span>
              <select className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="platform" required>
                <option value="vercel">Vercel</option>
                <option value="netlify">Netlify</option>
              </select>
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Description</span>
              <textarea className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[#0f1724] p-3" name="description" required />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Platform project ID (Vercel project id or Netlify site id)</span>
              <input className="h-10 w-full rounded-md border border-[var(--border)] bg-[#0f1724] px-3" name="platformProjectId" required />
            </label>

            <button className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[#3f8cf5] md:col-span-2" type="submit">
              Create project
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="rounded-md border border-[var(--border)] bg-[#111b2a] p-4">
                <p className="font-semibold text-white">{project.name}</p>
                <p className="text-sm text-[var(--muted)]">{project.description}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  {project.platform} • {project.platformProjectId}
                </p>
              </div>
            ))}
            {projects.length === 0 ? <p className="text-sm text-[var(--muted)]">No projects yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
