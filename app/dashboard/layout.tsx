import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, FileClock, KeyRound, FolderKanban } from "lucide-react";
import { hasPaidSessionCookie } from "@/lib/payments";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/keys", label: "Key Rotation", icon: KeyRound },
  { href: "/dashboard/audit", label: "Audit Log", icon: FileClock }
];

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const hasAccess = await hasPaidSessionCookie();

  if (!hasAccess) {
    redirect("/?paywall=locked");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr] md:px-10">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:h-fit">
          <p className="mb-4 px-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            API Key Rotator
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/"
            className="mt-6 block rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:border-cyan-400/70 hover:text-cyan-300"
          >
            Back to landing page
          </Link>
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
