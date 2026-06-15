"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Clock, Wrench, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getMaintenanceStaff } from "@/lib/mock-data";
import { MaintenanceRecordWithDetails, RoomWithType, User } from "@/lib/types";

interface MaintenanceTabProps {
  rooms: RoomWithType[];
  maintenanceRecords: any[];
  onAddMaintenance: (record: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  formatCurrency: (amount: number) => string;
}

function getStatusLabel(status: string) {
  if (status === "IN_PROGRESS") return "Đang sửa chữa";
  if (status === "WAITING_PARTS") return "Chờ linh kiện";
  if (status === "COMPLETED") return "Đã hoàn thành";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function getStatusClass(status: string) {
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "WAITING_PARTS") return "bg-purple-100 text-purple-800 border-purple-200";
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "CANCELLED") return "bg-red-100 text-red-800 border-red-200";
  return "bg-secondary text-secondary-foreground";
}

export function MaintenanceTab({
  rooms, maintenanceRecords, onAddMaintenance, onUpdateStatus, formatCurrency
}: MaintenanceTabProps) {
  // State Dialog cục bộ
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("0");

  const handleOpen = () => {
    setRoomId("");
    setStaffId("");
    setDescription("");
    setCost("0");
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!roomId) {
      alert("Vui lòng chọn phòng cần bảo trì!");
      return;
    }

    onAddMaintenance({
      roomId,
      description,
      repairCost: parseFloat(cost) || 0,
      startDate: new Date().toISOString(),
      remarks: staffId ? `Giao cho nhân viên ID: ${staffId}` : ""
    });
    setIsOpen(false);
  };

  // Tính số liệu cho Cards
  const inProgressCount = maintenanceRecords.filter(r => ["IN_PROGRESS", "WAITING_PARTS", "PENDING"].includes(r.status)).length;
  const completedCount = maintenanceRecords.filter(r => r.status === "COMPLETED").length;
  const totalCost = maintenanceRecords.reduce((sum, r) => sum + r.repairCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Nhật ký bảo trì phòng</h2>
        <Button onClick={handleOpen} className="bg-primary">
          <Plus className="mr-2 size-4" /> Bắt đầu bảo trì
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phòng</TableHead>
              <TableHead>Mô tả sự cố</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead className="text-right">Chi phí</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Cập nhật trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Chưa có phòng nào được đưa vào danh sách bảo trì.
                </TableCell>
              </TableRow>
            ) : (
              maintenanceRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-bold">{record.room?.roomNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.description}</TableCell>
                  <TableCell>
                    {record.startDate ? format(new Date(record.startDate), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    {record.endDate ? format(new Date(record.endDate), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(record.repairCost)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", getStatusClass(record.status))}>
                      {record.status === "IN_PROGRESS" && <Clock className="mr-1 size-3 inline" />}
                      {record.status === "WAITING_PARTS" && <AlertTriangle className="mr-1 size-3 inline" />}
                      {record.status === "COMPLETED" && <CheckCircle className="mr-1 size-3 inline" />}
                      {record.status === "CANCELLED" && <XCircle className="mr-1 size-3 inline" />}
                      {getStatusLabel(record.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {["IN_PROGRESS", "WAITING_PARTS", "PENDING"].includes(record.status) ? (
                      <Select
                        value={record.status === "PENDING" ? "IN_PROGRESS" : record.status}
                        onValueChange={(newStatus) => onUpdateStatus(record.id, newStatus)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs ml-auto">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PROGRESS">Đang sửa chữa</SelectItem>
                          <SelectItem value="WAITING_PARTS">Chờ linh kiện</SelectItem>
                          <SelectItem value="COMPLETED">Đã sửa xong</SelectItem>
                          <SelectItem value="CANCELLED">Hủy bỏ</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Đã đóng</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Đang bảo trì</p>
              <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            </div>
            <Clock className="size-8 text-amber-500 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Đã sửa xong</p>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </div>
            <CheckCircle className="size-8 text-emerald-500 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Tổng chi phí</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
            </div>
            <Wrench className="size-8 text-blue-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      {/* --- DIALOG BẮT ĐẦU BẢO TRÌ NỘI BỘ --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Bắt đầu bảo trì phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <Label className="font-semibold">Chọn phòng cần bảo trì *</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter(r => r.status !== "MAINTENANCE")
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        Phòng {r.roomNumber} ({r.status === "AVAILABLE" ? "Sẵn sàng" : r.status === "DIRTY" ? "Chưa dọn" : "Đang có khách"})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold">Nhân viên phụ trách</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger><SelectValue placeholder="Chọn nhân viên (Không bắt buộc)" /></SelectTrigger>
                <SelectContent>
                  {getMaintenanceStaff().map((u: User) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Chi phí sửa chữa dự kiến (VNĐ)</Label>
              <Input 
                type="number" 
                placeholder="Ví dụ: 500000" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Mô tả chi tiết sự cố</Label>
              <Textarea 
                placeholder="Điều hòa hỏng block, vòi sen rò rỉ nước..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="px-6">Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
