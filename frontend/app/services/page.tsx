"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Utensils,
  Plus,
  Coffee,
  Car,
  Shirt,
  Waves,
  ConciergeBell,
  Search,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { ServiceAPI } from "@/services/service.service";
import { toast } from "sonner";

// Hàm ánh xạ Icon dựa trên tên dịch vụ
function getServiceIcon(name: string) {
  const lowercaseName = name.toLowerCase();
  if (
    lowercaseName.includes("ăn") ||
    lowercaseName.includes("uống") ||
    lowercaseName.includes("buffet") ||
    lowercaseName.includes("sáng") ||
    lowercaseName.includes("trưa") ||
    lowercaseName.includes("tối") ||
    lowercaseName.includes("cơm") ||
    lowercaseName.includes("nhà hàng")
  ) {
    return Coffee;
  }
  if (
    lowercaseName.includes("giặt") ||
    lowercaseName.includes("ủi") ||
    lowercaseName.includes("sấy") ||
    lowercaseName.includes("laundry")
  ) {
    return Shirt;
  }
  if (
    lowercaseName.includes("spa") ||
    lowercaseName.includes("massage") ||
    lowercaseName.includes("tắm") ||
    lowercaseName.includes("trị liệu") ||
    lowercaseName.includes("xông hơi")
  ) {
    return Waves;
  }
  if (
    lowercaseName.includes("xe") ||
    lowercaseName.includes("đón") ||
    lowercaseName.includes("tiễn") ||
    lowercaseName.includes("sân bay") ||
    lowercaseName.includes("airport") ||
    lowercaseName.includes("transport")
  ) {
    return Car;
  }
  return ConciergeBell;
}

// Định dạng giá tiền VNĐ
function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State cho dialog Thêm/Sửa
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "Lượt",
    status: "ACTIVE",
  });

  // Tải danh sách dịch vụ
  const loadServices = async () => {
    try {
      const data = await ServiceAPI.getServices();
      setServices(data);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải danh sách dịch vụ");
    }
  };

  useEffect(() => {
    loadServices().finally(() => setLoading(false));
  }, []);

  // Mở Form Thêm/Sửa
  const openForm = (service?: any) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        price: service.price.toString(),
        unit: service.unit || "Lượt",
        status: service.status,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        price: "",
        unit: "Lượt",
        status: "ACTIVE",
      });
    }
    setIsDialogOpen(true);
  };

  // Submit Form Lưu Dịch vụ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      if (editingService) {
        // Cập nhật dịch vụ
        await ServiceAPI.updateService(editingService.id, {
          name: formData.name,
          price: Number(formData.price),
          unit: formData.unit,
          status: formData.status,
        });
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        // Tạo dịch vụ mới
        await ServiceAPI.createService({
          name: formData.name,
          price: Number(formData.price),
          unit: formData.unit,
          status: formData.status,
        });
        toast.success("Thêm dịch vụ mới thành công!");
      }
      setIsDialogOpen(false);
      window.dispatchEvent(new Event("refresh-notifications"));
      loadServices();
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu dịch vụ");
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa dịch vụ
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này cũng sẽ xóa liên kết dịch vụ trong lịch sử đặt phòng!")) {
      try {
        await ServiceAPI.deleteService(id);
        toast.success("Xóa dịch vụ thành công!");
        window.dispatchEvent(new Event("refresh-notifications"));
        loadServices();
      } catch (error: any) {
        toast.error(error.message || "Không thể xóa dịch vụ");
      }
    }
  };

  // Lọc danh sách dịch vụ theo tìm kiếm và trạng thái
  const filteredServices = services.filter((s) => {
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Dịch vụ" subtitle="Quản lý các dịch vụ đi kèm của khách sạn" />

        <main className="flex-1 overflow-auto p-6">
          {/* Header toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quản lý dịch vụ</h2>
              <p className="text-sm text-muted-foreground">
                Cung cấp và định giá các gói tiện ích cho khách lưu trú (nhà hàng, giặt là, spa...)
              </p>
            </div>

            <Button onClick={() => openForm()} className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              Thêm dịch vụ
            </Button>
          </div>

          {/* Bộ lọc tìm kiếm */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm dịch vụ..."
                className="pl-9 w-full sm:max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex h-64 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/5">
              <p className="text-sm">Không tìm thấy dịch vụ nào phù hợp</p>
            </div>
          ) : (
            <>
              {/* Chế độ xem Grid Cards */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {filteredServices.map((service) => {
                  const Icon = getServiceIcon(service.name);

                  return (
                    <Card key={service.id} className="hover:border-primary/40 transition-colors flex flex-col justify-between">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="rounded-full bg-primary/10 p-3 text-primary">
                            <Icon className="size-5" />
                          </div>

                          <Badge
                            className={
                              service.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                            variant="outline"
                          >
                            {service.status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động"}
                          </Badge>
                        </div>

                        <h3 className="mt-4 font-bold text-lg text-left">
                          {service.name}
                        </h3>

                        <p className="text-xs text-muted-foreground text-left mt-0.5">
                          Đơn vị tính: {service.unit || "Lượt"}
                        </p>

                        <p className="mt-3 text-2xl font-black text-primary text-left">
                          {formatCurrency(service.price)}
                        </p>

                        <div className="mt-5 flex gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => openForm(service)}
                          >
                            <Edit className="size-3.5 mr-1" />
                            Sửa
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="size-3.5 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Chế độ xem Danh sách bảng */}
              <Card className="mt-6">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold">Bảng danh mục chi tiết</CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="p-4 font-semibold">Tên dịch vụ</th>
                          <th className="p-4 font-semibold">Đơn vị tính</th>
                          <th className="p-4 font-semibold">Giá cả</th>
                          <th className="p-4 font-semibold">Trạng thái</th>
                          <th className="p-4 font-semibold text-right">Hành động</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredServices.map((service) => (
                          <tr key={service.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-medium text-foreground">{service.name}</td>
                            <td className="p-4 text-muted-foreground">{service.unit || "Lượt"}</td>
                            <td className="p-4 font-bold text-primary">{formatCurrency(service.price)}</td>
                            <td className="p-4">
                              <Badge
                                className={
                                  service.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                                variant="outline"
                              >
                                {service.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng"}
                              </Badge>
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(service)}>
                                <Edit className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(service.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Dialog Thêm/Sửa Dịch vụ */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editingService ? "Chỉnh sửa thông tin dịch vụ" : "Tạo dịch vụ mới"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="grid gap-4 py-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-semibold">Tên dịch vụ <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Ăn sáng buffet, Nước khoáng Lavie..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="font-semibold">Đơn giá (VNĐ) <span className="text-red-500">*</span></Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="150000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="unit" className="font-semibold">Đơn vị tính</Label>
                    <Input
                      id="unit"
                      placeholder="Ví dụ: Lượt, Kg, Giờ, Chai..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="font-semibold">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="mt-5 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xác nhận
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}