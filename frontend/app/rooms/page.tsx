"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoorOpen, Wrench, Wifi, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";

import { RoomAPI } from "@/services/room.service";
import { MaintenanceAPI } from "@/services/maintenance.service";

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
    } catch (error: any) {
      toast.error("Không thể tải danh sách phòng hoặc bảo trì");
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

  const handleRoomClick = (room: RoomWithType) => {
    console.log("Room clicked", room);
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
    </div>
  );
}