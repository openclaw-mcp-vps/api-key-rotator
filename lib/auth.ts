import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { Plan } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "akr_access";

export interface AccessClaims {
  email: string;
  plan: Plan;
  projectsLimit: number;
  iat: number;
  exp: number;
}

function resolveCookieSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET ?? createHash("sha256").update("api-key-rotator-cookie-secret").digest("hex");
}

function base64UrlEncode(raw: string): string {
  return Buffer.from(raw, "utf8").toString("base64url");
}

function base64UrlDecode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", resolveCookieSecret()).update(payload).digest("base64url");
}

export function createAccessToken(input: { email: string; plan: Plan; projectsLimit: number; ttlDays?: number }): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = input.ttlDays ?? 32;

  const claims: AccessClaims = {
    email: input.email,
    plan: input.plan,
    projectsLimit: input.projectsLimit,
    iat: now,
    exp: now + ttl * 24 * 60 * 60
  };

  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyAccessToken(token?: string | null): AccessClaims | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const claims = JSON.parse(base64UrlDecode(payload)) as AccessClaims;
    const now = Math.floor(Date.now() / 1000);

    if (!claims.email || claims.exp <= now) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

export async function getAccessClaimsFromCookies(): Promise<AccessClaims | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  return verifyAccessToken(raw);
}

export function getAccessClaimsFromRequest(request: NextRequest): AccessClaims | null {
  return verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? null);
}

export function setAccessCookie(response: NextResponse, claims: { email: string; plan: Plan; projectsLimit: number }): void {
  const token = createAccessToken(claims);

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 32
  });
}

export function clearAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export function isProjectCreationAllowed(claims: AccessClaims, currentProjectCount: number): boolean {
  return claims.projectsLimit < 0 || currentProjectCount < claims.projectsLimit;
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authConfig = {
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const expectedEmail = process.env.AUTH_ADMIN_EMAIL;
        const expectedPassword = process.env.AUTH_ADMIN_PASSWORD;

        if (!expectedEmail || !expectedPassword) {
          return null;
        }

        if (
          parsed.data.email.toLowerCase() !== expectedEmail.toLowerCase() ||
          parsed.data.password !== expectedPassword
        ) {
          return null;
        }

        return {
          id: "admin",
          email: expectedEmail,
          name: "Workspace Admin"
        };
      }
    })
  ],
  pages: {
    signIn: "/"
  }
} satisfies NextAuthOptions;
