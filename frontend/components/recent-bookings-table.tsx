import type { BookingWithRoom } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentBookingsTableProps {
  bookings: BookingWithRoom[];
}

export function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd/MM/yyyy");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">Đặt phòng gần đây</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings" className="gap-1 text-xs">
            Xem tất cả
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead className="hidden sm:table-cell">Nhận phòng</TableHead>
              <TableHead className="hidden md:table-cell">Trả phòng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.slice(0, 5).map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.customerPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.room.roomNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.room.roomType.name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(booking.checkInDate)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(booking.checkOutDate)}
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(Number(booking.totalAmount))}
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Chưa có đặt phòng nào gần đây.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
