"use client";

import { useState, useEffect } from "react";
import { Bell, Search, User, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { RoomAPI } from "@/services/room.service";
import { BookingAPI } from "@/services/booking.service";
import { DashboardAPI } from "@/services/dashboard.service";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  // --- HỆ THỐNG THÔNG BÁO ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Tải thông báo từ API & LocalStorage
  const fetchNotifications = async () => {
    try {
      const data = await DashboardAPI.getNotifications();
      const savedReadIdsStr = localStorage.getItem("read_notification_ids");
      const savedReadIds: string[] = savedReadIdsStr ? JSON.parse(savedReadIdsStr) : [];
      setReadIds(savedReadIds);

      const mapped = data.map((n: any) => ({
        ...n,
        read: savedReadIds.includes(n.id)
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener("refresh-notifications", handleRefresh);
    const interval = setInterval(fetchNotifications, 10000); // Poll mỗi 10 giây

    return () => {
      window.removeEventListener("refresh-notifications", handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem("read_notification_ids", JSON.stringify(newReadIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem("read_notification_ids", JSON.stringify(newReadIds));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getFriendlyTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 60000) {
        return "Vừa xong";
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      return "Không rõ thời gian";
    }
  };

  // --- HỆ THỐNG TÌM KIẾM TOÀN CỤC ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const loadSearchData = async () => {
    if (rooms.length > 0 && bookings.length > 0) return;
    setSearching(true);
    try {
      const [roomsData, bookingsData] = await Promise.all([
        RoomAPI.getRooms(),
        BookingAPI.getBookings(),
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu tìm kiếm:", error);
    } finally {
      setSearching(false);
    }
  };

  const filteredRooms = searchQuery.trim()
    ? rooms.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.roomType.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredBookings = searchQuery.trim()
    ? bookings.filter(
        (b) =>
          b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.room?.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 z-40">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Tìm kiếm toàn cục */}
        <div className="relative hidden md:block w-64" onFocus={loadSearchData}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm phòng, khách hàng..."
            className="w-full pl-9 h-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onBlur={() => {
              // Delay để tránh bị mất sự kiện click vào kết quả tìm kiếm
              setTimeout(() => setShowSearchResults(false), 200);
            }}
          />

          {showSearchResults && searchQuery.trim() && (
            <div className="absolute right-0 mt-2 w-96 rounded-lg border border-border bg-card p-3 shadow-lg z-50 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              {searching ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : filteredRooms.length === 0 && filteredBookings.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Không tìm thấy kết quả cho "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {/* Mục Phòng */}
                  {filteredRooms.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                        Phòng
                      </h4>
                      <div className="space-y-1">
                        {filteredRooms.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded-md p-2 hover:bg-muted/60 cursor-pointer text-sm"
                            onClick={() => {
                              router.push(`/rooms?search=${r.roomNumber}`);
                              setSearchQuery("");
                            }}
                          >
                            <div>
                              <span className="font-semibold text-foreground">Phòng {r.roomNumber}</span>
                              <span className="text-xs text-muted-foreground ml-2">({r.roomType.name})</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              r.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
                              r.status === "OCCUPIED" ? "bg-blue-100 text-blue-800" :
                              r.status === "DIRTY" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                            }`}>
                              {r.status === "AVAILABLE" ? "Trống" :
                               r.status === "OCCUPIED" ? "Có khách" :
                               r.status === "DIRTY" ? "Chưa dọn" : "Bảo trì"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mục Đặt phòng & Khách hàng */}
                  {filteredBookings.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                        Đặt phòng & Khách hàng
                      </h4>
                      <div className="space-y-1">
                        {filteredBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-col rounded-md p-2 hover:bg-muted/60 cursor-pointer text-sm"
                            onClick={() => {
                              router.push(`/bookings?search=${b.customerName}`);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-foreground">{b.customerName}</span>
                              <span className="text-xs text-muted-foreground font-medium">Phòng {b.room?.roomNumber}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
                              <span>{b.customerPhone}</span>
                              <span>Trạng thái: {
                                b.status === "PENDING" ? "Chờ xác nhận" :
                                b.status === "CONFIRMED" ? "Đã xác nhận" :
                                b.status === "CHECKED_IN" ? "Đang lưu trú" :
                                b.status === "CHECKED_OUT" ? "Đã trả phòng" : "Đã hủy"
                              }</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dropdown Thông báo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-1">
            <DropdownMenuLabel className="flex items-center justify-between font-bold text-sm px-3 py-2">
              <span>Thông báo hệ thống</span>
              {unreadCount > 0 && (
                <button 
                  onClick={(e) => { e.preventDefault(); markAllAsRead(); }} 
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Không có thông báo mới</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((n) => (
                  <DropdownMenuItem 
                    key={n.id} 
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-muted/50 border-b last:border-b-0"
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-xs font-bold ${n.read ? 'text-muted-foreground/80' : 'text-foreground'}`}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{getFriendlyTime(n.time)}</span>
                    </div>
                    <p className={`text-xs text-left ${n.read ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                      {n.content}
                    </p>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3 hover:bg-muted/50">
              <Avatar className="size-8 border">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex text-left">
                <span className="text-xs font-bold leading-none">
                  {user?.fullName || "Guest"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {user?.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
              <User className="mr-2 size-4" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={logout} 
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
            >
              <LogOut className="mr-2 size-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}