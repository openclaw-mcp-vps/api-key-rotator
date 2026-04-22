import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessClaimsFromRequest, isProjectCreationAllowed } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { countProjects, createProject, listProjects } from "@/lib/db";

const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(220),
  platform: z.enum(["vercel", "netlify"]),
  platformProjectId: z.string().min(3).max(120)
});

export async function GET(request: NextRequest) {
  const access = getAccessClaimsFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const access = getAccessClaimsFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const projectCount = await countProjects();
  if (!isProjectCreationAllowed(access, projectCount)) {
    return NextResponse.json({ error: "Project limit reached for current plan" }, { status: 403 });
  }

  const project = await createProject(parsed.data);

  await writeAuditLog({
    action: "project.created",
    actor: access.email,
    projectId: project.id,
    details: {
      platform: project.platform,
      platformProjectId: project.platformProjectId
    }
  });

  return NextResponse.json({ project }, { status: 201 });
}
