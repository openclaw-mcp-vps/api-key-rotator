import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { clearAccessCookie, setAccessCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { getEntitlementByEmail } from "@/lib/db";

const claimSchema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest) {
  const payload = claimSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const entitlement = await getEntitlementByEmail(payload.data.email);

  if (!entitlement || entitlement.status !== "active") {
    return NextResponse.json(
      {
        error:
          "No active purchase found for this email yet. Complete Stripe checkout first, then retry after the webhook posts your entitlement."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    message: `Access granted for ${entitlement.plan} plan.`
  });

  setAccessCookie(response, {
    email: entitlement.email,
    plan: entitlement.plan,
    projectsLimit: entitlement.projectsLimit
  });

  await writeAuditLog({
    action: "paywall.claimed",
    actor: entitlement.email,
    details: {
      plan: entitlement.plan,
      projectsLimit: entitlement.projectsLimit
    }
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Access cookie cleared" });
  clearAccessCookie(response);
  return response;
}
