import { RotationHistory } from "@/components/dashboard/rotation-history";
import { listAuditLogs } from "@/lib/db/store";

export default async function AuditPage() {
  const logs = await listAuditLogs(200);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Audit Log</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Every key rotation and webhook event is written to this immutable timeline so compliance reviews can trace when controls ran, who executed them, and whether all systems updated successfully.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <RotationHistory logs={logs} />
      </section>
    </div>
  );
}
