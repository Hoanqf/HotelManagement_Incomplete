"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAPI } from "@/services/user.service";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  Save, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Lock,
  Info,
  UserCircle,
  Upload,
  Loader2,
  X,
  Eye,
  EyeOff,
  PlusCircle,
  Plus,
} from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { key: "DASHBOARD", name: "Tổng quan (Dashboard)", desc: "Xem biểu đồ doanh thu, số liệu tổng hợp hệ thống" },
  { key: "ROOMS", name: "Quản lý phòng (Rooms)", desc: "Xem trạng thái, sơ đồ phòng, dọn dẹp" },
  { key: "BOOKINGS", name: "Đặt phòng (Bookings)", desc: "Đặt phòng mới, nhận/trả phòng (Check-in/Check-out)" },
  { key: "CUSTOMERS", name: "Quản lý khách hàng (Customers)", desc: "Xem danh sách khách hàng, lịch sử đặt và chi tiêu" },
  { key: "SERVICES", name: "Dịch vụ phòng (Services)", desc: "Gọi món, dịch vụ giặt là, spa cho khách hàng" },
  { key: "INVOICES", name: "Hóa đơn & In ấn (Invoices)", desc: "Xuất hóa đơn, thanh toán, in hóa đơn thanh toán" },
  { key: "INVENTORY", name: "Quản lý kho (Inventory)", desc: "Nhập xuất hàng hóa tiêu dùng, đồ uống, trang thiết bị" },
  { key: "FINANCE", name: "Thu chi (Finance)", desc: "Ghi chép giao dịch, quỹ tiền mặt và dòng tiền thu chi" },
  { key: "REPORTS", name: "Thống kê (Reports)", desc: "Xem báo cáo biểu đồ doanh thu theo ngày, tháng, năm" },
  { key: "USERS", name: "Tài khoản & Phân quyền (Users)", desc: "Quản lý danh sách nhân viên, gán vai trò và cấu hình quyền" },
];

const getDefaultPermissions = (role: string): string[] => {
  switch (role) {
    case "SUPERADMIN":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY", "FINANCE", "REPORTS", "USERS"];
    case "ADMIN":
    case "MANAGER":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY", "FINANCE", "REPORTS"];
    case "STAFF":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY"];
    default:
      return [];
  }
};

export default function AddUserPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);


  // 1. State quản lý dữ liệu - Dùng CamelCase khớp với Prisma Schema của bạn
  const [formData, setFormData] = useState({
    usercode: "",
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    avatarUrl: "",
    role: "STAFF",
    status: "ACTIVE",
    positionId: "",
    permissions: getDefaultPermissions("STAFF") as string[],
  });

  // 2. Lấy danh sách chức vụ (Positions)
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await UserAPI.getPositions();
        // Kiểm tra an toàn để không bị lỗi .map()
        if (Array.isArray(data)) {
          setPositions(data);
        } else if (data && Array.isArray(data.data)) {
          setPositions(data.data);
        } else {
          setPositions([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chức vụ:", error);
        setPositions([]); 
      }
    };
    fetchPositions();
  }, []);

  // Tự động đồng bộ Vai trò hệ thống khi chọn Chức vụ
  useEffect(() => {
    if (formData.positionId && positions.length > 0) {
      const selectedPos = positions.find(p => p.id.toString() === formData.positionId);
      if (selectedPos) {
        const name = selectedPos.position_name.toUpperCase();
        let newRole = "STAFF";
        if (name === "ADMIN") {
          newRole = "ADMIN";
        } else if (name.includes("QUẢN LÝ") || name.includes("MANAGER") || name.includes("TRƯỞNG BỘ PHẬN")) {
          newRole = "MANAGER";
        } else {
          newRole = "STAFF";
        }
        setFormData(prev => ({ 
          ...prev, 
          role: newRole,
          permissions: getDefaultPermissions(newRole)
        }));
      }
    }
  }, [formData.positionId, positions]);

  // 3. Hàm Upload ảnh đại diện bằng FileReader (Chuyển sang Base64 rồi upload lên server local)
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn dung lượng file tải lên (ví dụ: < 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện phải nhỏ hơn 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await UserAPI.uploadAvatar(base64Data);
          if (res.url) {
            setFormData(prev => ({ ...prev, avatarUrl: res.url }));
            toast.success("Tải ảnh đại diện thành công!");
          } else {
            toast.error("Không nhận được URL ảnh đại diện");
          }
        } catch (uploadError: any) {
          toast.error("Lỗi khi tải ảnh lên server: " + uploadError.message);
        } finally {
          setUploading(false);
        }
      };
    } catch (error: any) {
      toast.error("Không thể xử lý ảnh tải lên: " + error.message);
      setUploading(false);
    }
  };

  // 4. Xử lý lưu User
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chuyển đổi positionId sang Int nếu backend yêu cầu
      const submitData = {
        ...formData,
        positionId: formData.positionId ? parseInt(formData.positionId) : null
      };

      const res = await UserAPI.createUser(submitData);
      
      if (res) {
        toast.success("Thêm nhân viên mới thành công!"); // Hiện thông báo xanh
        setTimeout(() => {
          router.push("/users");
          router.refresh(); 
        }, 1500);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Không thể tạo nhân viên.");
    } finally {
      setLoading(false);
    }
  };
  // 5. State & hàm quản lý thêm chức vụ mới
  const [newPosName, setNewPosName] = useState("");
  const [isAddingPos, setIsAddingPos] = useState(false);
  const [posLoading, setPosLoading] = useState(false);

  const handleCreatePosition = async () => {
    if (!newPosName.trim()) return toast.error("Vui lòng nhập tên chức vụ");
    
    setPosLoading(true);
    try {
      const res = await UserAPI.createPosition({ position_name: newPosName });
      if (res.id) {
        toast.success("Thêm chức vụ mới thành công!");
        // Cập nhật danh sách dropdown
        setPositions(prev => [...prev, res]);
        // Tự động chọn chức vụ vừa tạo
        setFormData({ ...formData, positionId: res.id.toString() });
        // Reset form nhỏ
        setNewPosName("");
        setIsAddingPos(false);
      }
    } catch (error) {
      toast.error("Lỗi khi tạo chức vụ");
    } finally {
      setPosLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Thêm nhân viên" subtitle="Tạo tài khoản và phân quyền chức vụ" />

        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="mr-2 size-4" /> Quay lại danh sách
            </Button>

            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader className="border-b bg-background">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <UserPlus className="size-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Hồ sơ nhân viên mới</CardTitle>
                    <CardDescription>Thiết lập thông tin nhân sự</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-8">
                {/* PHẦN 1: ẢNH ĐẠI DIỆN & ĐỊNH DANH */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4">
                    <Label className="font-medium">Ảnh đại diện</Label>
                    <div className="relative group size-32 rounded-full border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                      {formData.avatarUrl ? (
                        <>
                          <img src={formData.avatarUrl} className="size-full object-cover" alt="avatar" />
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, avatarUrl: ""})}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="size-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground text-[10px]">
                          {uploading ? <Loader2 className="animate-spin size-6" /> : <Upload className="size-6 mb-1" />}
                          <span>Tải ảnh</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUploadImage} 
                        className="hidden" 
                        accept="image/*"
                      />
                      <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => fileInputRef.current?.click()} 
                      />
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usercode">Mã nhân viên *</Label>
                        <Input id="usercode" placeholder="NV-001" required value={formData.usercode} onChange={(e) => setFormData({...formData, usercode: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input id="fullName" placeholder="Nguyễn Văn A" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email công việc *</Label>
                      <Input id="email" type="email" placeholder="email@company.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </div>

                <hr className="border-dashed" />

                {/* PHẦN 2: LIÊN HỆ & CHỨC VỤ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Chức vụ (Position)</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-primary"
                        onClick={() => setIsAddingPos(!isAddingPos)}
                      >
                        {isAddingPos ? <X className="mr-1 size-3" /> : <Plus className="mr-1 size-3" />}
                        {isAddingPos ? "Hủy" : "Thêm mới"}
                      </Button>
                    </div>

                    {isAddingPos ? (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                        <Input 
                          placeholder="Tên chức vụ mới..." 
                          value={newPosName}
                          onChange={(e) => setNewPosName(e.target.value)}
                          className="h-9"
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          className="h-9"
                          onClick={handleCreatePosition}
                          disabled={posLoading}
                        >
                          {posLoading ? <Loader2 className="size-4 animate-spin" /> : "Lưu"}
                        </Button>
                      </div>
                    ) : (
                      <Select 
                        value={formData.positionId} 
                        onValueChange={(val) => setFormData({...formData, positionId: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chức vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.length > 0 ? (
                            positions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id.toString()}>{pos.position_name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>Chưa có chức vụ nào</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" placeholder="09xxxx" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                   </div>
                </div>

                {/* PHẦN 3: BẢO MẬT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Vai trò hệ thống</Label>
                  </div>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({
                      ...formData, 
                      role: val,
                      permissions: getDefaultPermissions(val)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN - Hệ thống Super Admin</SelectItem>
                      <SelectItem value="ADMIN">ADMIN - Quản trị viên</SelectItem>
                      <SelectItem value="MANAGER">MANAGER - Quản lý bộ phận</SelectItem>
                      <SelectItem value="STAFF">STAFF - Nhân viên nghiệp vụ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pass" className="font-medium">Mật khẩu khởi tạo *</Label>
                  <div className="relative">
                    {/* Icon khóa bên trái (nếu bạn muốn dùng cho đồng bộ) */}
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    
                    <Input 
                      id="pass" 
                      // Thay đổi type linh hoạt dựa trên state
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password" 
                      placeholder="Nhập mật khẩu" 
                      className="pl-9 pr-10" // pr-10 để chừa chỗ cho con mắt bên phải
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />

                    {/* Nút con mắt bên phải */}
                    <button
                      type="button" // Bắt buộc phải có type="button" để không bị submit form khi click
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

                <hr className="border-dashed my-6" />

                {/* PHẦN 4: QUYỀN TRUY CẬP CHỨC NĂNG */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold text-sm text-primary flex items-center gap-2">
                      <ShieldCheck className="size-5 text-blue-600" />
                      Quyền truy cập chức năng
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Chọn các phân hệ chức năng cho phép tài khoản này truy cập (Mặc định tự động điền theo Vai trò hệ thống)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.key);
                      return (
                        <label 
                          key={perm.key} 
                          className={`flex items-start p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-all ${
                            isChecked ? "border-blue-200 bg-blue-50/20 shadow-sm" : "border-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                const newPerms = checked 
                                  ? [...prev.permissions, perm.key]
                                  : prev.permissions.filter(k => k !== perm.key);
                                return { ...prev, permissions: newPerms };
                              });
                            }}
                          />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-foreground block">{perm.name}</span>
                            <span className="text-[10px] text-muted-foreground block leading-relaxed">{perm.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t bg-muted/10 p-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>Hủy bỏ</Button>
                <Button type="submit" disabled={loading || uploading}>
                  {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4" />}
                  Lưu thông tin
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </div>
  );
}