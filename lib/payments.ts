import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as LemonSqueezy from "@lemonsqueezy/lemonsqueezy.js";
import {
  PAYWALL_COOKIE_MAX_AGE_SECONDS,
  PAYWALL_COOKIE_NAME
} from "@/lib/constants";
import { hasActivePurchase, recordPurchase } from "@/lib/db/store";

function normalizeHex(value: string): string {
  return value.trim().toLowerCase().replace(/^sha256=/, "");
}

export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return false;
  }

  const expected = createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const provided = normalizeHex(signatureHeader);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function getCheckoutUrl(email?: string): Promise<string> {
  const productIdentifier = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  if (!productIdentifier) {
    return "#pricing";
  }

  const directCheckoutUrl =
    productIdentifier.startsWith("http://") ||
    productIdentifier.startsWith("https://")
      ? productIdentifier
      : `https://checkout.lemonsqueezy.com/buy/${productIdentifier}`;

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    return email
      ? `${directCheckoutUrl}?checkout[email]=${encodeURIComponent(email)}&embed=1`
      : `${directCheckoutUrl}?embed=1`;
  }

  try {
    const sdk = LemonSqueezy as Record<string, unknown>;
    const setup = sdk["lemonSqueezySetup"] as
      | ((config: { apiKey: string }) => void)
      | undefined;
    setup?.({ apiKey });

    const createCheckout = sdk["createCheckout"] as
      | ((
          store: string | number,
          variant: string | number,
          payload?: {
            checkoutOptions?: {
              embed?: boolean;
              media?: boolean;
              logo?: boolean;
            };
            checkoutData?: {
              email?: string;
            };
          }
        ) => Promise<{
          data?: {
            data?: {
              attributes?: {
                url?: string;
              };
            };
          };
        }>)
      | undefined;

    if (!createCheckout) {
      return directCheckoutUrl;
    }

    const response = await createCheckout(storeId, productIdentifier, {
      checkoutOptions: {
        embed: true,
        media: false,
        logo: true
      },
      checkoutData: {
        email
      }
    });

    const generatedUrl = response?.data?.data?.attributes?.url;
    return generatedUrl ?? directCheckoutUrl;
  } catch {
    return directCheckoutUrl;
  }
}

export function setPaidCookie(response: NextResponse): NextResponse {
  response.cookies.set(PAYWALL_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PAYWALL_COOKIE_MAX_AGE_SECONDS,
    path: "/"
  });

  return response;
}

export function clearPaidCookie(response: NextResponse): NextResponse {
  response.cookies.set(PAYWALL_COOKIE_NAME, "0", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });

  return response;
}

export function hasPaidCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) {
    return false;
  }

  const cookiesMap = cookieHeader.split(";").map((cookiePart) => cookiePart.trim());
  return cookiesMap.some((cookiePart) => cookiePart === `${PAYWALL_COOKIE_NAME}=1`);
}

export async function hasPaidSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PAYWALL_COOKIE_NAME)?.value === "1";
}

export async function handleLemonWebhookEvent(eventBody: {
  meta?: {
    event_name?: string;
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      status?: string;
      product_id?: string | number;
    };
  };
}): Promise<void> {
  const eventName = eventBody.meta?.event_name;
  const orderId = eventBody.data?.id;
  const email = eventBody.data?.attributes?.user_email;
  const productId = `${eventBody.data?.attributes?.product_id ?? "unknown"}`;

  if (!orderId || !email || !eventName) {
    return;
  }

  const status =
    eventName === "order_created" ||
    eventBody.data?.attributes?.status === "paid"
      ? "paid"
      : eventName === "order_refunded"
        ? "refunded"
        : "pending";

  await recordPurchase({
    email,
    orderId,
    productId,
    status
  });
}

export async function claimPaidAccess(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  return hasActivePurchase(normalizedEmail);
}
