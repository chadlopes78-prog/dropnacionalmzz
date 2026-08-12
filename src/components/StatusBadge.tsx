import { cn } from "@/lib/utils";
import { STATUS_MAP, type StatusTone } from "@/lib/domain";

const TONE_CLASSES: Record<StatusTone, string> = {
  new: "bg-status-new/12 text-status-new border-status-new/25",
  info: "bg-status-info/12 text-status-info border-status-info/25",
  warn: "bg-status-warn/14 text-status-warn border-status-warn/25",
  ok: "bg-status-ok/12 text-status-ok border-status-ok/25",
  danger: "bg-status-danger/12 text-status-danger border-status-danger/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[meta?.tone ?? "neutral"],
        className,
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}
