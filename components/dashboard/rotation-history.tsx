import { formatDistanceToNowStrict, parseISO } from "date-fns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditRecord } from "@/lib/db";

interface RotationHistoryProps {
  entries: AuditRecord[];
}

export function RotationHistory({ entries }: RotationHistoryProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No rotation activity yet. Trigger your first key rotation to build an audit timeline.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDistanceToNowStrict(parseISO(entry.createdAt), { addSuffix: true })}</TableCell>
            <TableCell>{entry.action}</TableCell>
            <TableCell>{entry.actor}</TableCell>
            <TableCell className="max-w-[380px] truncate text-[var(--muted)]">{JSON.stringify(entry.details)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
