import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, FolderKanban, KeyRound, ScrollText } from "lucide-react";

import { getAccessClaimsFromCookies } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/keys", label: "Keys", icon: KeyRound },
  { href: "/dashboard/audit", label: "Audit", icon: ScrollText }
];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAccessClaimsFromCookies();

  if (!access) {
    redirect("/");
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-[var(--border)] bg-[rgba(17,24,39,0.86)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl font-bold text-white">API Key Rotator Dashboard</p>
              <p className="text-sm text-[var(--muted)]">
                Signed in as {access.email} • Plan: {access.plan === "starter" ? "Starter (5 projects)" : "Unlimited"}
              </p>
            </div>
            <Link className="text-sm font-semibold text-[var(--muted)] hover:text-white" href="/">
              Back to landing
            </Link>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[#111b2a] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#162335]"
                  href={link.href}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
