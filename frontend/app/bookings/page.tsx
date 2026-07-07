"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { RoomAPI } from "@/services/room.service";
import { BookingAPI } from "@/services/booking.service";
import { InvoiceAPI } from "@/services/invoice.service";
import { useAuth } from "@/contexts/auth-context";
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
  const { user } = useAuth();
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [openCheckoutPaymentDialog, setOpenCheckoutPaymentDialog] = useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = useState<any>(null);
  const [checkoutPayAmount, setCheckoutPayAmount] = useState(0);
  const [checkoutPayMethod, setCheckoutPayMethod] = useState("CASH");
  const [checkoutPayNote, setCheckoutPayNote] = useState("Thanh toán khi trả phòng");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // States for confirmation dialogs
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("Khách hủy lịch");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [openCheckInDialog, setOpenCheckInDialog] = useState(false);
  const [selectedCheckInBooking, setSelectedCheckInBooking] = useState<any>(null);
  const [checkInNote, setCheckInNote] = useState("Nhận phòng");
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);

  const [openPaidCheckoutDialog, setOpenPaidCheckoutDialog] = useState(false);
  const [selectedPaidCheckoutBooking, setSelectedPaidCheckoutBooking] = useState<any>(null);
  const [paidCheckoutNote, setPaidCheckoutNote] = useState("Trả phòng hoàn tất");
  const [paidCheckoutSubmitting, setPaidCheckoutSubmitting] = useState(false);

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
    nationality: "Việt Nam",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    roomId: "",
    bookingSource: "WALK_IN",
    bookingType: "DAILY",
    note: "",
  });

  const [phoneSuggestions, setPhoneSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const phone = formData.customerPhone;
      if (phone && phone.length >= 3) {
        try {
          const res = await fetch(`http://localhost:5000/api/customers/search?phone=${encodeURIComponent(phone)}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setPhoneSuggestions([data]);
            } else {
              setPhoneSuggestions([]);
            }
          }
        } catch (err) {
          console.error("Lỗi gợi ý SĐT:", err);
        }
      } else {
        setPhoneSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [formData.customerPhone]);

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
  
  // Tự động xóa phòng đã chọn nếu người dùng thay đổi ngày dẫn đến phòng không còn trống
  useEffect(() => {
    if (formData.roomId && formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      if (checkOut > checkIn) {
        const isStillAvailable = roomsList.some((room) => {
          if (room.id !== formData.roomId || room.status === "MAINTENANCE" || room.status === "DIRTY") return false;
          
          const hasOverlap = bookingsList.some((booking) => {
            const isActiveBooking = ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status);
            if (!isActiveBooking || booking.roomId !== room.id) return false;
            
            const bCheckIn = new Date(booking.checkInDate);
            const bCheckOut = new Date(booking.checkOutDate);
            return checkIn < bCheckOut && checkOut > bCheckIn;
          });
          return !hasOverlap;
        });

        if (!isStillAvailable) {
          setFormData(prev => ({ ...prev, roomId: "" }));
        }
      } else {
        setFormData(prev => ({ ...prev, roomId: "" }));
      }
    } else if (formData.roomId) {
      setFormData(prev => ({ ...prev, roomId: "" }));
    }
  }, [formData.checkInDate, formData.checkOutDate, roomsList, bookingsList, formData.roomId]);

  // Reset form khi đóng hộp thoại đặt phòng
  useEffect(() => {
    if (!openBookingDialog) {
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        nationality: "Việt Nam",
        checkInDate: "",
        checkOutDate: "",
        guests: 1,
        roomId: "",
        bookingSource: "WALK_IN",
        bookingType: "DAILY",
        note: "",
      });
    }
  }, [openBookingDialog]);

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
        nationality: "Việt Nam",
        checkInDate: "",
        checkOutDate: "",
        guests: 1,
        roomId: "",
        bookingSource: "WALK_IN",
        bookingType: "DAILY",
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

  const handleCancelClick = (booking: any) => {
    setSelectedCancelBooking(booking);
    setCancelReason("Khách hủy lịch");
    setOpenCancelDialog(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedCancelBooking) return;
    setCancelSubmitting(true);
    try {
      await BookingAPI.updateBookingStatus(selectedCancelBooking.id, "CANCELLED");
      toast.success("Hủy đặt phòng thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      setOpenCancelDialog(false);
      setSelectedCancelBooking(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể hủy đặt phòng");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleCheckInClick = (booking: any) => {
    setSelectedCheckInBooking(booking);
    setCheckInNote("Nhận phòng");
    setOpenCheckInDialog(true);
  };

  const handleCheckInSubmit = async () => {
    if (!selectedCheckInBooking) return;
    setCheckInSubmitting(true);
    try {
      await BookingAPI.updateBookingStatus(selectedCheckInBooking.id, "CHECKED_IN");
      toast.success("Nhận phòng thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      setOpenCheckInDialog(false);
      setSelectedCheckInBooking(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể nhận phòng");
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const handlePaidCheckoutSubmit = async () => {
    if (!selectedPaidCheckoutBooking) return;
    setPaidCheckoutSubmitting(true);
    try {
      await BookingAPI.updateBookingStatus(selectedPaidCheckoutBooking.id, "CHECKED_OUT");
      toast.success("Trả phòng thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      setOpenPaidCheckoutDialog(false);
      setSelectedPaidCheckoutBooking(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật trạng thái");
    } finally {
      setPaidCheckoutSubmitting(false);
    }
  };

  const handleCheckoutClick = async (booking: any) => {
    let invoice = booking.invoice;
    if (!invoice) {
      setLoading(true);
      try {
        const res = await InvoiceAPI.createInvoice({
          bookingId: booking.id,
          status: "UNPAID",
          discount: 0,
          processedBy: user?.fullName || "Hệ thống"
        });
        invoice = res.data;
      } catch (error: any) {
        toast.error(error.message || "Không thể tạo hóa đơn cho phòng này");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    const totalAmt = Number(invoice.totalAmount);
    const totalPaidAmt = invoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const remainingAmt = Math.max(0, totalAmt - totalPaidAmt);

    if (remainingAmt <= 0) {
      setSelectedPaidCheckoutBooking(booking);
      setPaidCheckoutNote("Trả phòng hoàn tất");
      setOpenPaidCheckoutDialog(true);
    } else {
      setSelectedBooking(booking);
      setCheckoutInvoice(invoice);
      setCheckoutPayAmount(remainingAmt);
      setCheckoutPayMethod("CASH");
      setCheckoutPayNote("Thanh toán khi trả phòng");
      setOpenCheckoutPaymentDialog(true);
    }
  };

  const handleCheckoutPaymentSubmit = async () => {
    if (!checkoutInvoice || !selectedBooking) return;
    setCheckoutSubmitting(true);
    try {
      // 1. Thực hiện thanh toán hóa đơn
      await InvoiceAPI.payInvoice(checkoutInvoice.id, {
        amount: Number(checkoutPayAmount),
        paymentMethod: checkoutPayMethod,
        note: checkoutPayNote || "Thanh toán khi trả phòng",
        processedBy: user?.fullName || "Hệ thống"
      });

      // 2. Cập nhật trạng thái check-out cho phòng
      await BookingAPI.updateBookingStatus(selectedBooking.id, "CHECKED_OUT");

      toast.success("Thanh toán & Trả phòng thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      setOpenCheckoutPaymentDialog(false);
      setSelectedBooking(null);
      setCheckoutInvoice(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xử lý thanh toán & trả phòng");
    } finally {
      setCheckoutSubmitting(false);
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

  // Lấy danh sách phòng trống không bị trùng lịch đặt phòng trong khoảng thời gian đã chọn
  const getAvailableRooms = () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      return roomsList.filter(r => r.status === "AVAILABLE");
    }

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    if (checkOut <= checkIn) {
      return [];
    }

    return roomsList.filter((room) => {
      // 1. Nếu phòng đang bảo trì hoặc chưa dọn dẹp thì không cho đặt
      if (room.status === "MAINTENANCE" || room.status === "DIRTY") {
        return false;
      }

      // 2. Lọc các phòng bị trùng lịch đặt phòng
      const hasOverlap = bookingsList.some((booking) => {
        const isActiveBooking = ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status);
        if (!isActiveBooking || booking.roomId !== room.id) {
          return false;
        }

        const bCheckIn = new Date(booking.checkInDate);
        const bCheckOut = new Date(booking.checkOutDate);

        return checkIn < bCheckOut && checkOut > bCheckIn;
      });

      return !hasOverlap;
    });
  };

  const availableRooms = getAvailableRooms();

  const getEstimatedPrice = () => {
    if (!formData.roomId || !formData.checkInDate || !formData.checkOutDate) return null;
    const room = roomsList.find(r => r.id === formData.roomId);
    if (!room) return null;
    
    const rt = room.roomType;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) return null;

    const priceHourly = Number(rt.priceHourly || rt.pricePerNight / 10 || 0);
    const priceDaily = Number(rt.priceDaily || rt.pricePerNight || 0);
    const priceOvernight = Number(rt.priceOvernight || rt.pricePerNight * 0.7 || 0);

    if (formData.bookingType === "HOURLY") {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      let hours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (hours <= 0) hours = 1;
      return {
        amount: priceHourly * hours,
        label: `${hours} giờ x ${formatCurrency(priceHourly)}/giờ`
      };
    } else {
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (nights <= 0) nights = 1;
      const rate = formData.bookingType === "OVERNIGHT" ? priceOvernight : priceDaily;
      const labelStr = formData.bookingType === "OVERNIGHT" ? "đêm" : "ngày";
      return {
        amount: rate * nights,
        label: `${nights} ${labelStr} x ${formatCurrency(rate)}/${labelStr}`
      };
    }
  };

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
                                  onClick={() => handleCheckInClick(booking)}
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
                                  onClick={() => handleCheckoutClick(booking)}
                                >
                                  <LogOut className="mr-1 size-4" />
                                  Trả phòng
                                </Button>
                              )}

                              {["PENDING", "CONFIRMED"].includes(booking.status) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelClick(booking)}
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

                  <div className="space-y-2 relative">
                    <Label htmlFor="customerPhone">Số điện thoại <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerPhone"
                      placeholder="0901234567"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      required
                      autoComplete="off"
                    />
                    {phoneSuggestions.length > 0 && (
                      <div className="absolute z-[100] left-0 right-0 top-[66px] bg-popover border rounded-md shadow-lg overflow-hidden border-border">
                        {phoneSuggestions.map((cust) => (
                          <div 
                            key={cust.id} 
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                customerPhone: cust.phoneNumber,
                                customerName: cust.fullName,
                                customerEmail: cust.email || "",
                                nationality: cust.nationality || "Việt Nam"
                              }));
                              setPhoneSuggestions([]);
                            }}
                            className="p-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer flex flex-col gap-0.5 border-b last:border-b-0"
                          >
                            <span className="font-bold text-foreground">{cust.fullName}</span>
                            <span className="text-[10px] text-muted-foreground">SĐT: {cust.phoneNumber} | Quốc tịch: {cust.nationality}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="customerNation">Quốc tịch</Label>
                    <select
                      id="customerNation"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    >
                      {["Việt Nam", "Mỹ", "Anh", "Ireland", "Hàn Quốc", "Nhật Bản", "Trung Quốc", "Pháp", "Đức", "Úc", "Singapore"].map(n => <option key={n} value={n}>{n}</option>)}
                      {!["Việt Nam", "Mỹ", "Anh", "Ireland", "Hàn Quốc", "Nhật Bản", "Trung Quốc", "Pháp", "Đức", "Úc", "Singapore"].includes(formData.nationality) && (
                        <option value={formData.nationality}>{formData.nationality}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingType">Hình thức thuê</Label>
                    <Select
                      value={formData.bookingType}
                      onValueChange={(val) => setFormData({ ...formData, bookingType: val })}
                    >
                      <SelectTrigger id="bookingType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Theo ngày</SelectItem>
                        <SelectItem value="HOURLY">Theo giờ</SelectItem>
                        <SelectItem value="OVERNIGHT">Qua đêm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Giờ/Ngày nhận <span className="text-red-500">*</span></Label>
                    <Input
                      id="checkInDate"
                      type="datetime-local"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Giờ/Ngày trả <span className="text-red-500">*</span></Label>
                    <Input
                      id="checkOutDate"
                      type="datetime-local"
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

                {(() => {
                  const est = getEstimatedPrice();
                  if (!est) return null;
                  return (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Hình thức thuê:</span>
                        <span className="font-semibold text-foreground">
                          {formData.bookingType === "HOURLY" ? "Theo giờ" : formData.bookingType === "OVERNIGHT" ? "Qua đêm" : "Theo ngày"}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Chi tiết tạm tính:</span>
                        <span className="font-semibold text-foreground">{est.label}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-primary border-t pt-1.5 mt-1">
                        <span>Tiền phòng (tạm tính):</span>
                        <span>{formatCurrency(est.amount)}</span>
                      </div>
                    </div>
                  );
                })()}

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

          {/* Dialog Thanh toán & Trả phòng */}
          <Dialog open={openCheckoutPaymentDialog} onOpenChange={setOpenCheckoutPaymentDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                  <span>💰</span> Hóa đơn thanh toán - Phòng {selectedBooking?.room?.roomNumber}
                </DialogTitle>
              </DialogHeader>

              {checkoutInvoice && (
                <div className="space-y-4 py-4 text-sm">
                  {/* Tóm tắt hóa đơn */}
                  <div className="border rounded-xl p-4 bg-muted/30 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Mã hóa đơn:</span>
                      <span className="font-mono font-bold">{checkoutInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Khách hàng:</span>
                      <span className="font-semibold">{selectedBooking?.customerName}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Tổng tiền hóa đơn:</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(checkoutInvoice.totalAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đã thanh toán trước đó:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(
                          checkoutInvoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-bold text-primary text-base">
                      <span>Số tiền còn thiếu:</span>
                      <span>
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(checkoutInvoice.totalAmount) -
                              (checkoutInvoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0)
                          )
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Form thanh toán */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="checkout-pay-amt" className="text-xs font-semibold">
                        Số tiền thanh toán thực tế (VND) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="checkout-pay-amt"
                        type="number"
                        value={checkoutPayAmount}
                        onChange={(e) => setCheckoutPayAmount(Number(e.target.value))}
                        min={1000}
                        max={Math.max(
                          0,
                          Number(checkoutInvoice.totalAmount) -
                            (checkoutInvoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0)
                        )}
                        className="font-bold text-base"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="checkout-pay-method" className="text-xs font-semibold">
                        Phương thức thanh toán <span className="text-red-500">*</span>
                      </Label>
                      <Select value={checkoutPayMethod} onValueChange={(val: any) => setCheckoutPayMethod(val)}>
                        <SelectTrigger id="checkout-pay-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Tiền mặt</SelectItem>
                          <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
                          <SelectItem value="CARD">Thẻ ngân hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="checkout-pay-note" className="text-xs font-semibold">
                        Ghi chú
                      </Label>
                      <Input
                        id="checkout-pay-note"
                        value={checkoutPayNote}
                        onChange={(e) => setCheckoutPayNote(e.target.value)}
                        placeholder="Thanh toán khi trả phòng..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenCheckoutPaymentDialog(false)}
                  disabled={checkoutSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  onClick={handleCheckoutPaymentSubmit}
                  disabled={checkoutSubmitting || checkoutPayAmount <= 0}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {checkoutSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Thanh toán & Trả phòng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Hủy đặt phòng */}
          <Dialog open={openCancelDialog} onOpenChange={open => {
            if (!open) {
              setOpenCancelDialog(false);
              setSelectedCancelBooking(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                  <XCircle className="size-5" /> Hủy đặt phòng
                </DialogTitle>
              </DialogHeader>

              {selectedCancelBooking && (
                <div className="space-y-4 py-4 text-sm">
                  <div className="border rounded-xl p-4 bg-red-50/10 border-red-100/10 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Mã đặt phòng:</span>
                      <span className="font-mono font-bold">BK-{1000 + Number(selectedCancelBooking.id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Khách hàng:</span>
                      <span className="font-semibold">{selectedCancelBooking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Số điện thoại:</span>
                      <span>{selectedCancelBooking.customerPhone}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Phòng đã chọn:</span>
                      <span className="font-semibold text-foreground">
                        Phòng {selectedCancelBooking.room?.roomNumber} ({selectedCancelBooking.room?.roomType?.name})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="cancel-reason" className="text-xs font-semibold">
                      Lý do hủy đặt phòng <span className="text-red-500">*</span>
                    </Label>
                    <Select value={cancelReason} onValueChange={(val) => setCancelReason(val)}>
                      <SelectTrigger id="cancel-reason">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Khách hủy lịch">Khách hàng thay đổi kế hoạch / Hủy lịch</SelectItem>
                        <SelectItem value="Đặt trùng phòng">Đặt trùng phòng / Nhầm lẫn thông tin</SelectItem>
                        <SelectItem value="Lý do khác">Lý do đột xuất khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenCancelDialog(false);
                    setSelectedCancelBooking(null);
                  }}
                  disabled={cancelSubmitting}
                >
                  Bỏ qua
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelSubmit}
                  disabled={cancelSubmitting}
                  variant="destructive"
                  className="font-semibold"
                >
                  {cancelSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Xác nhận hủy đặt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Nhận phòng */}
          <Dialog open={openCheckInDialog} onOpenChange={open => {
            if (!open) {
              setOpenCheckInDialog(false);
              setSelectedCheckInBooking(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                  <LogIn className="size-5" /> Xác nhận nhận phòng
                </DialogTitle>
              </DialogHeader>

              {selectedCheckInBooking && (
                <div className="space-y-4 py-4 text-sm">
                  <div className="border rounded-xl p-4 bg-emerald-50/10 border-emerald-100/10 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Mã đặt phòng:</span>
                      <span className="font-mono font-bold">BK-{1000 + Number(selectedCheckInBooking.id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Khách hàng:</span>
                      <span className="font-semibold">{selectedCheckInBooking.customerName}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Phòng:</span>
                      <span className="font-semibold text-emerald-600">
                        Phòng {selectedCheckInBooking.room?.roomNumber} ({selectedCheckInBooking.room?.roomType?.name})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span>
                        {formatDate(selectedCheckInBooking.checkInDate)} đến {formatDate(selectedCheckInBooking.checkOutDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số khách:</span>
                      <span>{selectedCheckInBooking.guests || 1} khách</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="checkin-note" className="text-xs font-semibold">
                      Ghi chú nhận phòng
                    </Label>
                    <Input
                      id="checkin-note"
                      value={checkInNote}
                      onChange={(e) => setCheckInNote(e.target.value)}
                      placeholder="Ghi chú thêm khi nhận phòng..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenCheckInDialog(false);
                    setSelectedCheckInBooking(null);
                  }}
                  disabled={checkInSubmitting}
                >
                  Bỏ qua
                </Button>
                <Button
                  type="button"
                  onClick={handleCheckInSubmit}
                  disabled={checkInSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {checkInSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Xác nhận nhận phòng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Trả phòng (Đã thanh toán) */}
          <Dialog open={openPaidCheckoutDialog} onOpenChange={open => {
            if (!open) {
              setOpenPaidCheckoutDialog(false);
              setSelectedPaidCheckoutBooking(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-600">
                  <LogOut className="size-5" /> Xác nhận trả phòng
                </DialogTitle>
              </DialogHeader>

              {selectedPaidCheckoutBooking && (
                <div className="space-y-4 py-4 text-sm">
                  <div className="border rounded-xl p-4 bg-blue-50/10 border-blue-100/10 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Mã đặt phòng:</span>
                      <span className="font-mono font-bold">BK-{1000 + Number(selectedPaidCheckoutBooking.id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Khách hàng:</span>
                      <span className="font-semibold">{selectedPaidCheckoutBooking.customerName}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Phòng trả:</span>
                      <span className="font-semibold text-blue-600">
                        Phòng {selectedPaidCheckoutBooking.room?.roomNumber} ({selectedPaidCheckoutBooking.room?.roomType?.name})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trạng thái thanh toán:</span>
                      <span className="font-bold text-emerald-600 uppercase">ĐÃ THANH TOÁN ĐẦY ĐỦ</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-semibold">
                      <span className="text-muted-foreground">Tổng tiền hóa đơn:</span>
                      <span>{formatCurrency(Number(selectedPaidCheckoutBooking.invoice?.totalAmount || selectedPaidCheckoutBooking.totalAmount))}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="paid-checkout-note" className="text-xs font-semibold">
                      Ghi chú trả phòng
                    </Label>
                    <Input
                      id="paid-checkout-note"
                      value={paidCheckoutNote}
                      onChange={(e) => setPaidCheckoutNote(e.target.value)}
                      placeholder="Ghi chú thêm khi trả phòng..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenPaidCheckoutDialog(false);
                    setSelectedPaidCheckoutBooking(null);
                  }}
                  disabled={paidCheckoutSubmitting}
                >
                  Bỏ qua
                </Button>
                <Button
                  type="button"
                  onClick={handlePaidCheckoutSubmit}
                  disabled={paidCheckoutSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {paidCheckoutSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Xác nhận trả phòng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}