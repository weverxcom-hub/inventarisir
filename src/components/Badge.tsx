import type { ItemCondition, ProcurementStatus, UserRole } from "@/types";

type BadgeTone = "green" | "yellow" | "red" | "blue" | "purple" | "gray";

const TONE_STYLES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

const CONDITION_CONFIG: Record<ItemCondition, { tone: BadgeTone; label: string }> = {
  Good: { tone: "green", label: "Baik" },
  Repair: { tone: "yellow", label: "Perlu Perbaikan" },
  Broken: { tone: "red", label: "Rusak" },
};

export function ConditionBadge({ condition }: { condition: ItemCondition | string }) {
  const config = CONDITION_CONFIG[condition as ItemCondition];
  return <Badge tone={config?.tone ?? "gray"}>{config?.label ?? condition}</Badge>;
}

const STATUS_TONES: Record<ProcurementStatus, BadgeTone> = {
  Pending: "yellow",
  Approved: "blue",
  Rejected: "red",
  Completed: "green",
};

export function StatusBadge({ status }: { status: ProcurementStatus | string }) {
  const tone = STATUS_TONES[status as ProcurementStatus];
  return <Badge tone={tone ?? "gray"}>{status}</Badge>;
}

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  Admin: "purple",
  Approver: "blue",
  Staff: "gray",
};

export function RoleBadge({ role }: { role: UserRole | string }) {
  const tone = ROLE_TONES[role as UserRole];
  return <Badge tone={tone ?? "gray"}>{role}</Badge>;
}
