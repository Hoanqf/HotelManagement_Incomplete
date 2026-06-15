"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { StatsCard } from "@/components/stats-card";
import { RoomGrid } from "@/components/room-grid";
import { RecentBookingsTable } from "@/components/recent-bookings-table";
import { QuickActions } from "@/components/quick-actions";
import { RoomAPI } from "@/services/room.service";
import { BookingAPI } from "@/services/booking.service";
import { DashboardAPI } from "@/services/dashboard.service";
import type { RoomWithType, BookingWithRoom } from "@/lib/types";
import {
  BedDouble,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  activeBookings: number;
  todayRevenue: number;
  occupancyRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<RoomWithType[]>([]);
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsData, roomsData, bookingsData] = await Promise.all([
        DashboardAPI.getStats(),
        RoomAPI.getRooms(),
        BookingAPI.getBookings(),
      ]);
      setStats(statsData);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu thống kê tổng quan!");
    }
  };

  useEffect(() => {
    loadDashboardData().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader
            title="Tổng quan"
            subtitle="Đang tải dữ liệu tổng quan..."
          />
          <main className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const activeStats = stats || {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
    activeBookings: 0,
    todayRevenue: 0,
    occupancyRate: 0,
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Tổng quan"
          subtitle="Chào mừng trở lại! Dưới đây là tổng quan tình hình khách sạn của bạn."
        />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tổng số phòng"
              value={activeStats.totalRooms}
              subtitle={`${activeStats.availableRooms} phòng sẵn sàng`}
              icon={BedDouble}
              variant="default"
            />
            <StatsCard
              title="Tỷ lệ sử dụng phòng"
              value={`${activeStats.occupancyRate}%`}
              subtitle={`${activeStats.occupiedRooms} phòng đang có khách`}
              icon={TrendingUp}
              trend={{ value: 8, isPositive: true }}
              variant="info"
            />
            <StatsCard
              title="Khách lưu trú"
              value={activeStats.activeBookings}
              subtitle="Lượt nhận phòng hiện tại"
              icon={Users}
              variant="success"
            />
            <StatsCard
              title="Doanh thu hôm nay"
              value={new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activeStats.todayRevenue)}
              subtitle="Từ tất cả đặt phòng"
              icon={DollarSign}
              trend={{ value: 12, isPositive: true }}
              variant="success"
            />
          </div>

          {/* Room Status Alert */}
          {(activeStats.dirtyRooms > 0 || activeStats.maintenanceRooms > 0) && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-5 text-amber-600" />
              <div className="text-sm">
                <span className="font-medium text-amber-700">Cần lưu ý: </span>
                <span className="text-amber-600">
                  {activeStats.dirtyRooms > 0 && `${activeStats.dirtyRooms} phòng cần dọn dẹp`}
                  {activeStats.dirtyRooms > 0 && activeStats.maintenanceRooms > 0 && ", "}
                  {activeStats.maintenanceRooms > 0 && `${activeStats.maintenanceRooms} phòng đang bảo trì`}
                </span>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Room Grid - Takes 2 columns */}
            <div className="lg:col-span-2">
              <RoomGrid rooms={rooms} />
            </div>

            {/* Quick Actions - Takes 1 column */}
            <div>
              <QuickActions />
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="mt-6">
            <RecentBookingsTable bookings={bookings} />
          </div>
        </main>
      </div>
    </div>
  );
}
