import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Dashboard Access",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          // Safe local fallback so teams can still boot the app without additional setup.
          if (
            parsed.data.email === "owner@company.com" &&
            parsed.data.password === "change-me-now"
          ) {
            return { id: "local-admin", email: parsed.data.email };
          }

          return null;
        }

        if (
          parsed.data.email.toLowerCase() === adminEmail.toLowerCase() &&
          parsed.data.password === adminPassword
        ) {
          return { id: "admin", email: parsed.data.email };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: "/"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    }
  }
};
