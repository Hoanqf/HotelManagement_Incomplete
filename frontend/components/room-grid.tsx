"use client";

import type { RoomWithType, RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoomStatusBadge } from "@/components/room-status-badge";

interface RoomGridProps {
  rooms: RoomWithType[];
  onRoomClick?: (room: RoomWithType) => void;
}

const statusColors: Record<RoomStatus, string> = {
  AVAILABLE: "bg-emerald-500 hover:bg-emerald-600",
  OCCUPIED: "bg-blue-500 hover:bg-blue-600",
  DIRTY: "bg-amber-500 hover:bg-amber-600",
  MAINTENANCE: "bg-red-500 hover:bg-red-600",
};

export function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
  // Group rooms by floor
  const roomsByFloor = rooms.reduce(
    (acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = [];
      }
      acc[room.floor].push(room);
      return acc;
    },
    {} as Record<number, RoomWithType[]>
  );

  const floors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => b - a);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">Tổng quan trạng thái phòng</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Sẵn sàng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-purple-500" />
              <span className="text-muted-foreground">Đã đặt trước</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-blue-500" />
              <span className="text-muted-foreground">Có khách</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">Chưa dọn dẹp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Đang bảo trì</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="space-y-4">
            {floors.map((floor) => (
              <div key={floor} className="flex items-center gap-4">
                <div className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
                  Tầng {floor}
                </div>
                <div className="flex flex-wrap gap-2">
                  {roomsByFloor[floor]
                    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
                    .map((room) => {
                      const activeBooking = (room as any).bookings?.[0];
                      const isReserved = room.status === "AVAILABLE" && activeBooking && (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED");
                      const displayStatus = isReserved ? "RESERVED" : room.status;
                      const buttonBg = isReserved ? "bg-purple-50 hover:bg-purple-600" : statusColors[room.status];
                      const buttonClass = isReserved 
                        ? "bg-purple-500 hover:bg-purple-600 text-white" 
                        : cn(statusColors[room.status], "text-white");

                      return (
                        <Tooltip key={room.id}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onRoomClick?.(room)}
                              className={cn(
                                "flex size-12 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                                buttonClass,
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              )}
                            >
                              {room.roomNumber}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-0">
                            <div className="p-3 text-left">
                              <div className="flex items-center justify-between gap-4 mb-2">
                                <span className="font-semibold">Phòng {room.roomNumber}</span>
                                <RoomStatusBadge status={displayStatus} />
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                                <div>Loại phòng: {room.roomType.name}</div>
                                <div>Giá: {formatCurrency(room.roomType.pricePerNight)}/đêm</div>
                                <div>Sức chứa: {room.roomType.capacity} khách</div>
                                {isReserved && activeBooking && (
                                  <div className="text-purple-700 font-medium">
                                    📅 Đã đặt: {activeBooking.customerName} (từ {formatDate(activeBooking.checkInDate)})
                                  </div>
                                )}
                                {room.status === "OCCUPIED" && activeBooking && (
                                  <div className="text-blue-700 font-medium">
                                    👤 Khách: {activeBooking.customerName} (đến {formatDate(activeBooking.checkOutDate)})
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
