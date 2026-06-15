import type { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  RoomStatus | "RESERVED",
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  AVAILABLE: {
    label: "Sẵn sàng",
    variant: "default",
    className: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20",
  },
  RESERVED: {
    label: "Đã đặt trước",
    variant: "default",
    className: "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-500/20",
  },
  OCCUPIED: {
    label: "Có khách",
    variant: "default",
    className: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/20",
  },
  DIRTY: {
    label: "Chưa dọn dẹp",
    variant: "default",
    className: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20",
  },
  MAINTENANCE: {
    label: "Đang bảo trì",
    variant: "default",
    className: "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20",
  },
};

interface RoomStatusBadgeProps {
  status: RoomStatus | "RESERVED";
  className?: string;
}

export function RoomStatusBadge({ status, className }: RoomStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.AVAILABLE;
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
