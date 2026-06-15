"use client";

import { useState, useEffect } from "react";
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

import { RoomAPI } from "@/services/room.service";
import { MaintenanceAPI } from "@/services/maintenance.service";
import { ServiceAPI } from "@/services/service.service";
import { BookingAPI } from "@/services/booking.service";

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
  { value: "OCCUPIED", label: "Có khách" },
  { value: "DIRTY", label: "Chưa dọn dẹp" },
  { value: "MAINTENANCE", label: "Đang bảo trì" },
];
const amenityCategories = ["COMFORT", "ENTERTAINMENT", "BATHROOM", "KITCHEN", "OUTDOOR"] as const;

export default function RoomsPage() {
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

  // States cho tính năng tích hợp Dịch vụ phòng (Room Service)
  const [selectedOccupiedRoom, setSelectedOccupiedRoom] = useState<RoomWithType | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [activeBookingServices, setActiveBookingServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [addingService, setAddingService] = useState(false);

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
    if (statusFilter !== "all" && room.status !== statusFilter) return false;
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

  const handleRoomClick = async (room: RoomWithType) => {
    if (room.status !== "OCCUPIED") return;
    
    const activeBooking = room.bookings?.[0];
    if (!activeBooking) {
      toast.error("Không tìm thấy thông tin đặt phòng đang hoạt động");
      return;
    }
    
    setSelectedOccupiedRoom(room);
    setIsServiceDialogOpen(true);
    setLoadingServices(true);
    
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
      } catch (error: any) {
        toast.error(error.message || "Không thể xóa dịch vụ");
      }
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

      {/* Dialog Quản lý dịch vụ phòng */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="border-b p-6 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <ConciergeBell className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Dịch vụ phòng {selectedOccupiedRoom?.roomNumber}
                </DialogTitle>
                {selectedOccupiedRoom?.bookings?.[0] && (
                  <DialogDescription className="text-muted-foreground mt-1 text-sm">
                    Khách hàng: <span className="font-semibold text-foreground">{selectedOccupiedRoom.bookings[0].customerName}</span> | SĐT: <span className="font-semibold text-foreground">{selectedOccupiedRoom.bookings[0].customerPhone}</span>
                  </DialogDescription>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs mr-6 sm:mr-8" 
              onClick={() => window.location.href = '/services'}
            >
              <ConciergeBell className="size-3.5" /> Quản lý danh mục dịch vụ
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-6 min-h-0">
            {/* Left side: List of active services */}
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
                <ScrollArea className="flex-1 border rounded-lg bg-card shadow-sm">
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
              
              {/* Show total charge summary */}
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
            
            {/* Right side: Add new service form */}
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
          </div>

          <DialogFooter className="border-t p-6 bg-muted/10">
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}