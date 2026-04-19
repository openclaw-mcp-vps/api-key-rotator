import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { addAuditLog, createProject, listKeys, listProjects } from "@/lib/db/store";

const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(12),
  platform: z.enum(["vercel", "netlify"]),
  platformProjectId: z.string().min(2)
});

export default async function ProjectsPage() {
  const [projects, keys] = await Promise.all([listProjects(), listKeys()]);

  const keyCounts = new Map<string, number>();
  const staleCounts = new Map<string, number>();
  const lastRotatedMap = new Map<string, string>();

  for (const key of keys) {
    keyCounts.set(key.projectId, (keyCounts.get(key.projectId) ?? 0) + 1);
    if (key.status === "stale") {
      staleCounts.set(key.projectId, (staleCounts.get(key.projectId) ?? 0) + 1);
    }

    const previousRotation = lastRotatedMap.get(key.projectId);
    if (!previousRotation || new Date(key.lastRotatedAt) > new Date(previousRotation)) {
      lastRotatedMap.set(key.projectId, key.lastRotatedAt);
    }
  }

  async function createProjectAction(formData: FormData): Promise<void> {
    "use server";

    const parsed = createProjectSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      platform: formData.get("platform"),
      platformProjectId: formData.get("platformProjectId")
    });

    const project = await createProject(parsed);
    await addAuditLog({
      action: "project_created",
      actor: "dashboard_user",
      status: "success",
      details: `Created project ${project.name}.`,
      projectId: project.id
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/keys");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Project Inventory</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Add every deployment target that should receive rotated credentials. Each new project is bootstrapped with AWS, OpenAI, and Stripe key tracking.
        </p>

        <form action={createProjectAction} className="mt-6 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-300">
            Project name
            <input
              required
              name="name"
              placeholder="Customer Analytics API"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Deployment platform
            <select
              required
              name="platform"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="vercel">Vercel</option>
              <option value="netlify">Netlify</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Platform project/site ID
            <input
              required
              name="platformProjectId"
              placeholder="analytics-api-prod"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
            Description
            <textarea
              required
              name="description"
              rows={3}
              placeholder="Handles event ingestion and powers the product usage dashboard."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Add Project and Track Keys</Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            keyCount={keyCounts.get(project.id) ?? 0}
            staleCount={staleCounts.get(project.id) ?? 0}
            lastRotatedAt={lastRotatedMap.get(project.id)}
          />
        ))}
      </section>
    </div>
  );
}
