import { z } from "zod";
import { NextResponse } from "next/server";
import { createProject, listKeys, listProjects } from "@/lib/db/store";
import { hasPaidCookie } from "@/lib/payments";

const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(12),
  platform: z.enum(["vercel", "netlify"]),
  platformProjectId: z.string().min(2)
});

function requirePaidAccess(request: Request): NextResponse | null {
  if (!hasPaidCookie(request.headers.get("cookie"))) {
    return NextResponse.json(
      { message: "Paid access required" },
      { status: 401 }
    );
  }

  return null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const blocked = requirePaidAccess(request);
  if (blocked) {
    return blocked;
  }

  const [projects, keys] = await Promise.all([listProjects(), listKeys()]);

  const keySummaryByProject = keys.reduce<Record<string, { total: number; stale: number }>>(
    (accumulator, key) => {
      const current = accumulator[key.projectId] ?? { total: 0, stale: 0 };
      current.total += 1;
      if (key.status === "stale") {
        current.stale += 1;
      }
      accumulator[key.projectId] = current;
      return accumulator;
    },
    {}
  );

  return NextResponse.json({
    projects: projects.map((project) => ({
      ...project,
      keys: keySummaryByProject[project.id] ?? { total: 0, stale: 0 }
    }))
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const blocked = requirePaidAccess(request);
  if (blocked) {
    return blocked;
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid project payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const project = await createProject(parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
