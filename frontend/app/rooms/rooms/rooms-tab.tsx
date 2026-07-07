"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  List, LayoutGrid, Edit, Plus, Trash2, Wifi, Tv, Wind, Wine, Fence, 
  UtensilsCrossed, Sofa, Bath, Lock, Coffee, Shirt, Search,
  Bed, Check, Wrench, Sparkles, AlertCircle
} from "lucide-react"; 
import { RoomStatusBadge } from "@/components/room-status-badge";
import { RoomWithType, Amenity } from "@/lib/types";

// Ánh xạ các icon tiện nghi trực tiếp trong component
const amenityIcons: Record<string, React.ElementType> = { 
  Wifi, 
  Tv, 
  Wind, 
  Wine, 
  Fence, 
  UtensilsCrossed, 
  Sofa, 
  Bath, 
  Lock, 
  Coffee, 
  Shirt 
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getRoomAmenities(room: any): string[] {
  return room.amenities && room.amenities.length > 0
    ? room.amenities
    : (room.roomType?.amenities || []);
}

function getFlagEmoji(nationality: string) {
  if (!nationality) return "🇻🇳";
  const name = nationality.toLowerCase().trim();
  if (name.includes("việt nam") || name.includes("vietnam")) return "🇻🇳";
  if (name.includes("ireland") || name.includes("ai len")) return "🇮🇪";
  if (name.includes("mỹ") || name.includes("usa") || name.includes("america") || name.includes("united states")) return "🇺🇸";
  if (name.includes("anh") || name.includes("uk") || name.includes("united kingdom") || name.includes("britain")) return "🇬🇧";
  if (name.includes("pháp") || name.includes("france")) return "🇫🇷";
  if (name.includes("đức") || name.includes("germany")) return "🇩🇪";
  if (name.includes("hàn quốc") || name.includes("korea")) return "🇰🇷";
  if (name.includes("nhật") || name.includes("japan")) return "🇯🇵";
  if (name.includes("trung quốc") || name.includes("china")) return "🇨🇳";
  if (name.includes("nga") || name.includes("russia")) return "🇷🇺";
  if (name.includes("úc") || name.includes("australia")) return "🇦🇺";
  if (name.includes("singapore")) return "🇸🇬";
  if (name.includes("canada")) return "🇨🇦";
  return "🏳️";
}

function getStatusStyles(status: string, isReserved: boolean) {
  if (status === "MAINTENANCE") {
    return {
      cardBg: "from-amber-500/5 to-amber-500/10 dark:from-amber-950/10 dark:to-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/40 hover:border-amber-300",
      accentBar: "bg-amber-500",
      statusText: "text-amber-600 dark:text-amber-400",
      badgeText: "text-amber-700 dark:text-amber-300 border-amber-200/50",
      label: "Bảo trì",
      icon: Wrench
    };
  }
  if (status === "DIRTY") {
    return {
      cardBg: "from-slate-500/5 to-slate-500/10 dark:from-slate-900/10 dark:to-slate-900/20",
      border: "border-slate-200 dark:border-slate-800 hover:border-slate-300",
      accentBar: "bg-slate-500",
      statusText: "text-slate-500 dark:text-slate-400",
      badgeText: "text-slate-600 dark:text-slate-300 border-slate-200",
      label: "Cần dọn dẹp",
      icon: Sparkles
    };
  }
  if (status === "OCCUPIED") {
    return {
      cardBg: "from-red-500/5 to-red-500/10 dark:from-red-950/10 dark:to-red-950/20",
      border: "border-red-200 dark:border-red-900/40 hover:border-red-300",
      accentBar: "bg-red-500",
      statusText: "text-red-600 dark:text-red-400",
      badgeText: "text-red-700 dark:text-red-300 border-red-200/50",
      label: "Có khách",
      icon: Bed
    };
  }
  if (status === "RESERVED" || isReserved) {
    return {
      cardBg: "from-blue-500/5 to-blue-500/10 dark:from-blue-950/10 dark:to-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/40 hover:border-blue-300",
      accentBar: "bg-blue-500",
      statusText: "text-blue-600 dark:text-blue-400",
      badgeText: "text-blue-700 dark:text-blue-300 border-blue-200/50",
      label: "Đã đặt",
      icon: Bed
    };
  }
  return {
    cardBg: "from-emerald-500/5 to-emerald-500/10 dark:from-emerald-950/10 dark:to-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300",
    accentBar: "bg-emerald-500",
    statusText: "text-emerald-600 dark:text-emerald-400",
    badgeText: "text-emerald-700 dark:text-emerald-300 border-emerald-200/50",
    label: "Phòng trống",
    icon: Check
  };
}

// Định nghĩa Props cho Component
interface RoomsTabProps {
  rooms: RoomWithType[];
  filteredRooms: RoomWithType[];
  allRoomsCount: number;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  floorFilter: string;
  setFloorFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  filterOptions: any[];
  floors: number[];
  roomTypes: any[];
  amenities: Amenity[];
  viewMode: "grid" | "list";
  setViewMode: (val: "grid" | "list") => void;
  formatCurrency: (val: number) => string;
  onRoomClick: (room: RoomWithType) => void;
  onSaveRoom: (roomData: any) => void; 
  onDeleteRoom: (roomId: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export function RoomsTab({
  rooms,
  filteredRooms, statusFilter, setStatusFilter,
  allRoomsCount,
  floorFilter, setFloorFilter, typeFilter, setTypeFilter,
  filterOptions, floors, roomTypes, amenities, viewMode, setViewMode,
  formatCurrency, onRoomClick, onSaveRoom, onDeleteRoom,
  searchQuery, setSearchQuery
}: RoomsTabProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    roomCode: "",
    roomNumber: "",
    floor: "",
    roomTypeId: "",
    pricePerNight: "",
    maxGuests: "2",
    status: "AVAILABLE",
    description: "",
    amenityIds: [] as string[]
  });

  const stats = (rooms || []).reduce(
    (acc, r) => {
      const activeBooking = r.bookings?.[0];
      
      let displayStatus = r.status;
      let isReserved = false;
      
      if (activeBooking) {
        if (activeBooking.status === "CHECKED_IN") {
          displayStatus = "OCCUPIED";
        } else if (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED") {
          if (r.status === "AVAILABLE" || r.status === "OCCUPIED") {
            isReserved = true;
            displayStatus = "RESERVED";
          }
        }
      }
      
      if (displayStatus === "MAINTENANCE") {
        acc.maintenance += 1;
      } else if (displayStatus === "DIRTY") {
        acc.dirty += 1;
      } else if (displayStatus === "OCCUPIED") {
        acc.occupied += 1;
        if (activeBooking && new Date(activeBooking.checkOutDate).toDateString() === new Date().toDateString()) {
          acc.pendingDeparture += 1;
        }
      } else if (displayStatus === "RESERVED") {
        acc.reserved += 1;
        if (activeBooking && new Date(activeBooking.checkInDate).toDateString() === new Date().toDateString()) {
          acc.pendingArrival += 1;
        }
      } else {
        acc.available += 1;
      }
      return acc;
    },
    { available: 0, reserved: 0, pendingArrival: 0, occupied: 0, pendingDeparture: 0, dirty: 0, maintenance: 0 }
  );

  const openForm = (room?: RoomWithType) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        roomCode: room.id || "", 
        roomNumber: room.roomNumber,
        floor: room.floor.toString(),
        roomTypeId: room.roomTypeId,
        pricePerNight: (room.pricePerNight ?? room.roomType.pricePerNight).toString(),
        maxGuests: (room.capacity ?? room.roomType.capacity ?? 2).toString(), 
        status: room.status,
        description: room.note || "",
        // Lấy danh sách ID tiện nghi bằng cách so khớp tên tiện nghi của phòng (không phân biệt hoa thường)
        amenityIds: amenities
          .filter((a) => getRoomAmenities(room).some((dbName: string) => dbName.toLowerCase() === a.name.toLowerCase()))
          .map((a) => a.id)
      });
    } else {
      setEditingRoom(null);
      setFormData({
        roomCode: "", roomNumber: "", floor: "", roomTypeId: "",
        pricePerNight: "", maxGuests: "2", status: "AVAILABLE", description: "",
        amenityIds: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenityIds: checked 
        ? [...prev.amenityIds, amenityId] 
        : prev.amenityIds.filter(id => id !== amenityId)
    }));
  };

  const handleSave = () => {
    onSaveRoom({ ...formData, id: editingRoom?.id });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Thanh trạng thái nghiệp vụ rực rỡ */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-background border rounded-xl shadow-xs text-xs md:text-sm font-semibold">
        <button 
          onClick={() => setStatusFilter("all")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "all"
              ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 ring-2 ring-purple-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>🟣 Tất cả ({allRoomsCount})</span>
        </button>

        <button 
          onClick={() => setStatusFilter("AVAILABLE")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "AVAILABLE"
              ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800 ring-2 ring-green-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>🟢 Trống ({stats.available})</span>
        </button>

        <button 
          onClick={() => setStatusFilter("RESERVED")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "RESERVED"
              ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 ring-2 ring-blue-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>🔵 Đã đặt ({stats.reserved})</span>
        </button>

        <button 
          onClick={() => setStatusFilter("OCCUPIED")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "OCCUPIED"
              ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 ring-2 ring-red-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>🔴 Có khách ({stats.occupied})</span>
        </button>

        <button 
          onClick={() => setStatusFilter("DIRTY")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "DIRTY"
              ? "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 ring-2 ring-slate-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>⚫ Bẩn ({stats.dirty})</span>
        </button>

        <button 
          onClick={() => setStatusFilter("MAINTENANCE")} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            statusFilter === "MAINTENANCE"
              ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800 ring-2 ring-yellow-500/10 scale-105 shadow-xs"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>🛠️ Bảo trì ({stats.maintenance})</span>
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc trạng thái */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
                {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.value === "all" ? "Tất cả trạng thái" : opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Lọc tầng */}
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tất cả tầng" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tầng</SelectItem>
              {floors.map((fl) => (
                <SelectItem key={fl} value={fl.toString()}>
                  Tầng {fl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lọc loại phòng */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tất cả loại phòng" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại phòng</SelectItem>
              {roomTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm số phòng, loại..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isSuperAdmin && (
            <Button onClick={() => openForm()} className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Thêm phòng
            </Button>
          )}
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="list"><List className="size-4 mr-2" /> Bảng</TabsTrigger>
            <TabsTrigger value="grid"><LayoutGrid className="size-4 mr-2" /> Lưới</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl font-bold">
              {editingRoom ? `Chỉnh sửa phòng: ${editingRoom.roomNumber}` : "Thêm phòng mới"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 py-4 min-h-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Mã phòng (Hệ thống tự tạo nếu bỏ trống)</Label>
                <Input placeholder="Tự động" value={formData.roomCode} onChange={(e) => setFormData({...formData, roomCode: e.target.value})} disabled={!!editingRoom} />
              </div>
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Số phòng *</Label>
                <Input placeholder="101" value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} />
              </div>
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Tầng *</Label>
                <Input type="number" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} />
              </div>
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Loại phòng *</Label>
                <Select 
                  value={formData.roomTypeId} 
                  onValueChange={(val) => {
                    const selectedType = roomTypes.find(t => t.id === val);
                    if (selectedType) {
                      setFormData(prev => ({
                        ...prev,
                        roomTypeId: val,
                        pricePerNight: selectedType.pricePerNight?.toString() || prev.pricePerNight,
                        maxGuests: selectedType.capacity?.toString() || prev.maxGuests,
                        amenityIds: amenities
                          .filter(a => selectedType.amenities?.some((dbName: string) => dbName.toLowerCase() === a.name.toLowerCase()))
                          .map(a => a.id)
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, roomTypeId: val }));
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Giá mỗi đêm (VNĐ) *</Label>
                <Input type="number" value={formData.pricePerNight} onChange={(e) => setFormData({...formData, pricePerNight: e.target.value})} />
              </div>
              <div className="space-y-2 text-left">
                <Label className="font-semibold">Số người tối đa *</Label>
                <Input type="number" value={formData.maxGuests} onChange={(e) => setFormData({...formData, maxGuests: e.target.value})} />
              </div>

              <div className="col-span-2 space-y-3 text-left">
                <Label className="font-semibold text-primary">Tiện nghi phòng</Label>
                <div className="grid grid-cols-3 gap-3 border p-3 rounded-md bg-muted/20">
                  {amenities.map((amenity: Amenity) => {
                    const Icon = amenityIcons[amenity.icon] || Wifi;
                    return (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`amenity-${amenity.id}`} 
                          checked={formData.amenityIds.includes(amenity.id)}
                          onCheckedChange={(checked) => handleAmenityChange(amenity.id, !!checked)}
                        />
                        <label htmlFor={`amenity-${amenity.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                          <Icon className="size-3.5 text-muted-foreground" />
                          {amenity.name}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 col-span-2 text-left">
                <Label className="font-semibold">Mô tả</Label>
                <Textarea 
                  placeholder="Mô tả chi tiết..." 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="px-8 bg-primary">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hiển thị danh sách */}
      {viewMode === "list" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phòng</TableHead>
                <TableHead>Loại & Tiện nghi</TableHead>
                <TableHead>Tầng</TableHead>
                <TableHead>Giá / đêm</TableHead>
                <TableHead>Thông tin đồng bộ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room: any) => {
                const activeBooking = room.bookings?.[0];
                const activeMaintenance = room.maintenance?.[0];
                
                let displayStatus = room.status;
                let isReserved = false;
                
                if (activeBooking) {
                  if (activeBooking.status === "CHECKED_IN") {
                    displayStatus = "OCCUPIED";
                  } else if (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED") {
                    isReserved = true;
                    displayStatus = "RESERVED";
                  }
                }

                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-bold">{room.roomNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant="outline">{room.roomType.name}</Badge>
                        <div className="flex gap-1 mt-1">
                           {amenities
                            .filter((a) => getRoomAmenities(room).some((dbName: string) => dbName.toLowerCase() === a.name.toLowerCase()))
                            .slice(0, 4)
                            .map((a: Amenity) => {
                              const Icon = amenityIcons[a.icon] || Wifi;
                              return <Icon key={a.id} className="size-3.5 text-muted-foreground" />;
                            })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Tầng {room.floor}</TableCell>
                    <TableCell>{formatCurrency(room.pricePerNight ?? room.roomType.pricePerNight)}</TableCell>
                    <TableCell>
                      {displayStatus === "OCCUPIED" && activeBooking ? (
                        <span className="text-xs text-amber-700 font-medium">
                          👤 Khách: {activeBooking.customerName} (đến {formatDate(activeBooking.checkOutDate)})
                        </span>
                      ) : displayStatus === "RESERVED" && activeBooking ? (
                        <span className="text-xs text-purple-700 font-medium">
                          📅 Đã đặt: {activeBooking.customerName} (từ {formatDate(activeBooking.checkInDate)})
                        </span>
                      ) : displayStatus === "MAINTENANCE" && activeMaintenance ? (
                        <span className="text-xs text-destructive font-medium">
                          🔧 Bảo trì: {activeMaintenance.description}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell><RoomStatusBadge status={displayStatus} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      {room.status === "DIRTY" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 text-xs font-semibold mr-2"
                          onClick={() => onSaveRoom({
                            id: room.id,
                            roomNumber: room.roomNumber,
                            floor: room.floor,
                            status: "AVAILABLE",
                            roomTypeId: room.roomTypeId,
                            pricePerNight: room.pricePerNight ?? room.roomType.pricePerNight,
                            maxGuests: room.capacity ?? room.roomType.capacity ?? 2,
                            description: room.note || ""
                          })}
                        >
                          Đã dọn dẹp
                        </Button>
                      )}
                      {displayStatus === "AVAILABLE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs font-semibold mr-2"
                          onClick={() => onRoomClick(room)}
                        >
                          Đặt nhanh
                        </Button>
                      )}
                      {(displayStatus === "OCCUPIED" || displayStatus === "RESERVED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs font-semibold mr-2"
                          onClick={() => onRoomClick(room)}
                        >
                          Thao tác
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openForm(room)}><Edit className="size-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteRoom(room.id)}><Trash2 className="size-4" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {filteredRooms.map((room: any) => {
             const activeBooking = room.bookings?.[0];
             const activeMaintenance = room.maintenance?.[0];
             
             let displayStatus = room.status;
             let isReserved = false;
             
             if (activeBooking) {
               if (activeBooking.status === "CHECKED_IN") {
                 displayStatus = "OCCUPIED";
               } else if (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED") {
                 isReserved = true;
                 displayStatus = "RESERVED";
               }
             }

             // Lấy style động theo trạng thái hiển thị ưu tiên
             const styles = getStatusStyles(displayStatus, isReserved);
             const StatusIcon = styles.icon;

             return (
                <Card 
                  key={room.id} 
                  className={`relative overflow-hidden cursor-pointer border hover:shadow-md transition-all duration-300 flex flex-col justify-between p-3.5 bg-gradient-to-br ${styles.cardBg} ${styles.border} hover:-translate-y-1 group min-h-[145px]`}
                  onClick={() => onRoomClick(room)}
                >
                  {/* Dải màu accent tinh tế ở bên trái của Card */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${styles.accentBar}`} />

                  {/* Header: Loại phòng & Tầng */}
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pl-1.5 shrink-0">
                    <Badge variant="outline" className={`font-bold tracking-wider text-[9px] uppercase px-1.5 py-0.5 bg-background/80 ${styles.badgeText}`}>
                      {room.roomType.name}
                    </Badge>
                    <span className="font-semibold text-[10px] text-muted-foreground">Tầng {room.floor}</span>
                  </div>

                  {/* Body: Số phòng & Trạng thái khách */}
                  <div className="my-2.5 flex items-center justify-between gap-3 pl-1.5 min-w-0">
                    <div className="space-y-0.5 shrink-0 text-left">
                      <span className="text-2xl font-black tracking-tight text-foreground block leading-none">
                        {room.roomNumber}
                      </span>
                      <span className={`text-[10px] font-bold inline-flex items-center gap-1 mt-1.5 ${styles.statusText}`}>
                        <StatusIcon className="size-3.5" />
                        {styles.label}
                      </span>
                    </div>

                    {/* Nội dung bên phải động theo trạng thái */}
                    <div className="flex-1 text-right min-w-0 pr-1">
                      {/* Phòng trống */}
                      {displayStatus === "AVAILABLE" && (
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <span className="block font-medium">Sẵn sàng</span>
                          <span className="block text-[9px] text-muted-foreground/80">Sức chứa: {room.capacity ?? room.roomType.capacity ?? 2} khách</span>
                        </div>
                      )}

                      {/* Có khách */}
                      {displayStatus === "OCCUPIED" && activeBooking && (
                        <div className="space-y-0.5 min-w-0 text-right">
                          <div className="font-bold text-xs text-foreground flex items-center justify-end gap-1 truncate" title={activeBooking.customerName}>
                            <span className="text-sm shrink-0" title={activeBooking.nationality || "Việt Nam"}>
                              {getFlagEmoji(activeBooking.nationality)}
                            </span>
                            <span className="truncate">{activeBooking.customerName}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {formatDate(activeBooking.checkInDate).split(" ")[0]} - {formatDate(activeBooking.checkOutDate).split(" ")[0]}
                          </div>
                          {room.status === "MAINTENANCE" && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0 mt-1 animate-pulse border-none">
                              🛠️ Bảo trì nóng
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Đã đặt */}
                      {displayStatus === "RESERVED" && activeBooking && (
                        <div className="space-y-0.5 min-w-0 text-right">
                          <div className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center justify-end gap-1 truncate" title={activeBooking.customerName}>
                            <span className="text-sm shrink-0" title={activeBooking.nationality || "Việt Nam"}>
                              {getFlagEmoji(activeBooking.nationality)}
                            </span>
                            <span className="truncate">{activeBooking.customerName}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            Nhận: {formatDate(activeBooking.checkInDate).split(" ")[0]}
                          </div>
                          {room.status === "MAINTENANCE" && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0 mt-1 animate-pulse border-none">
                              🛠️ Bảo trì nóng
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Bẩn */}
                      {displayStatus === "DIRTY" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 px-2.5 py-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveRoom({
                              id: room.id,
                              roomNumber: room.roomNumber,
                              floor: room.floor,
                              status: "AVAILABLE",
                              roomTypeId: room.roomTypeId,
                              pricePerNight: room.pricePerNight ?? room.roomType.pricePerNight,
                              maxGuests: room.capacity ?? room.roomType.capacity ?? 2,
                              description: room.note || ""
                            });
                          }}
                        >
                          Dọn xong 🧹
                        </Button>
                      )}

                      {/* Bảo trì */}
                      {displayStatus === "MAINTENANCE" && activeMaintenance && (
                        <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-medium block truncate" title={activeMaintenance.description}>
                          {activeMaintenance.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Giá tiền & Nguồn & Sửa */}
                  <div className="border-t pt-2 flex justify-between items-center text-[10px] text-muted-foreground pl-1.5 mt-1 shrink-0">
                    <span className="font-bold text-foreground/80 font-mono">
                      {formatCurrency(Number(room.pricePerNight ?? room.roomType.pricePerNight))}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Hiển thị nguồn đặt nếu có booking */}
                      {activeBooking && (displayStatus === "OCCUPIED" || displayStatus === "RESERVED") && (
                        <Badge variant="secondary" className="text-[8px] font-bold px-1 py-0 bg-background/50 text-muted-foreground">
                          {activeBooking.bookingSource === "WALK_IN" ? "Walk-in" : activeBooking.bookingSource}
                        </Badge>
                      )}
                      
                      {isSuperAdmin && (
                        <button 
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 duration-200"
                          onClick={(e) => { e.stopPropagation(); openForm(room); }}
                          title="Sửa thông tin phòng"
                        >
                          <Edit className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
             );
           })}
        </div>
      )}
    </div>
  );
}