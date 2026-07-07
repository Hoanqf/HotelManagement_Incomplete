"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { CustomerAPI } from "@/services/customer.service";
import { 
  Users, Search, Plus, Edit, Trash2, Loader2, Contact, 
  MapPin, Eye, BookOpen, Sparkles, Receipt, Calendar, CreditCard, ChevronRight
} from "lucide-react";

// Danh sách gợi ý quốc tịch phổ biến
const POPULAR_NATIONALITIES = ["Việt Nam", "Mỹ", "Anh", "Ireland", "Hàn Quốc", "Nhật Bản", "Trung Quốc", "Pháp", "Đức", "Úc", "Singapore"];

function getFlagEmoji(nationality: string) {
  if (!nationality) return "🏳️";
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getBookingStatusBadge(status: string) {
  switch (status) {
    case "CHECKED_IN":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">Có khách</Badge>;
    case "CHECKED_OUT":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Đã trả phòng</Badge>;
    case "CONFIRMED":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">Đã xác nhận</Badge>;
    case "PENDING":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300">Đang chờ</Badge>;
    case "CANCELLED":
      return <Badge variant="outline" className="text-muted-foreground border-muted">Đã hủy</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    nationality: "Việt Nam",
    identityCard: "",
    notes: ""
  });

  const [saving, setSaving] = useState(false);

  // 1. Tải danh sách khách hàng
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await CustomerAPI.getCustomers();
      setCustomers(data);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // 2. Mở form thêm mới/sửa khách hàng
  const openForm = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email || "",
        nationality: customer.nationality || "Việt Nam",
        identityCard: customer.identityCard || "",
        notes: customer.notes || ""
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        fullName: "",
        phoneNumber: "",
        email: "",
        nationality: "Việt Nam",
        identityCard: "",
        notes: ""
      });
    }
    setIsFormOpen(true);
  };

  // 3. Xử lý Lưu thông tin
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phoneNumber.trim()) {
      toast.error("Vui lòng điền Họ tên và Số điện thoại");
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        // Cập nhật khách hàng
        const res = await CustomerAPI.updateCustomer(editingCustomer.id, formData);
        toast.success("Cập nhật thông tin khách hàng thành công!");
      } else {
        // Thêm mới khách hàng
        const res = await CustomerAPI.createCustomer(formData);
        toast.success("Thêm mới khách hàng thành công!");
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message || "Lỗi xử lý lưu thông tin khách hàng");
    } finally {
      setSaving(false);
    }
  };

  // 4. Xóa khách hàng
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"? Các hóa đơn cũ sẽ được giữ lại nhưng bị gỡ liên kết.`)) {
      return;
    }
    try {
      await CustomerAPI.deleteCustomer(id);
      toast.success("Xóa thông tin khách hàng thành công");
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa khách hàng");
    }
  };

  // 5. Xem chi tiết khách hàng và lịch sử đặt phòng
  const handleViewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setIsDetailOpen(true);
      const data = await CustomerAPI.getCustomerById(id);
      setViewingCustomer(data);
    } catch (error: any) {
      toast.error("Không thể tải chi tiết lịch sử đặt phòng");
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Lọc danh sách khách hàng
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      (c.identityCard && c.identityCard.includes(q)) ||
      (c.nationality && c.nationality.toLowerCase().includes(q))
    );
  });

  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const vipCount = customers.filter(c => (c.bookingCount || 0) >= 5).length;

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col transition-all duration-300">
        <AppHeader />
        
        <main className="flex-1 p-6 space-y-6 text-left">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Contact className="size-8 text-blue-600" />
                Quản lý khách hàng
              </h1>
              <p className="text-muted-foreground mt-1">
                Lưu trữ hồ sơ khách hàng, tra cứu nhanh lịch sử lưu trú và theo dõi doanh thu tích lũy.
              </p>
            </div>
            <Button onClick={() => openForm()} className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <Plus className="mr-2 size-4" /> Thêm khách hàng
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số khách hàng</CardTitle>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <Users className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Hồ sơ khách hàng được lưu trữ</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu tích lũy</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <CreditCard className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Từ các lượt check-out hợp lệ</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Khách hàng thân thiết (VIP)</CardTitle>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                  <Sparkles className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{vipCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Khách hàng có từ 5 lượt đặt trở lên</p>
              </CardContent>
            </Card>
          </div>

          {/* Tìm kiếm & Bảng danh sách */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Danh sách hồ sơ khách hàng</CardTitle>
                  <CardDescription>Tìm kiếm nhanh theo tên, số điện thoại hoặc quốc tịch.</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tìm tên, SĐT, quốc tịch, CCCD..." 
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin size-8 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Đang tải dữ liệu hồ sơ khách hàng...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Contact className="size-12 text-muted-foreground/50 mb-3" />
                  <p className="font-semibold text-lg">Không tìm thấy khách hàng nào</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Bắt đầu thêm hồ sơ khách hàng đầu tiên"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ và Tên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quốc tịch</TableHead>
                      <TableHead>CCCD / Hộ chiếu</TableHead>
                      <TableHead className="text-center">Số lần đặt</TableHead>
                      <TableHead className="text-right">Tổng chi tiêu</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-bold text-foreground">{c.fullName}</div>
                          {c.notes && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 italic max-w-xs truncate mt-0.5">
                              * {c.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{c.phoneNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{c.email || "-"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-sm">{getFlagEmoji(c.nationality)}</span>
                            <span className="text-xs">{c.nationality}</span>
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.identityCard || "-"}</TableCell>
                        <TableCell className="text-center font-semibold">
                          <Badge variant={(c.bookingCount || 0) >= 5 ? "default" : "outline"} className={(c.bookingCount || 0) >= 5 ? "bg-amber-600 hover:bg-amber-600" : ""}>
                            {c.bookingCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.totalSpend || 0)}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(c.id)} title="Lịch sử đặt phòng">
                            <Eye className="size-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openForm(c)} title="Sửa thông tin">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id, c.fullName)} title="Xóa khách hàng">
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* dialog Form THÊM / SỬA KHÁCH HÀNG */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Chỉnh sửa hồ sơ khách hàng" : "Thêm hồ sơ khách hàng mới"}</DialogTitle>
                <DialogDescription>Nhập thông tin chi tiết của khách hàng để lưu trữ vào hệ thống.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Nguyễn Văn A" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input 
                      id="phone" 
                      placeholder="09xxxxxxxx" 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Quốc tịch</Label>
                    <select
                      id="nationality"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.nationality}
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    >
                      {POPULAR_NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                      {!POPULAR_NATIONALITIES.includes(formData.nationality) && (
                        <option value={formData.nationality}>{formData.nationality}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="example@gmail.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="identityCard">Số CCCD / Hộ chiếu</Label>
                    <Input 
                      id="identityCard" 
                      placeholder="012345678901" 
                      value={formData.identityCard}
                      onChange={(e) => setFormData({...formData, identityCard: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú đặc điểm / Yêu cầu</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Khách thích tầng cao, dị ứng hải sản, VIP..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="animate-spin mr-2 size-4" />}
                    Lưu hồ sơ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* dialog CHI TIẾT & LỊCH SỬ ĐẶT PHÒNG */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col justify-between">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="size-5 text-blue-600" />
                  Lịch sử lưu trú khách hàng
                </DialogTitle>
                <DialogDescription>
                  Xem chi tiết hồ sơ lưu trữ và danh sách tất cả các lượt đặt phòng của khách hàng.
                </DialogDescription>
              </DialogHeader>

              {detailLoading || !viewingCustomer ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin size-8 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Đang tải lịch sử đặt phòng...</p>
                </div>
              ) : (
                <div className="space-y-6 overflow-y-auto pr-2 py-2 flex-1">
                  {/* Hồ sơ tóm tắt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-muted/20">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Thông tin cá nhân</div>
                      <div className="text-lg font-bold text-foreground">{viewingCustomer.fullName}</div>
                      <div className="text-sm text-muted-foreground">📞 Số điện thoại: <strong>{viewingCustomer.phoneNumber}</strong></div>
                      <div className="text-sm text-muted-foreground">✉️ Email: <strong>{viewingCustomer.email || "-"}</strong></div>
                    </div>
                    <div className="space-y-2 md:border-l md:pl-6">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Thông tin lưu trú</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        🌍 Quốc tịch: <strong>{getFlagEmoji(viewingCustomer.nationality)} {viewingCustomer.nationality}</strong>
                      </div>
                      <div className="text-sm text-muted-foreground">🪪 CCCD / Passport: <strong>{viewingCustomer.identityCard || "-"}</strong></div>
                      <div className="text-sm text-muted-foreground">
                        💰 Chi tiêu tích lũy: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(viewingCustomer.totalSpend)}</strong>
                      </div>
                    </div>
                    {viewingCustomer.notes && (
                      <div className="col-span-2 pt-2 border-t text-sm text-amber-700 dark:text-amber-400 italic">
                        📌 Ghi chú: {viewingCustomer.notes}
                      </div>
                    )}
                  </div>

                  {/* Lịch sử đặt phòng */}
                  <div className="space-y-3">
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Receipt className="size-4 text-muted-foreground" />
                      Danh sách đặt phòng ({viewingCustomer.bookingCount || 0} lượt)
                    </div>

                    {viewingCustomer.bookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-6 border border-dashed rounded-lg">Khách hàng chưa có lịch sử đặt phòng nào trên hệ thống.</p>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Phòng</TableHead>
                              <TableHead>Thời gian thuê</TableHead>
                              <TableHead>Hình thức</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead className="text-right">Tổng tiền</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {viewingCustomer.bookings.map((b: any) => (
                              <TableRow key={b.id}>
                                <TableCell className="font-bold">
                                  Phòng {b.room?.roomNumber} 
                                  <span className="text-[10px] text-muted-foreground block font-normal">
                                    {b.room?.roomType?.name}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex flex-col">
                                    <span>Từ: {formatDate(b.checkInDate)}</span>
                                    <span>Đến: {formatDate(b.checkOutDate)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-semibold">
                                    {b.bookingType === "HOURLY" ? "Theo giờ" : b.bookingType === "OVERNIGHT" ? "Qua đêm" : "Theo ngày"}
                                  </span>
                                </TableCell>
                                <TableCell>{getBookingStatusBadge(b.status)}</TableCell>
                                <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(Number(b.totalAmount))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter className="pt-4 border-t shrink-0">
                <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
