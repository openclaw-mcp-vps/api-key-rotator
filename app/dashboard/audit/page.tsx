import { RotationHistory } from "@/components/dashboard/rotation-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentAuditLogs } from "@/lib/audit-log";

export default async function AuditPage() {
  const logs = await getRecentAuditLogs(200);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Audit timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <RotationHistory entries={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
