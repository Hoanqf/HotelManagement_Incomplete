"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { RoomAPI } from "@/services/room.service";
import { BookingAPI } from "@/services/booking.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  Search,
} from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Chờ xác nhận";
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "CHECKED_IN") return "Đã nhận phòng";
  if (status === "CHECKED_OUT") return "Đã trả phòng";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function getStatusClass(status: string) {
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "CONFIRMED") return "bg-blue-100 text-blue-700";
  if (status === "CHECKED_IN") return "bg-green-100 text-green-700";
  if (status === "CHECKED_OUT") return "bg-gray-100 text-gray-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-muted text-muted-foreground";
}

export default function BookingsPage() {
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    roomId: "",
    bookingSource: "WALK_IN",
    note: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, roomsData] = await Promise.all([
        BookingAPI.getBookings(),
        RoomAPI.getRooms(),
      ]);
      setBookingsList(bookingsData);
      setRoomsList(roomsData);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Đọc query param 'search'
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.roomId || !formData.checkInDate || !formData.checkOutDate) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      await BookingAPI.createBooking({
        ...formData,
        guests: Number(formData.guests),
      });
      toast.success("Đặt phòng thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      setOpenBookingDialog(false);
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        checkInDate: "",
        checkOutDate: "",
        guests: 1,
        roomId: "",
        bookingSource: "WALK_IN",
        note: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Tạo đặt phòng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    let confirmMessage = "";
    if (status === "CHECKED_IN") confirmMessage = "Xác nhận nhận phòng?";
    if (status === "CHECKED_OUT") confirmMessage = "Xác nhận trả phòng?";
    if (status === "CANCELLED") confirmMessage = "Bạn có chắc muốn hủy đặt phòng này?";

    if (confirm(confirmMessage)) {
      try {
        await BookingAPI.updateBookingStatus(id, status);
        toast.success("Cập nhật trạng thái thành công!");
        window.dispatchEvent(new Event("refresh-notifications"));
        loadData();
      } catch (error: any) {
        toast.error(error.message || "Không thể cập nhật trạng thái");
      }
    }
  };

  const showDetail = (booking: any) => {
    setSelectedBooking(booking);
    setOpenDetailDialog(true);
  };

  // Tính toán số liệu thống kê
  const totalBookings = bookingsList.length;
  const pendingBookings = bookingsList.filter((b) => b.status === "PENDING").length;
  const checkedInBookings = bookingsList.filter((b) => b.status === "CHECKED_IN").length;
  const totalRevenue = bookingsList
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  // --- BỘ LỌC TÌM KIẾM ---
  const filteredBookings = bookingsList.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.toLowerCase().includes(q) ||
      (b.room?.roomNumber && b.room.roomNumber.toLowerCase().includes(q)) ||
      (b.room?.roomType?.name && b.room.roomType.name.toLowerCase().includes(q))
    );
  });

  // Chỉ lấy danh sách phòng trống phục vụ đặt phòng
  const availableRooms = roomsList.filter(r => r.status === "AVAILABLE");

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Đặt phòng"
          subtitle="Quản lý đặt phòng, nhận phòng và trả phòng"
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quản lý đặt phòng</h2>
              <p className="text-sm text-muted-foreground">
                Theo dõi danh sách đặt phòng và trạng thái lưu trú của khách hàng
              </p>
            </div>

            <Button onClick={() => setOpenBookingDialog(true)}>
              <Plus className="mr-2 size-4" />
              Tạo đặt phòng
            </Button>
          </div>

          {/* Cards thống kê */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-blue-100 p-3">
                  <CalendarDays className="size-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đặt phòng</p>
                  <h3 className="text-2xl font-bold">{totalBookings}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-amber-100 p-3">
                  <Clock className="size-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
                  <h3 className="text-2xl font-bold">{pendingBookings}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="size-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đang lưu trú</p>
                  <h3 className="text-2xl font-bold">{checkedInBookings}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-purple-100 p-3">
                  <CalendarDays className="size-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doanh thu dự kiến</p>
                  <h3 className="text-xl font-bold">
                    {formatCurrency(totalRevenue)}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

           {/* Bảng Đặt phòng */}
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
              <CardTitle>Danh sách đặt phòng</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm khách hàng, phòng..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                  <p>Không tìm thấy thông tin đặt phòng nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left">Mã đặt phòng</th>
                        <th className="p-4 text-left">Khách hàng</th>
                        <th className="p-4 text-left">Phòng</th>
                        <th className="p-4 text-left">Thời gian</th>
                        <th className="p-4 text-left">Số khách</th>
                        <th className="p-4 text-left">Nguồn</th>
                        <th className="p-4 text-left">Tổng tiền</th>
                        <th className="p-4 text-left">Trạng thái</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-muted/40">
                          <td className="p-4 font-medium">BK-{1000 + Number(booking.id)}</td>

                          <td className="p-4">
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.customerPhone}
                            </p>
                          </td>

                          <td className="p-4">
                            <Badge variant="outline">
                              Phòng {booking.room?.roomNumber}
                            </Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {booking.room?.roomType?.name}
                            </p>
                          </td>

                          <td className="p-4">
                            <p>{formatDate(booking.checkInDate)}</p>
                            <p className="text-xs text-muted-foreground">
                              đến {formatDate(booking.checkOutDate)}
                            </p>
                          </td>

                          <td className="p-4">{booking.guests || 1} khách</td>

                          <td className="p-4 uppercase">{booking.bookingSource}</td>

                          <td className="p-4 font-semibold">
                            {formatCurrency(Number(booking.totalAmount))}
                          </td>

                          <td className="p-4">
                            <Badge className={getStatusClass(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => showDetail(booking)}>
                                <Eye className="mr-1 size-4" />
                                Xem
                              </Button>

                              {booking.status === "PENDING" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => handleUpdateStatus(booking.id, "CHECKED_IN")}
                                >
                                  <LogIn className="mr-1 size-4" />
                                  Nhận phòng
                                </Button>
                              )}

                              {booking.status === "CHECKED_IN" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handleUpdateStatus(booking.id, "CHECKED_OUT")}
                                >
                                  <LogOut className="mr-1 size-4" />
                                  Trả phòng
                                </Button>
                              )}

                              {["PENDING", "CONFIRMED"].includes(booking.status) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                                >
                                  <XCircle className="mr-1 size-4" />
                                  Hủy đặt
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog Tạo đặt phòng */}
          <Dialog open={openBookingDialog} onOpenChange={setOpenBookingDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tạo đặt phòng mới</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateBooking} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Họ tên khách hàng <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerName"
                      placeholder="Nguyễn Văn A"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Số điện thoại <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerPhone"
                      placeholder="0901234567"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="example@gmail.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Ngày nhận phòng <span className="text-red-500">*</span></Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Ngày trả phòng <span className="text-red-500">*</span></Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guests">Số khách</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="roomId">Chọn phòng trống <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(val) => setFormData({ ...formData, roomId: val })}
                    >
                      <SelectTrigger id="roomId">
                        <SelectValue placeholder="Chọn phòng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Phòng {room.roomNumber} ({room.roomType?.name} - {formatCurrency(Number(room.roomType?.pricePerNight))}/đêm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingSource">Nguồn đặt phòng</Label>
                  <Select
                    value={formData.bookingSource}
                    onValueChange={(val) => setFormData({ ...formData, bookingSource: val })}
                  >
                    <SelectTrigger id="bookingSource">
                      <SelectValue placeholder="Chọn nguồn..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WALK_IN">Walk-in (Trực tiếp)</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="BOOKING_COM">Booking.com</SelectItem>
                      <SelectItem value="AGODA">Agoda</SelectItem>
                      <SelectItem value="AIRBNB">Airbnb</SelectItem>
                      <SelectItem value="TRAVELOKA">Traveloka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Input
                    id="note"
                    placeholder="Yêu cầu đặc biệt..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenBookingDialog(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu đặt phòng
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Chi tiết Đặt phòng */}
          <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Chi tiết Đặt phòng</DialogTitle>
              </DialogHeader>

              {selectedBooking && (
                <div className="space-y-4 py-4 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Mã đặt phòng:</span>
                    <span className="col-span-2 font-bold">BK-{1000 + Number(selectedBooking.id)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Khách hàng:</span>
                    <span className="col-span-2 font-medium">{selectedBooking.customerName}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Số điện thoại:</span>
                    <span className="col-span-2">{selectedBooking.customerPhone}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Email:</span>
                    <span className="col-span-2">{selectedBooking.customerEmail || "(Trống)"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Phòng:</span>
                    <span className="col-span-2">
                      Phòng {selectedBooking.room?.roomNumber} ({selectedBooking.room?.roomType?.name})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Thời gian lưu trú:</span>
                    <span className="col-span-2">
                      {formatDate(selectedBooking.checkInDate)} đến {formatDate(selectedBooking.checkOutDate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Số khách:</span>
                    <span className="col-span-2">{selectedBooking.guests || 1} khách</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Nguồn:</span>
                    <span className="col-span-2 uppercase">{selectedBooking.bookingSource}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Tổng tiền:</span>
                    <span className="col-span-2 font-bold text-primary">
                      {formatCurrency(Number(selectedBooking.totalAmount))}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-semibold text-muted-foreground">Trạng thái:</span>
                    <span className="col-span-2">
                      <Badge className={getStatusClass(selectedBooking.status)}>
                        {getStatusLabel(selectedBooking.status)}
                      </Badge>
                    </span>
                  </div>

                  {selectedBooking.note && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-muted-foreground">Ghi chú:</span>
                      <span className="col-span-2 italic text-muted-foreground">{selectedBooking.note}</span>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}