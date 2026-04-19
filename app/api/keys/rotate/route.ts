import { z } from "zod";
import { NextResponse } from "next/server";
import { rotateKeys } from "@/lib/rotation";
import { hasPaidCookie } from "@/lib/payments";

const rotationSchema = z.object({
  projectIds: z.array(z.string()).optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasPaidCookie(request.headers.get("cookie"))) {
    return NextResponse.json({ message: "Paid access required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = rotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid rotation payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const result = await rotateKeys({
    actor: "api_user",
    projectIds: parsed.data.projectIds
  });

  return NextResponse.json({ result });
}
