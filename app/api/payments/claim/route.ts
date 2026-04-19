import { z } from "zod";
import { NextResponse } from "next/server";
import { claimPaidAccess, setPaidCookie } from "@/lib/payments";

const claimSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "A valid email is required." },
      { status: 400 }
    );
  }

  const paid = await claimPaidAccess(parsed.data.email);

  if (!paid) {
    return NextResponse.json(
      {
        success: false,
        message:
          "No completed Lemon Squeezy order found for that email yet. Finish checkout, then retry in a few seconds."
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ success: true });
  return setPaidCookie(response);
}
