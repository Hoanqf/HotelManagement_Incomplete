"use client";

import { useState } from "react";
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
  UtensilsCrossed, Sofa, Bath, Lock, Coffee, Shirt, Search 
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
  filteredRooms, statusFilter, setStatusFilter,
  floorFilter, setFloorFilter, typeFilter, setTypeFilter,
  filterOptions, floors, roomTypes, amenities, viewMode, setViewMode,
  formatCurrency, onRoomClick, onSaveRoom, onDeleteRoom,
  searchQuery, setSearchQuery
}: RoomsTabProps) {
  
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
      {/* Bộ lọc */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
                {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.value === "all" ? "Tất cả phòng" : opt.label}
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
          
          <Button onClick={() => openForm()} className="bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Thêm phòng
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="list"><List className="size-4 mr-2" /> Bảng</TabsTrigger>
            <TabsTrigger value="grid"><LayoutGrid className="size-4 mr-2" /> Lưới</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingRoom ? `Chỉnh sửa phòng: ${editingRoom.roomNumber}` : "Thêm phòng mới"}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
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
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="px-8">Lưu</Button>
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
                const isReserved = room.status === "AVAILABLE" && activeBooking && (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED");
                const displayStatus = isReserved ? "RESERVED" : room.status;

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
                      {room.status === "OCCUPIED" && activeBooking ? (
                        <span className="text-xs text-amber-700 font-medium">
                          👤 Khách: {activeBooking.customerName} (đến {formatDate(activeBooking.checkOutDate)})
                        </span>
                      ) : isReserved && activeBooking ? (
                        <span className="text-xs text-purple-700 font-medium">
                          📅 Đã đặt: {activeBooking.customerName} (từ {formatDate(activeBooking.checkInDate)})
                        </span>
                      ) : room.status === "MAINTENANCE" && activeMaintenance ? (
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
                      {room.status === "OCCUPIED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs font-semibold mr-2"
                          onClick={() => onRoomClick(room)}
                        >
                          Dịch vụ
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openForm(room)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteRoom(room.id)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           {filteredRooms.map((room: any) => {
            const activeBooking = room.bookings?.[0];
            const activeMaintenance = room.maintenance?.[0];
            const isReserved = room.status === "AVAILABLE" && activeBooking && (activeBooking.status === "PENDING" || activeBooking.status === "CONFIRMED");
            const displayStatus = isReserved ? "RESERVED" : room.status;

            return (
              <Card key={room.id} className="relative group cursor-pointer border-2 hover:border-primary/50 transition-colors flex flex-col justify-between">
                <CardContent className="p-4 flex flex-col flex-1 justify-between" onClick={() => onRoomClick(room)}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-left">Phòng {room.roomNumber}</h3>
                      <RoomStatusBadge status={displayStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground text-left">{room.roomType.name}</p>
                    <div className="flex gap-2 my-3 h-5">
                      {amenities
                        .filter((a) => getRoomAmenities(room).some((dbName: string) => dbName.toLowerCase() === a.name.toLowerCase()))
                        .slice(0, 6)
                        .map((a: Amenity) => {
                          const Icon = amenityIcons[a.icon] || Wifi;
                          return <Icon key={a.id} className="size-4 text-primary/70" />;
                        })}
                    </div>
                  </div>

                  <div className="mt-2 text-left flex-1 min-h-[40px]">
                    {room.status === "OCCUPIED" && activeBooking && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 leading-tight">
                        👤 {activeBooking.customerName} <br />
                        <span className="text-[10px] text-amber-600">Đến: {formatDate(activeBooking.checkOutDate)}</span>
                      </p>
                    )}
                    {isReserved && activeBooking && (
                      <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100 leading-tight">
                        📅 Đã đặt: {activeBooking.customerName} <br />
                        <span className="text-[10px] text-purple-600">Từ: {formatDate(activeBooking.checkInDate)}</span>
                      </p>
                    )}
                    {room.status === "MAINTENANCE" && activeMaintenance && (
                      <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100 leading-tight">
                        🔧 Bảo trì: {activeMaintenance.description}
                      </p>
                    )}
                  </div>

                  {room.status === "DIRTY" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 w-full mt-3 h-8 text-xs font-semibold"
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
                      Xác nhận đã dọn dẹp
                    </Button>
                  )}
                  <div className="mt-4 flex justify-between items-center border-t pt-3">
                    <span className="font-bold text-primary">{formatCurrency(room.pricePerNight ?? room.roomType.pricePerNight)}</span>
                    <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openForm(room); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}