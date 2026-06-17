"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoorOpen, Wrench, Wifi, Loader2, Plus, Trash2, ConciergeBell } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { RoomAPI } from "@/services/room.service";
import { MaintenanceAPI } from "@/services/maintenance.service";
import { ServiceAPI } from "@/services/service.service";
import { BookingAPI } from "@/services/booking.service";
import { InvoiceAPI } from "@/services/invoice.service";

import { 
  roomTypes as defaultRoomTypes, 
  amenities as initialAmenities,
} from "@/lib/mock-data";
import type { RoomWithType, MaintenanceRecordWithDetails, Amenity } from "@/lib/types";

import { RoomsTab } from "./rooms/rooms-tab"; 
import { MaintenanceTab } from "./maintenance/maintenance-tab";
import { AmenitiesTab } from "./amenities/amenities-tab";

const filterOptions = [
  { value: "all", label: "Tất cả phòng" },
  { value: "AVAILABLE", label: "Sẵn sàng" },
  { value: "RESERVED", label: "Đã đặt trước" },
  { value: "OCCUPIED", label: "Có khách" },
  { value: "DIRTY", label: "Chưa dọn dẹp" },
  { value: "MAINTENANCE", label: "Đang bảo trì" },
];
const amenityCategories = ["COMFORT", "ENTERTAINMENT", "BATHROOM", "KITCHEN", "OUTDOOR"] as const;

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithType[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecordWithDetails[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>(defaultRoomTypes);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // States cho tính năng tích hợp Dịch vụ phòng (Room Service) & Operations
  const [selectedOccupiedRoom, setSelectedOccupiedRoom] = useState<RoomWithType | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [activeBookingServices, setActiveBookingServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [addingService, setAddingService] = useState(false);

  // States mới cho Quản lý phòng nâng cao (Operations)
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [extending, setExtending] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [quickPaying, setQuickPaying] = useState(false);
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const [quickPayAmount, setQuickPayAmount] = useState(0);
  const [quickPayMethod, setQuickPayMethod] = useState("CASH");
  const [quickPayNote, setQuickPayNote] = useState("Thanh toán nhanh");

  // States cho tính năng Đặt phòng nhanh (Quick Booking)
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [quickBookingRoom, setQuickBookingRoom] = useState<RoomWithType | null>(null);
  const [quickBookingSubmitting, setQuickBookingSubmitting] = useState(false);
  const [checkInImmediately, setCheckInImmediately] = useState(true);
  const [quickBookingForm, setQuickBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    guests: 2,
    checkInDate: "",
    checkOutDate: "",
    bookingSource: "WALK_IN",
    bookingType: "DAILY",
    note: ""
  });

  // --- TẢI DỮ LIỆU TỪ APIs / LOCAL STORAGE ---
  const loadData = async () => {
    try {
      const [roomsData, maintenanceData, roomTypesData] = await Promise.all([
        RoomAPI.getRooms(),
        MaintenanceAPI.getMaintenanceRecords(),
        RoomAPI.getRoomTypes().catch(() => defaultRoomTypes)
      ]);
      setRooms(roomsData);
      setMaintenanceRecords(maintenanceData);
      setRoomTypes(roomTypesData);
      return roomsData;
    } catch (error: any) {
      toast.error("Không thể tải danh sách phòng hoặc bảo trì");
      return null;
    }
  };

  useEffect(() => {
    // 1. Tải dữ liệu phòng & bảo trì
    loadData().finally(() => setLoading(false));

    // 2. Tải tiện nghi từ Local Storage
    const storedAmenities = localStorage.getItem("pms_amenities");
    if (storedAmenities) {
      setAmenities(JSON.parse(storedAmenities));
    } else {
      setAmenities(initialAmenities);
      localStorage.setItem("pms_amenities", JSON.stringify(initialAmenities));
    }

    // Đọc query param 'search'
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  // --- BỘ LỌC PHÒNG ---
  const filteredRooms = rooms.filter((room) => {
    const activeBooking = room.bookings?.[0];
    const isReserved = room.status === "AVAILABLE" && activeBooking && (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED");

    if (statusFilter !== "all") {
      if (statusFilter === "AVAILABLE") {
        if (room.status !== "AVAILABLE" || isReserved) return false;
      } else if (statusFilter === "RESERVED") {
        if (!isReserved) return false;
      } else {
        if (room.status !== statusFilter) return false;
      }
    }
    
    if (floorFilter !== "all" && room.floor !== parseInt(floorFilter)) return false;
    if (typeFilter !== "all" && room.roomTypeId !== typeFilter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = room.roomNumber.toLowerCase().includes(q);
      const matchType = room.roomType.name.toLowerCase().includes(q);
      if (!matchNumber && !matchType) return false;
    }
    
    return true;
  });

  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // --- CRUD PHÒNG (DATABASE) ---
  const handleSaveRoom = async (data: any) => {
    try {
      // Tìm danh sách tên tiện nghi tương ứng từ các ID tiện nghi được chọn
      const selectedAmenities = amenities
        .filter((a) => data.amenityIds?.includes(a.id))
        .map((a) => a.name);

      if (data.id) {
        // Cập nhật phòng
        await RoomAPI.updateRoom(data.id, {
          roomNumber: data.roomNumber,
          floor: data.floor,
          status: data.status,
          roomTypeId: data.roomTypeId,
          pricePerNight: data.pricePerNight,
          maxGuests: data.maxGuests,
          note: data.description,
          amenities: selectedAmenities // Đồng bộ lên database
        });
        toast.success("Cập nhật phòng thành công!");
      } else {
        // Thêm phòng mới
        await RoomAPI.createRoom({
          roomNumber: data.roomNumber,
          floor: data.floor,
          status: data.status,
          roomTypeId: data.roomTypeId,
          pricePerNight: data.pricePerNight,
          maxGuests: data.maxGuests,
          note: data.description,
          amenities: selectedAmenities // Đồng bộ lên database
        });
        toast.success("Thêm phòng mới thành công!");
      }
      window.dispatchEvent(new Event("refresh-notifications"));
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu thông tin phòng");
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa phòng này không? Toàn bộ lịch sử bảo trì và đặt phòng liên quan sẽ bị xóa!")) {
      try {
        await RoomAPI.deleteRoom(id);
        toast.success("Xóa phòng thành công!");
        loadData();
      } catch (error: any) {
        toast.error(error.message || "Không thể xóa phòng");
      }
    }
  };

  const formatToDateTimeLocal = (dateStr: string | Date) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleRoomClick = async (room: RoomWithType) => {
    const activeBooking = room.bookings?.[0];
    if (!activeBooking) {
      if (room.status === "AVAILABLE") {
        setQuickBookingRoom(room);
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setQuickBookingForm({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          guests: 2,
          checkInDate: formatToDateTimeLocal(now),
          checkOutDate: formatToDateTimeLocal(tomorrow),
          bookingSource: "WALK_IN",
          bookingType: "DAILY",
          note: ""
        });
        setCheckInImmediately(true);
        setIsQuickBookingOpen(true);
      }
      return;
    }
    
    setSelectedOccupiedRoom(room);
    setIsServiceDialogOpen(true);
    setLoadingServices(true);
    setNewCheckOutDate(formatToDateTimeLocal(activeBooking.checkOutDate));
    setNewRoomId(room.id);
    
    // Tải hóa đơn của đặt phòng
    setLoadingInvoice(true);
    InvoiceAPI.getInvoiceByBookingId(activeBooking.id)
      .then((inv) => {
        setActiveInvoice(inv);
        if (inv) {
          const totalPaid = inv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
          const remaining = Number(inv.totalAmount) - totalPaid;
          setQuickPayAmount(remaining > 0 ? remaining : 0);
        } else {
          setQuickPayAmount(0);
        }
      })
      .catch(() => setActiveInvoice(null))
      .finally(() => setLoadingInvoice(false));
    
    try {
      const [bookingServices, servicesCatalog] = await Promise.all([
        BookingAPI.getBookingServices(activeBooking.id),
        ServiceAPI.getServices()
      ]);
      
      setActiveBookingServices(bookingServices);
      setAllServices(servicesCatalog);
      
      const activeCatalog = servicesCatalog.filter((s: any) => s.status === "ACTIVE");
      if (activeCatalog.length > 0) {
        setSelectedServiceId(activeCatalog[0].id);
      } else {
        setSelectedServiceId("");
      }
      setServiceQuantity(1);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải thông tin dịch vụ");
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedOccupiedRoom || !selectedServiceId) return;
    const activeBooking = selectedOccupiedRoom.bookings?.[0];
    if (!activeBooking) return;
    
    setAddingService(true);
    try {
      await BookingAPI.addBookingService(activeBooking.id, {
        serviceId: selectedServiceId,
        quantity: serviceQuantity
      });
      toast.success("Thêm dịch vụ thành công!");
      
      const updatedServices = await BookingAPI.getBookingServices(activeBooking.id);
      setActiveBookingServices(updatedServices);
      setServiceQuantity(1);
      
      const freshRooms = await loadData();
      if (freshRooms && selectedOccupiedRoom) {
        const updatedRoom = freshRooms.find((r: any) => r.id === selectedOccupiedRoom.id);
        if (updatedRoom) {
          setSelectedOccupiedRoom(updatedRoom);
        }
      }

      // Đồng bộ lại hóa đơn ở frontend sau khi thêm dịch vụ
      try {
        const updatedInv = await InvoiceAPI.getInvoiceByBookingId(activeBooking.id);
        setActiveInvoice(updatedInv);
        if (updatedInv) {
          const totalPaid = updatedInv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
          const remaining = Number(updatedInv.totalAmount) - totalPaid;
          setQuickPayAmount(remaining > 0 ? remaining : 0);
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ hóa đơn:", err);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể thêm dịch vụ");
    } finally {
      setAddingService(false);
    }
  };

  const handleRemoveService = async (bookingServiceId: string) => {
    if (!selectedOccupiedRoom) return;
    const activeBooking = selectedOccupiedRoom.bookings?.[0];
    if (!activeBooking) return;
    
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này khỏi đặt phòng?")) {
      try {
        await BookingAPI.removeBookingService(activeBooking.id, bookingServiceId);
        toast.success("Xóa dịch vụ thành công!");
        
        const updatedServices = await BookingAPI.getBookingServices(activeBooking.id);
        setActiveBookingServices(updatedServices);
        
        const freshRooms = await loadData();
        if (freshRooms && selectedOccupiedRoom) {
          const updatedRoom = freshRooms.find((r: any) => r.id === selectedOccupiedRoom.id);
          if (updatedRoom) {
            setSelectedOccupiedRoom(updatedRoom);
          }
        }

        // Đồng bộ lại hóa đơn ở frontend sau khi xóa dịch vụ
        try {
          const updatedInv = await InvoiceAPI.getInvoiceByBookingId(activeBooking.id);
          setActiveInvoice(updatedInv);
          if (updatedInv) {
            const totalPaid = updatedInv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
            const remaining = Number(updatedInv.totalAmount) - totalPaid;
            setQuickPayAmount(remaining > 0 ? remaining : 0);
          }
        } catch (err) {
          console.error("Lỗi khi đồng bộ hóa đơn:", err);
        }
      } catch (error: any) {
        toast.error(error.message || "Không thể xóa dịch vụ");
      }
    }
  };

  // Auto-adjust checkout date based on checkin date and booking type
  useEffect(() => {
    if (quickBookingForm.checkInDate && isQuickBookingOpen) {
      const checkIn = new Date(quickBookingForm.checkInDate);
      if (!isNaN(checkIn.getTime())) {
        const nextTime = new Date(checkIn);
        if (quickBookingForm.bookingType === "HOURLY") {
          nextTime.setHours(checkIn.getHours() + 2); // Default to 2 hours
        } else if (quickBookingForm.bookingType === "OVERNIGHT") {
          nextTime.setDate(checkIn.getDate() + 1);
          nextTime.setHours(12, 0, 0, 0); // 12:00 next day
        } else {
          nextTime.setDate(checkIn.getDate() + 1); // Default 1 day
        }
        setQuickBookingForm(prev => ({
          ...prev,
          checkOutDate: formatToDateTimeLocal(nextTime)
        }));
      }
    }
  }, [quickBookingForm.checkInDate, quickBookingForm.bookingType, isQuickBookingOpen]);

  const getEstimatedPrice = () => {
    if (!quickBookingRoom || !quickBookingForm.checkInDate || !quickBookingForm.checkOutDate) return null;
    const rt = quickBookingRoom.roomType;
    const checkIn = new Date(quickBookingForm.checkInDate);
    const checkOut = new Date(quickBookingForm.checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) return null;

    const priceHourly = Number(rt.priceHourly || rt.pricePerNight / 10 || 0);
    const priceDaily = Number(rt.priceDaily || rt.pricePerNight || 0);
    const priceOvernight = Number(rt.priceOvernight || rt.pricePerNight * 0.7 || 0);

    if (quickBookingForm.bookingType === "HOURLY") {
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
      const rate = quickBookingForm.bookingType === "OVERNIGHT" ? priceOvernight : priceDaily;
      const labelStr = quickBookingForm.bookingType === "OVERNIGHT" ? "đêm" : "ngày";
      return {
        amount: rate * nights,
        label: `${nights} ${labelStr} x ${formatCurrency(rate)}/${labelStr}`
      };
    }
  };

  const handleCreateQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookingRoom) return;

    if (!quickBookingForm.customerName || !quickBookingForm.customerPhone || !quickBookingForm.checkInDate || !quickBookingForm.checkOutDate) {
      toast.error("Vui lòng nhập đầy đủ các trường bắt buộc");
      return;
    }

    setQuickBookingSubmitting(true);
    try {
      // 1. Tạo đặt phòng mới
      const res = await BookingAPI.createBooking({
        ...quickBookingForm,
        roomId: quickBookingRoom.id,
        guests: Number(quickBookingForm.guests)
      });
      
      const booking = res.data;
      
      // 2. Nhận phòng ngay lập tức nếu được chọn
      if (checkInImmediately && booking && booking.id) {
        await BookingAPI.updateBookingStatus(booking.id, "CHECKED_IN");
        toast.success("Đặt phòng và nhận phòng thành công!");
      } else {
        toast.success("Tạo đặt phòng nhanh thành công!");
      }
      
      setIsQuickBookingOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Tạo đặt phòng nhanh thất bại");
    } finally {
      setQuickBookingSubmitting(false);
    }
  };

  const handleExtendStay = async () => {
    if (!selectedOccupiedRoom || !newCheckOutDate) return;
    const activeBooking = selectedOccupiedRoom.bookings?.[0];
    if (!activeBooking) return;

    setExtending(true);
    try {
      await BookingAPI.extendBooking(activeBooking.id, newCheckOutDate);
      toast.success("Gia hạn thời gian ở thành công!");
      
      const freshRooms = await loadData();
      if (freshRooms) {
        const updatedRoom = freshRooms.find((r: any) => r.id === selectedOccupiedRoom.id);
        if (updatedRoom) {
          setSelectedOccupiedRoom(updatedRoom);
        }
      }
      
      const updatedInv = await InvoiceAPI.getInvoiceByBookingId(activeBooking.id);
      setActiveInvoice(updatedInv);
      if (updatedInv) {
        const totalPaid = updatedInv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        const remaining = Number(updatedInv.totalAmount) - totalPaid;
        setQuickPayAmount(remaining > 0 ? remaining : 0);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể gia hạn phòng");
    } finally {
      setExtending(false);
    }
  };

  const handleChangeRoom = async () => {
    if (!selectedOccupiedRoom || !newRoomId) return;
    const activeBooking = selectedOccupiedRoom.bookings?.[0];
    if (!activeBooking) return;

    setSwapping(true);
    try {
      await BookingAPI.changeRoom(activeBooking.id, newRoomId);
      toast.success("Đổi phòng thành công!");
      setIsServiceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể đổi phòng");
    } finally {
      setSwapping(false);
    }
  };

  const handleQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || quickPayAmount <= 0) return;

    setQuickPaying(true);
    try {
      const res = await InvoiceAPI.payInvoice(activeInvoice.id, {
        amount: Number(quickPayAmount),
        paymentMethod: quickPayMethod,
        note: quickPayNote || "Thanh toán nhanh tại quầy",
        processedBy: user?.fullName || "Hệ thống"
      });
      toast.success("Thanh toán thành công!");
      
      const updatedInv = res.data;
      setActiveInvoice(updatedInv);
      if (updatedInv) {
        const totalPaid = updatedInv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        const remaining = Number(updatedInv.totalAmount) - totalPaid;
        setQuickPayAmount(remaining > 0 ? remaining : 0);
      }
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể thực hiện thanh toán");
    } finally {
      setQuickPaying(false);
    }
  };

  // --- CRUD BẢO TRÌ PHÒNG (DATABASE) ---
  const handleAddMaintenance = async (newRecord: any) => {
    try {
      await MaintenanceAPI.createMaintenanceRecord({
        roomId: newRecord.roomId,
        description: newRecord.description,
        repairCost: newRecord.repairCost,
        startDate: newRecord.startDate,
        remarks: newRecord.remarks
      });
      toast.success("Tạo yêu cầu bảo trì thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo yêu cầu bảo trì");
    }
  };

  const handleUpdateMaintenanceStatus = async (id: string, status: string) => {
    try {
      await MaintenanceAPI.updateMaintenanceStatus(id, status);
      toast.success("Cập nhật trạng thái bảo trì thành công!");
      window.dispatchEvent(new Event("refresh-notifications"));
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật trạng thái bảo trì");
    }
  };

  // --- CRUD TIỆN NGHI (LOCAL STORAGE) ---
  const handleSaveAmenity = (data: Amenity) => {
    const exists = amenities.some(a => a.id === data.id);
    let updatedAmenities = [];
    if (exists) {
      updatedAmenities = amenities.map(a => a.id === data.id ? data : a);
    } else {
      updatedAmenities = [...amenities, data];
    }
    setAmenities(updatedAmenities);
    localStorage.setItem("pms_amenities", JSON.stringify(updatedAmenities));
    toast.success("Lưu tiện nghi thành công!");
  };

  const handleDeleteAmenity = (id: string) => {
    if (confirm("Xóa tiện nghi này?")) {
      const updatedAmenities = amenities.filter(a => a.id !== id);
      setAmenities(updatedAmenities);
      localStorage.setItem("pms_amenities", JSON.stringify(updatedAmenities));
      toast.success("Đã xóa tiện nghi!");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Quản lý phòng" subtitle="Quản lý danh sách phòng, bảo trì và tiện nghi" />
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="rooms" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="rooms" className="gap-2"><DoorOpen className="size-4" /> Danh sách phòng</TabsTrigger>
                <TabsTrigger value="maintenance" className="gap-2"><Wrench className="size-4" /> Bảo trì</TabsTrigger>
                <TabsTrigger value="amenities" className="gap-2"><Wifi className="size-4" /> Tiện nghi</TabsTrigger>
              </TabsList>

              <TabsContent value="rooms">
                <RoomsTab 
                  rooms={rooms}
                  amenities={amenities}
                  filteredRooms={filteredRooms}
                  allRoomsCount={rooms.length}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  floorFilter={floorFilter}
                  setFloorFilter={setFloorFilter}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  filterOptions={filterOptions}
                  floors={floors}
                  roomTypes={roomTypes}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  formatCurrency={formatCurrency}
                  onRoomClick={handleRoomClick}
                  onSaveRoom={handleSaveRoom} 
                  onDeleteRoom={handleDeleteRoom}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </TabsContent>

              <TabsContent value="maintenance">
                <MaintenanceTab 
                  rooms={rooms}
                  maintenanceRecords={maintenanceRecords}
                  onAddMaintenance={handleAddMaintenance}
                  onUpdateStatus={handleUpdateMaintenanceStatus}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>

              <TabsContent value="amenities">
                <AmenitiesTab 
                  amenities={amenities}
                  categories={amenityCategories}
                  onSave={handleSaveAmenity}
                  onDelete={handleDeleteAmenity}
                />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      {/* Dialog Quản lý Operations phòng */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="border-b p-6 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <ConciergeBell className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Thao tác phòng {selectedOccupiedRoom?.roomNumber}
                </DialogTitle>
                {selectedOccupiedRoom?.bookings?.[0] && (
                  <DialogDescription className="text-muted-foreground mt-1 text-sm">
                    Khách hàng: <span className="font-semibold text-foreground">{selectedOccupiedRoom.bookings[0].customerName}</span> | SĐT: <span className="font-semibold text-foreground">{selectedOccupiedRoom.bookings[0].customerPhone}</span>
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="stay-info" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="stay-info">👤 Khách & Đổi/Gia hạn</TabsTrigger>
              <TabsTrigger value="services">🛎️ Dịch vụ phòng</TabsTrigger>
              <TabsTrigger value="quick-pay">💵 Thanh toán nhanh</TabsTrigger>
            </TabsList>

            {/* TAB 1: THÔNG TIN KHÁCH & GIA HẠN/ĐỔI PHÒNG */}
            <TabsContent value="stay-info" className="flex-1 overflow-y-auto p-6 min-h-0 space-y-6">
              {selectedOccupiedRoom?.bookings?.[0] && (() => {
                const booking = selectedOccupiedRoom.bookings[0];
                const bookingCheckIn = new Date(booking.checkInDate);
                const bookingCheckOut = new Date(booking.checkOutDate);
                const swapRooms = rooms.filter(r => {
                  if (r.id === selectedOccupiedRoom.id) return false;
                  if (r.status !== "AVAILABLE") return false;
                  const hasOverlap = r.bookings?.some(b => {
                    const bCheckIn = new Date(b.checkInDate);
                    const bCheckOut = new Date(b.checkOutDate);
                    return bCheckIn < bookingCheckOut && bCheckOut > bookingCheckIn;
                  });
                  return !hasOverlap;
                });

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thông tin đặt phòng */}
                    <div className="space-y-4 border rounded-xl p-5 bg-card/50 shadow-xs">
                      <h3 className="font-bold text-base text-primary border-b pb-2 flex items-center gap-2">
                        <span>📋</span> Thông tin lưu trú
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                        <div className="text-muted-foreground">Khách hàng:</div>
                        <div className="font-semibold">{booking.customerName}</div>
                        
                        <div className="text-muted-foreground">Số điện thoại:</div>
                        <div className="font-semibold">{booking.customerPhone}</div>
                        
                        <div className="text-muted-foreground">Email:</div>
                        <div className="font-semibold">{booking.customerEmail || "-"}</div>
                        
                        <div className="text-muted-foreground">Hình thức thuê:</div>
                        <div className="font-semibold">
                          <Badge variant="secondary">
                            {booking.bookingType === "HOURLY" ? "Theo giờ" : booking.bookingType === "OVERNIGHT" ? "Qua đêm" : "Theo ngày"}
                          </Badge>
                        </div>
                        
                        <div className="text-muted-foreground">Nguồn đặt phòng:</div>
                        <div className="font-semibold">{booking.bookingSource}</div>
                        
                        <div className="text-muted-foreground">Ngày nhận phòng:</div>
                        <div className="font-semibold text-emerald-600">
                          {new Date(booking.checkInDate).toLocaleString("vi-VN")}
                        </div>
                        
                        <div className="text-muted-foreground">Ngày trả phòng:</div>
                        <div className="font-semibold text-rose-600">
                          {new Date(booking.checkOutDate).toLocaleString("vi-VN")}
                        </div>

                        <div className="text-muted-foreground border-t pt-2 mt-2">Tổng tiền (tạm tính):</div>
                        <div className="font-bold text-primary border-t pt-2 mt-2 text-base">
                          {formatCurrency(Number(booking.totalAmount))}
                        </div>
                      </div>
                    </div>

                    {/* Thao tác gia hạn & đổi phòng */}
                    <div className="space-y-6">
                      {/* Gia hạn phòng */}
                      <div className="border rounded-xl p-5 bg-card/50 shadow-xs space-y-4">
                        <h3 className="font-bold text-base text-primary border-b pb-2 flex items-center gap-2">
                          <span>📅</span> Gia hạn lưu trú (Đổi ngày trả)
                        </h3>
                        <div className="space-y-3 text-left">
                          <Label htmlFor="extend-checkout" className="text-xs font-semibold">Giờ & ngày trả phòng mới</Label>
                          <div className="flex gap-2">
                            <Input
                              id="extend-checkout"
                              type="datetime-local"
                              value={newCheckOutDate}
                              onChange={(e) => setNewCheckOutDate(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              onClick={handleExtendStay} 
                              disabled={extending}
                              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4"
                            >
                              {extending && <Loader2 className="mr-2 size-4 animate-spin" />}
                              Lưu
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Đổi phòng */}
                      <div className="border rounded-xl p-5 bg-card/50 shadow-xs space-y-4">
                        <h3 className="font-bold text-base text-primary border-b pb-2 flex items-center gap-2">
                          <span>🔄</span> Đổi phòng (Chuyển phòng)
                        </h3>
                        <div className="space-y-3 text-left">
                          <Label htmlFor="swap-room-select" className="text-xs font-semibold">Chọn phòng trống nhận khách</Label>
                          <div className="flex gap-2">
                            <Select value={newRoomId} onValueChange={setNewRoomId}>
                              <SelectTrigger id="swap-room-select" className="flex-1">
                                <SelectValue placeholder="Chọn phòng trống..." />
                              </SelectTrigger>
                              <SelectContent>
                                {swapRooms.length === 0 ? (
                                  <SelectItem value="none" disabled>Không có phòng trống sẵn sàng</SelectItem>
                                ) : (
                                  swapRooms.map(r => (
                                    <SelectItem key={r.id} value={r.id}>
                                      Phòng {r.roomNumber} ({r.roomType.name} - {formatCurrency(Number(r.roomType.pricePerNight))}/đêm)
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              onClick={handleChangeRoom} 
                              disabled={swapping || !newRoomId || newRoomId === "none" || newRoomId === selectedOccupiedRoom.id}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/5 font-semibold px-4"
                            >
                              {swapping && <Loader2 className="mr-2 size-4 animate-spin" />}
                              Đổi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* TAB 2: QUẢN LÝ DỊCH VỤ */}
            <TabsContent value="services" className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-6 min-h-0">
              {/* Used services */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary border-b pb-2">
                  Dịch vụ đã sử dụng
                </h3>
                
                {loadingServices ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : activeBookingServices.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-6 bg-muted/5 text-center">
                    <ConciergeBell className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa sử dụng dịch vụ nào</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 border rounded-lg bg-card shadow-xs">
                    <div className="min-w-[450px]">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50 text-muted-foreground text-xs font-semibold uppercase">
                            <th className="p-3">Tên dịch vụ</th>
                            <th className="p-3 text-center">Số lượng</th>
                            <th className="p-3 text-right">Đơn giá</th>
                            <th className="p-3 text-right">Thành tiền</th>
                            <th className="p-3 text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {activeBookingServices.map((bs) => (
                            <tr key={bs.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-semibold text-foreground align-middle">
                                {bs.service?.name || "Dịch vụ đã xóa"}
                              </td>
                              <td className="p-3 text-center align-middle font-bold text-muted-foreground">
                                x{bs.quantity}
                              </td>
                              <td className="p-3 text-right align-middle text-muted-foreground">
                                {formatCurrency(bs.price)}
                              </td>
                              <td className="p-3 text-right align-middle font-bold text-foreground">
                                {formatCurrency(bs.totalAmount)}
                              </td>
                              <td className="p-3 text-center align-middle">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                  onClick={() => handleRemoveService(bs.id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                )}
                
                {/* Stay charges summary */}
                {!loadingServices && selectedOccupiedRoom?.bookings?.[0] && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền phòng (tạm tính):</span>
                      <span className="font-medium">
                        {formatCurrency(Number(selectedOccupiedRoom.bookings[0].totalAmount) - activeBookingServices.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền dịch vụ:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(activeBookingServices.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                      <span>Tổng tiền thanh toán:</span>
                      <span className="text-primary">{formatCurrency(Number(selectedOccupiedRoom.bookings[0].totalAmount))}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add services */}
              <div className="w-full md:w-96 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 flex flex-col shrink-0">
                <h3 className="font-semibold text-base mb-4 flex items-center gap-2 text-primary border-b pb-2">
                  Thêm dịch vụ
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2 flex flex-col text-left">
                    <Label className="text-sm font-semibold">Chọn dịch vụ</Label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn dịch vụ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allServices
                          .filter((service) => service.status === "ACTIVE")
                          .map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({formatCurrency(service.price)})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 flex flex-col text-left">
                    <Label className="text-sm font-semibold">Số lượng</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      value={serviceQuantity} 
                      onChange={(e) => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  
                  {selectedServiceId && (
                    <div className="bg-muted/30 p-3 rounded-lg border border-dashed space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Đơn giá:</span>
                        <span>
                          {formatCurrency(allServices.find(s => s.id === selectedServiceId)?.price || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Số lượng:</span>
                        <span>{serviceQuantity}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t pt-1.5 mt-1 text-foreground">
                        <span>Thành tiền:</span>
                        <span className="text-primary">
                          {formatCurrency(
                            (allServices.find(s => s.id === selectedServiceId)?.price || 0) * serviceQuantity
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddService} 
                    disabled={addingService || !selectedServiceId}
                    className="w-full gap-2 mt-2"
                  >
                    {addingService ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Thêm vào phòng
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: THANH TOÁN NHANH */}
            <TabsContent value="quick-pay" className="flex-1 overflow-y-auto p-6 min-h-0">
              {loadingInvoice ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activeInvoice ? (
                <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-8 bg-muted/5 text-center space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full">
                    <span>⚠️</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base">Đặt phòng chưa được lập hóa đơn</h4>
                    <p className="text-xs text-muted-foreground">Bạn cần lập hóa đơn để ghi nhận doanh thu và thực hiện thanh toán.</p>
                  </div>
                  <Button onClick={async () => {
                    if (!selectedOccupiedRoom?.bookings?.[0]) return;
                    try {
                      const res = await InvoiceAPI.createInvoice({
                        bookingId: selectedOccupiedRoom.bookings[0].id,
                        status: "UNPAID",
                        discount: 0,
                        processedBy: user?.fullName || "Hệ thống"
                      });
                      toast.success("Tạo hóa đơn thành công!");
                      const newInv = res.data;
                      setActiveInvoice(newInv);
                      const totalPaid = newInv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                      const remaining = Number(newInv.totalAmount) - totalPaid;
                      setQuickPayAmount(remaining > 0 ? remaining : 0);
                      loadData();
                    } catch (error: any) {
                      toast.error(error.message || "Không thể tạo hóa đơn");
                    }
                  }} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Tạo hóa đơn ngay
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleQuickPay} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bảng tóm tắt hóa đơn */}
                  <div className="border rounded-xl p-5 bg-card/50 shadow-xs space-y-4">
                    <h3 className="font-bold text-base text-primary border-b pb-2 flex items-center gap-2">
                      <span>📄</span> Tóm tắt thanh toán
                    </h3>
                    
                    {(() => {
                      const totalAmt = Number(activeInvoice.totalAmount);
                      const totalPaidAmt = activeInvoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                      const remainingAmt = Math.max(0, totalAmt - totalPaidAmt);

                      return (
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mã hóa đơn:</span>
                            <span className="font-mono font-bold">{activeInvoice.invoiceNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trạng thái:</span>
                            <span className="font-semibold text-amber-600">
                              {activeInvoice.status === "PAID" ? "ĐÃ THANH TOÁN" : activeInvoice.status === "PARTIALLY_PAID" ? "THANH TOÁN MỘT PHẦN" : "CHƯA THANH TOÁN"}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Tổng tiền hóa đơn:</span>
                            <span className="font-semibold">{formatCurrency(totalAmt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Đã thanh toán:</span>
                            <span className="font-semibold text-emerald-600">{formatCurrency(totalPaidAmt)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold text-primary text-base">
                            <span>Còn lại cần thu:</span>
                            <span>{formatCurrency(remainingAmt)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Form nộp tiền */}
                  <div className="border rounded-xl p-5 bg-card/50 shadow-xs space-y-4 text-left">
                    <h3 className="font-bold text-base text-primary border-b pb-2 flex items-center gap-2">
                      <span>💰</span> Thu tiền mặt / Chuyển khoản
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="quick-pay-amt" className="text-xs font-semibold">Số tiền thanh toán (VND)</Label>
                        <Input
                          id="quick-pay-amt"
                          type="number"
                          value={quickPayAmount}
                          onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                          min={1000}
                          max={Math.max(0, Number(activeInvoice.totalAmount) - (activeInvoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0))}
                          className="font-bold text-base"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="quick-pay-method" className="text-xs font-semibold">Phương thức</Label>
                        <Select value={quickPayMethod} onValueChange={setQuickPayMethod}>
                          <SelectTrigger id="quick-pay-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Tiền mặt</SelectItem>
                            <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
                            <SelectItem value="CARD">Thẻ ngân hàng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="quick-pay-note" className="text-xs font-semibold">Ghi chú</Label>
                        <Input
                          id="quick-pay-note"
                          value={quickPayNote}
                          onChange={(e) => setQuickPayNote(e.target.value)}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={quickPaying || quickPayAmount <= 0}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                      >
                        {quickPaying && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Xác nhận nộp tiền
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t p-6 bg-muted/10">
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Đặt phòng nhanh */}
      <Dialog open={isQuickBookingOpen} onOpenChange={setIsQuickBookingOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <form onSubmit={handleCreateQuickBooking} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <span>⚡</span> Đặt & Nhận phòng nhanh: Phòng {quickBookingRoom?.roomNumber}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Loại phòng: <span className="font-semibold text-foreground">{quickBookingRoom?.roomType?.name}</span> | Tầng: <span className="font-semibold text-foreground">{quickBookingRoom?.floor}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4 min-h-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-cust-name" className="text-xs font-semibold">Họ tên khách hàng *</Label>
                    <Input
                      id="quick-cust-name"
                      placeholder="Nguyễn Văn A"
                      value={quickBookingForm.customerName}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-cust-phone" className="text-xs font-semibold">Số điện thoại *</Label>
                    <Input
                      id="quick-cust-phone"
                      placeholder="0901234567"
                      value={quickBookingForm.customerPhone}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-cust-email" className="text-xs font-semibold">Email</Label>
                    <Input
                      id="quick-cust-email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={quickBookingForm.customerEmail}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, customerEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-guests" className="text-xs font-semibold">Số khách</Label>
                    <Input
                      id="quick-guests"
                      type="number"
                      min="1"
                      value={quickBookingForm.guests}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, guests: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-booking-type" className="text-xs font-semibold">Hình thức thuê</Label>
                    <Select
                      value={quickBookingForm.bookingType}
                      onValueChange={(val) => setQuickBookingForm({ ...quickBookingForm, bookingType: val })}
                    >
                      <SelectTrigger id="quick-booking-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Theo ngày</SelectItem>
                        <SelectItem value="HOURLY">Theo giờ</SelectItem>
                        <SelectItem value="OVERNIGHT">Qua đêm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-booking-source" className="text-xs font-semibold">Nguồn đặt</Label>
                    <Select
                      value={quickBookingForm.bookingSource}
                      onValueChange={(val) => setQuickBookingForm({ ...quickBookingForm, bookingSource: val })}
                    >
                      <SelectTrigger id="quick-booking-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WALK_IN">Walk-in (Trực tiếp)</SelectItem>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="BOOKING_COM">Booking.com</SelectItem>
                        <SelectItem value="AGODA">Agoda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-checkin-date" className="text-xs font-semibold">Giờ/Ngày nhận *</Label>
                    <Input
                      id="quick-checkin-date"
                      type="datetime-local"
                      value={quickBookingForm.checkInDate}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, checkInDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="quick-checkout-date" className="text-xs font-semibold">Giờ/Ngày trả *</Label>
                    <Input
                      id="quick-checkout-date"
                      type="datetime-local"
                      value={quickBookingForm.checkOutDate}
                      onChange={(e) => setQuickBookingForm({ ...quickBookingForm, checkOutDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="quick-note" className="text-xs font-semibold">Ghi chú</Label>
                  <Input
                    id="quick-note"
                    placeholder="Yêu cầu thêm..."
                    value={quickBookingForm.note}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, note: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-emerald-50/20 border-emerald-100/50 mt-2">
                  <input
                    id="quick-checkin-immediately"
                    type="checkbox"
                    checked={checkInImmediately}
                    onChange={(e) => setCheckInImmediately(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="quick-checkin-immediately"
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 cursor-pointer select-none"
                  >
                    👤 Nhận phòng (Check-in) ngay lập tức
                  </label>
                </div>

                {(() => {
                  const est = getEstimatedPrice();
                  if (!est) return null;
                  return (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Hình thức thuê:</span>
                        <span className="font-semibold text-foreground">
                          {quickBookingForm.bookingType === "HOURLY" ? "Theo giờ" : quickBookingForm.bookingType === "OVERNIGHT" ? "Qua đêm" : "Theo ngày"}
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
              </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickBookingOpen(false)}
                disabled={quickBookingSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={quickBookingSubmitting} className="bg-primary">
                {quickBookingSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận đặt phòng
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}