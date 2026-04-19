import { format } from "date-fns";
import type { AuditLogRecord } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";

interface RotationHistoryProps {
  logs: AuditLogRecord[];
}

const statusClasses: Record<AuditLogRecord["status"], string> = {
  success: "text-emerald-300",
  warning: "text-amber-300",
  error: "text-rose-300",
  info: "text-slate-300"
};

export function RotationHistory({ logs }: RotationHistoryProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>When</TableHeaderCell>
          <TableHeaderCell>Action</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Actor</TableHeaderCell>
          <TableHeaderCell>Details</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="whitespace-nowrap text-slate-400">
              {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
            </TableCell>
            <TableCell className="font-medium text-slate-100">{log.action}</TableCell>
            <TableCell className={statusClasses[log.status]}>{log.status}</TableCell>
            <TableCell className="text-slate-300">{log.actor}</TableCell>
            <TableCell className="max-w-[32rem] text-slate-300">{log.details}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
